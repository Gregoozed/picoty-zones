import type { CommuneData, CommuneRef, ProductType, DepartmentAggregation, RegionAggregation } from '../types';
import { referentiel } from './referentiel';

/** Set des codes INSEE desservis pour un produit */
export function getDesserviesSet(communes: CommuneData[], product: ProductType): Set<string> {
  const set = new Set<string>();
  for (const c of communes) {
    if (c.territoires[product]) set.add(c.codeInsee);
  }
  return set;
}

/** Communes non desservies (dans le référentiel mais pas dans l'Excel ou sans filiale pour le produit) */
export function getNonDesservies(
  desserviesSet: Set<string>,
  selectedDepartements: string[]
): { codeInsee: string; nom: string; cp: string; dep: string }[] {
  const deptSet = selectedDepartements.length > 0 ? new Set(selectedDepartements) : null;
  const result: { codeInsee: string; nom: string; cp: string; dep: string }[] = [];

  for (const [codeInsee, ref] of Object.entries(referentiel)) {
    if (desserviesSet.has(codeInsee)) continue;
    if (deptSet && !deptSet.has(ref.dep)) continue;
    result.push({ codeInsee, nom: ref.nom, cp: ref.cp || '', dep: ref.dep });
  }

  result.sort((a, b) => a.dep.localeCompare(b.dep) || a.nom.localeCompare(b.nom));
  return result;
}

/** Nombre de communes non desservies */
export function countNonDesservies(
  desserviesSet: Set<string>,
  selectedDepartements: string[]
): number {
  const deptSet = selectedDepartements.length > 0 ? new Set(selectedDepartements) : null;
  let count = 0;
  for (const [codeInsee, ref] of Object.entries(referentiel)) {
    if (desserviesSet.has(codeInsee)) continue;
    if (deptSet && !deptSet.has(ref.dep)) continue;
    count++;
  }
  return count;
}

// Mapping département → région (codes INSEE)
const DEPT_TO_REGION: Record<string, string> = {
  '01': '84', '02': '32', '03': '84', '04': '93', '05': '93',
  '06': '93', '07': '84', '08': '44', '09': '76', '10': '44',
  '11': '76', '12': '76', '13': '93', '14': '28', '15': '84',
  '16': '75', '17': '75', '18': '24', '19': '75', '21': '27',
  '22': '53', '23': '75', '24': '75', '25': '27', '26': '84',
  '27': '28', '28': '24', '29': '53', '2A': '94', '2B': '94',
  '30': '76', '31': '76', '32': '76', '33': '75', '34': '76',
  '35': '53', '36': '24', '37': '24', '38': '84', '39': '27',
  '40': '75', '41': '24', '42': '84', '43': '84', '44': '52',
  '45': '24', '46': '76', '47': '75', '48': '76', '49': '52',
  '50': '28', '51': '44', '52': '44', '53': '52', '54': '44',
  '55': '44', '56': '53', '57': '44', '58': '27', '59': '32',
  '60': '32', '61': '28', '62': '32', '63': '84', '64': '75',
  '65': '76', '66': '76', '67': '44', '68': '44', '69': '84',
  '70': '27', '71': '27', '72': '52', '73': '84', '74': '84',
  '75': '11', '76': '28', '77': '11', '78': '11', '79': '75',
  '80': '32', '81': '76', '82': '76', '83': '93', '84': '93',
  '85': '52', '86': '75', '87': '75', '88': '44', '89': '27',
  '90': '27', '91': '11', '92': '11', '93': '11', '94': '11',
  '95': '11',
};

export function getDeptToRegionMap(): Record<string, string> {
  return DEPT_TO_REGION;
}

