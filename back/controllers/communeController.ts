import type { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { Commune, sequelize } from '../models/index.js';
import { parseExcel } from '../services/importExcel.js';
import type { ProductType, CommuneData, FilialeCentroid } from '../types/index.js';
import {
  getFiliales, getDepartements, getDesserviesSet, getNonDesservies,
  aggregateByDepartment, aggregateByRegion,
} from '../utils/aggregation.js';
import { DEPT_CENTERS, computeCentroid } from '../utils/geo.js';

const VALID_PRODUCTS: ProductType[] = ['PP', 'ADBLUE', 'PELLETS_LIV', 'PELLETS_VRAC'];

function isValidProduct(v: string): v is ProductType {
  return VALID_PRODUCTS.includes(v as ProductType);
}

function parseList(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

async function loadCommuneData(): Promise<CommuneData[]> {
  const rows = await Commune.findAll({ order: [['codeInsee', 'ASC']] });
  return rows.map((r) => ({
    codeInsee: r.codeInsee,
    nom: r.nom,
    codePostal: r.codePostal,
    departement: r.departement,
    territoires: {
      PP: r.pp ?? null,
      ADBLUE: r.adblue ?? null,
      PELLETS_LIV: r.pelletsLiv ?? null,
      PELLETS_VRAC: r.pelletsVrac ?? null,
    },
  }));
}

// GET /api/communes
export async function getCommunes(_req: Request, res: Response): Promise<void> {
  try {
    const communes = await loadCommuneData();
    res.json(communes);
  } catch (err) {
    console.error('GET /api/communes error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/communes/status
export async function getStatus(_req: Request, res: Response): Promise<void> {
  try {
    const count = await Commune.count();
    const lastUpdated = await Commune.max('updatedAt');
    res.json({ count, lastUpdated });
  } catch (err) {
    console.error('GET /api/communes/status error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/upload
export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier recu' });
      return;
    }

    const sheetName = req.body.sheetName as string | undefined;
    const { communes, sheetNames } = await parseExcel(req.file.buffer, sheetName);

    if (communes.length === 0) {
      res.status(400).json({ error: 'Aucune commune trouvee dans le fichier' });
      return;
    }

    const transaction = await sequelize.transaction();
    try {
      await Commune.destroy({ where: {}, transaction });
      await Commune.bulkCreate(
        communes.map((c) => ({
          codeInsee: c.codeInsee,
          nom: c.nom,
          codePostal: c.codePostal,
          departement: c.departement,
          pp: c.pp,
          adblue: c.adblue,
          pelletsLiv: c.pelletsLiv,
          pelletsVrac: c.pelletsVrac,
        })),
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    res.json({ count: communes.length, sheetNames });
  } catch (err) {
    console.error('POST /api/upload error:', err);
    res.status(500).json({ error: 'Erreur lors du traitement du fichier' });
  }
}

// GET /api/communes/filters?product=PP
export async function getFiltersEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const product = String(req.query.product || 'PP');
    if (!isValidProduct(product)) {
      res.status(400).json({ error: 'Produit invalide' });
      return;
    }
    const communes = await loadCommuneData();
    res.json({
      filiales: getFiliales(communes, product),
      departements: getDepartements(communes),
    });
  } catch (err) {
    console.error('GET /api/communes/filters error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/communes/aggregations/departement?product=PP&filiales=A,B&departements=01,02
export async function getDeptAggregations(req: Request, res: Response): Promise<void> {
  try {
    const product = String(req.query.product || 'PP');
    if (!isValidProduct(product)) { res.status(400).json({ error: 'Produit invalide' }); return; }
    const filiales = parseList(req.query.filiales as string);
    const departements = parseList(req.query.departements as string);

    let communes = await loadCommuneData();
    if (departements.length > 0) {
      const deptSet = new Set(departements);
      communes = communes.filter(c => deptSet.has(c.departement));
    }

    const aggregations = aggregateByDepartment(communes, product, filiales);
    const totalCouvertes = aggregations.reduce((sum, d) => sum + d.communesCouvertes, 0);
    const totalCommunes = aggregations.reduce((sum, d) => sum + d.totalCommunes, 0);

    res.json({ aggregations, totalCouvertes, totalCommunes });
  } catch (err) {
    console.error('GET /api/communes/aggregations/departement error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/communes/aggregations/region?product=PP&filiales=A,B&departements=01,02
export async function getRegionAggregations(req: Request, res: Response): Promise<void> {
  try {
    const product = String(req.query.product || 'PP');
    if (!isValidProduct(product)) { res.status(400).json({ error: 'Produit invalide' }); return; }
    const filiales = parseList(req.query.filiales as string);
    const departements = parseList(req.query.departements as string);

    let communes = await loadCommuneData();
    if (departements.length > 0) {
      const deptSet = new Set(departements);
      communes = communes.filter(c => deptSet.has(c.departement));
    }

    const aggregations = aggregateByRegion(communes, product, filiales);
    res.json(aggregations);
  } catch (err) {
    console.error('GET /api/communes/aggregations/region error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/communes/centroids?product=PP&filiales=A,B
export async function getCentroids(req: Request, res: Response): Promise<void> {
  try {
    const product = String(req.query.product || 'PP');
    if (!isValidProduct(product)) { res.status(400).json({ error: 'Produit invalide' }); return; }
    const selectedFiliales = parseList(req.query.filiales as string);
    const filialeSet = new Set(selectedFiliales);

    const communes = await loadCommuneData();
    const filialeDepts = new Map<string, Set<string>>();
    const filialeNbCommunes = new Map<string, number>();

    for (const commune of communes) {
      const filiale = commune.territoires[product];
      if (!filiale || !filialeSet.has(filiale)) continue;
      if (!filialeDepts.has(filiale)) filialeDepts.set(filiale, new Set());
      filialeDepts.get(filiale)!.add(commune.departement);
      filialeNbCommunes.set(filiale, (filialeNbCommunes.get(filiale) ?? 0) + 1);
    }

    const allProducts: ProductType[] = ['PP', 'ADBLUE', 'PELLETS_LIV', 'PELLETS_VRAC'];
    const filialeProduits = new Map<string, Set<ProductType>>();
    for (const commune of communes) {
      for (const pt of allProducts) {
        const filiale = commune.territoires[pt];
        if (filiale && filialeDepts.has(filiale)) {
          if (!filialeProduits.has(filiale)) filialeProduits.set(filiale, new Set());
          filialeProduits.get(filiale)!.add(pt);
        }
      }
    }

    const results: FilialeCentroid[] = [];
    for (const [filiale, depts] of filialeDepts) {
      const deptCodes = Array.from(depts).sort();
      const points: [number, number][] = [];
      for (const dept of deptCodes) {
        const center = DEPT_CENTERS[dept];
        if (center) points.push(center);
      }
      const [lat, lng] = computeCentroid(points);
      results.push({
        filiale, lat, lng,
        nbCommunes: filialeNbCommunes.get(filiale) ?? 0,
        departements: deptCodes,
        produits: Array.from(filialeProduits.get(filiale) ?? []),
      });
    }

    res.json(results.sort((a, b) => b.nbCommunes - a.nbCommunes));
  } catch (err) {
    console.error('GET /api/communes/centroids error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/communes/non-desservies?product=PP&departements=01,02
export async function getNonDesserviesEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const product = String(req.query.product || 'PP');
    if (!isValidProduct(product)) { res.status(400).json({ error: 'Produit invalide' }); return; }
    const departements = parseList(req.query.departements as string);

    const communes = await loadCommuneData();
    const desserviesSet = getDesserviesSet(communes, product);
    const entries = getNonDesservies(desserviesSet, departements);

    res.json({ count: entries.length, communes: entries });
  } catch (err) {
    console.error('GET /api/communes/non-desservies error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/communes/non-desservies/export?product=PP&departements=01,02&format=xlsx|csv
export async function exportNonDesservies(req: Request, res: Response): Promise<void> {
  try {
    const product = String(req.query.product || 'PP');
    if (!isValidProduct(product)) { res.status(400).json({ error: 'Produit invalide' }); return; }
    const departements = parseList(req.query.departements as string);
    const format = String(req.query.format || 'csv');

    const communes = await loadCommuneData();
    const desserviesSet = getDesserviesSet(communes, product);
    const entries = getNonDesservies(desserviesSet, departements);

    const PRODUCT_LABELS: Record<ProductType, string> = {
      PP: 'Produits Petroliers',
      ADBLUE: 'AdBlue',
      PELLETS_LIV: 'Pellets Livraison',
      PELLETS_VRAC: 'Pellets Vrac',
    };

    const prodLabel = PRODUCT_LABELS[product].replace(/\s+/g, '-');
    const deptSuffix = departements.length > 0 && departements.length <= 5
      ? `_Dpt-${departements.join('-')}`
      : departements.length > 5 ? `_${departements.length}-depts` : '';
    const date = new Date().toISOString().slice(0, 10);

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Non desservies');
      worksheet.columns = [
        { header: 'Code INSEE', key: 'codeInsee', width: 12 },
        { header: 'Commune', key: 'nom', width: 30 },
        { header: 'Code Postal', key: 'cp', width: 10 },
        { header: 'Departement', key: 'dep', width: 12 },
        { header: 'Produit', key: 'produit', width: 20 },
      ];
      for (const e of entries) {
        worksheet.addRow({ ...e, produit: PRODUCT_LABELS[product] });
      }

      const filename = `Non-desservies_${prodLabel}${deptSuffix}_${date}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const filename = `Non-desservies_${prodLabel}${deptSuffix}_${date}.csv`;
      const headers = ['Code INSEE', 'Commune', 'Code Postal', 'Departement', 'Produit'];
      const lines = [
        headers.join(';'),
        ...entries.map(e =>
          [e.codeInsee, e.nom, e.cp, e.dep, PRODUCT_LABELS[product]]
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(';')
        ),
      ];
      const bom = '\uFEFF';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(bom + lines.join('\n'));
    }
  } catch (err) {
    console.error('GET /api/communes/non-desservies/export error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
