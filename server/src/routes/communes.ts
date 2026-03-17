import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import pool from '../db.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Traiter "VIDE" comme null
function cleanValue(v: string | null): string | null {
  if (!v || v.toUpperCase() === 'VIDE') return null;
  return v;
}

interface CommuneRow {
  codeInsee: string;
  nom: string;
  codePostal: string;
  departement: string;
  pp: string | null;
  adblue: string | null;
  pelletsLiv: string | null;
  pelletsVrac: string | null;
}

function parseExcel(buffer: Buffer, sheetName?: string): { communes: CommuneRow[]; sheetNames: string[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;

  const targetSheet = sheetName
    ?? sheetNames.find(n => n.toUpperCase().includes('ZONE'))
    ?? sheetNames[0];

  const worksheet = workbook.Sheets[targetSheet];
  if (!worksheet) throw new Error(`Onglet "${targetSheet}" introuvable`);

  const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: undefined,
    raw: false,
  });

  const dataRows = rows.slice(1);
  const communeMap = new Map<string, CommuneRow>();

  for (const row of dataRows) {
    const codeInsee = String(row[0] ?? '').trim();
    if (!codeInsee) continue;

    const values = {
      pp: cleanValue(String(row[5] ?? '').trim() || null),
      adblue: cleanValue(String(row[6] ?? '').trim() || null),
      pelletsLiv: cleanValue(String(row[7] ?? '').trim() || null),
      pelletsVrac: cleanValue(String(row[8] ?? '').trim() || null),
    };

    const existing = communeMap.get(codeInsee);
    if (existing) {
      if (!existing.pp && values.pp) existing.pp = values.pp;
      if (!existing.adblue && values.adblue) existing.adblue = values.adblue;
      if (!existing.pelletsLiv && values.pelletsLiv) existing.pelletsLiv = values.pelletsLiv;
      if (!existing.pelletsVrac && values.pelletsVrac) existing.pelletsVrac = values.pelletsVrac;
    } else {
      communeMap.set(codeInsee, {
        codeInsee,
        nom: String(row[1] ?? '').trim(),
        codePostal: String(row[2] ?? '').trim(),
        departement: String(row[4] ?? '').trim(),
        ...values,
      });
    }
  }

  return { communes: Array.from(communeMap.values()), sheetNames };
}

// GET /api/communes — retourne toutes les communes
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT code_insee, nom, code_postal, departement, pp, adblue, pellets_liv, pellets_vrac FROM communes ORDER BY code_insee'
    );

    const communes = rows.map(r => ({
      codeInsee: r.code_insee,
      nom: r.nom,
      codePostal: r.code_postal,
      departement: r.departement,
      territoires: {
        PP: r.pp,
        ADBLUE: r.adblue,
        PELLETS_LIV: r.pellets_liv,
        PELLETS_VRAC: r.pellets_vrac,
      },
    }));

    res.json(communes);
  } catch (err) {
    console.error('GET /api/communes error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/communes/status — métadonnées
router.get('/status', async (_req, res) => {
  try {
    const countResult = await pool.query('SELECT COUNT(*) as count FROM communes');
    const dateResult = await pool.query('SELECT MAX(updated_at) as last_updated FROM communes');

    res.json({
      count: parseInt(countResult.rows[0].count, 10),
      lastUpdated: dateResult.rows[0].last_updated,
    });
  } catch (err) {
    console.error('GET /api/communes/status error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/upload — reçoit un .xlsx et remplace toutes les données
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier reçu' });
      return;
    }

    const sheetName = req.body.sheetName as string | undefined;
    const { communes, sheetNames } = parseExcel(req.file.buffer, sheetName);

    if (communes.length === 0) {
      res.status(400).json({ error: 'Aucune commune trouvée dans le fichier' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('TRUNCATE communes');

      // Insert par batch de 500
      const batchSize = 500;
      for (let i = 0; i < communes.length; i += batchSize) {
        const batch = communes.slice(i, i + batchSize);
        const values: string[] = [];
        const params: (string | null)[] = [];

        batch.forEach((c, idx) => {
          const offset = idx * 8;
          values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
          params.push(c.codeInsee, c.nom, c.codePostal, c.departement, c.pp, c.adblue, c.pelletsLiv, c.pelletsVrac);
        });

        await client.query(
          `INSERT INTO communes (code_insee, nom, code_postal, departement, pp, adblue, pellets_liv, pellets_vrac) VALUES ${values.join(', ')}`,
          params
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ count: communes.length, sheetNames });
  } catch (err) {
    console.error('POST /api/upload error:', err);
    res.status(500).json({ error: 'Erreur lors du traitement du fichier' });
  }
});

export default router;