// Agréger les communes par département pour un produit donné
export function aggregateByDepartment(
  communes: CommuneData[],
  product: ProductType,
  selectedFiliales: string[]
): DepartmentAggregation[] {
  const filialeSet = new Set(selectedFiliales);
  const deptMap = new Map<string, CommuneData[]>();
  for (const commune of communes) {
    const dept = commune.departement;
    if (!dept) continue;
    const arr = deptMap.get(dept) ?? [];
    arr.push(commune);
    deptMap.set(dept, arr);
  }

  const result: DepartmentAggregation[] = [];

  for (const [codeDept, deptCommunes] of deptMap) {
    const filialeCounts = new Map<string, number>();
    let communesCouvertes = 0;

    for (const commune of deptCommunes) {
      const filiale = commune.territoires[product];
      if (filiale && filialeSet.has(filiale)) {
        communesCouvertes++;
        filialeCounts.set(filiale, (filialeCounts.get(filiale) ?? 0) + 1);
      }
    }

    const totalCommunes = deptCommunes.length;

    // Filiale dominante = celle avec le plus de communes
    let filialeDominante: string | null = null;
    let maxCount = 0;
    for (const [filiale, count] of filialeCounts) {
      if (count > maxCount) {
        maxCount = count;
        filialeDominante = filiale;
      }
    }

    const filialesPresentes = Array.from(filialeCounts.entries())
      .map(([filiale, nbCommunes]) => ({
        filiale,
        nbCommunes,
        pctCommunes: totalCommunes > 0 ? Math.round((nbCommunes / totalCommunes) * 100) : 0,
      }))
      .sort((a, b) => b.nbCommunes - a.nbCommunes);

    result.push({
      codeDept,
      filialeDominante,
      filialesPresentes,
      totalCommunes,
      communesCouvertes,
    });
  }

  return result;
}

// Agréger les communes par région
export function aggregateByRegion(
  communes: CommuneData[],
  product: ProductType,
  selectedFiliales: string[]
): RegionAggregation[] {
  const filialeSet = new Set(selectedFiliales);
  const regionMap = new Map<string, CommuneData[]>();

  for (const commune of communes) {
    const region = DEPT_TO_REGION[commune.departement];
    if (!region) continue;
    const arr = regionMap.get(region) ?? [];
    arr.push(commune);
    regionMap.set(region, arr);
  }

  const result: RegionAggregation[] = [];

  for (const [codeRegion, regionCommunes] of regionMap) {
    const filialeCounts = new Map<string, number>();
    let communesCouvertes = 0;

    for (const commune of regionCommunes) {
      const filiale = commune.territoires[product];
      if (filiale && filialeSet.has(filiale)) {
        communesCouvertes++;
        filialeCounts.set(filiale, (filialeCounts.get(filiale) ?? 0) + 1);
      }
    }

    const totalCommunes = regionCommunes.length;

    let filialeDominante: string | null = null;
    let maxCount = 0;
    for (const [filiale, count] of filialeCounts) {
      if (count > maxCount) {
        maxCount = count;
        filialeDominante = filiale;
      }
    }

    const filialesPresentes = Array.from(filialeCounts.entries())
      .map(([filiale, nbCommunes]) => ({
        filiale,
        nbCommunes,
        pctCommunes: totalCommunes > 0 ? Math.round((nbCommunes / totalCommunes) * 100) : 0,
      }))
      .sort((a, b) => b.nbCommunes - a.nbCommunes);

    result.push({
      codeRegion,
      filialeDominante,
      filialesPresentes,
      totalCommunes,
      communesCouvertes,
    });
  }

  return result;
}

// Obtenir la liste unique de filiales pour un produit
export function getFiliales(communes: CommuneData[], product: ProductType): string[] {
  const set = new Set<string>();
  for (const commune of communes) {
    const filiale = commune.territoires[product];
    if (filiale) set.add(filiale);
  }
  return Array.from(set).sort();
}

// Obtenir la liste unique de départements
export function getDepartements(communes: CommuneData[]): string[] {
  const set = new Set<string>();
  for (const commune of communes) {
    if (commune.departement) set.add(commune.departement);
  }
  return Array.from(set).sort();
}
