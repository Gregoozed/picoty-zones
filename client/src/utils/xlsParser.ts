import * as XLSX from 'xlsx';
import type { CommuneData } from '../types';

export interface ParseResult {
  communes: CommuneData[];
  sheetNames: string[];
}

export function parseExcelFile(buffer: ArrayBuffer, sheetName?: string): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  // Sélection de l'onglet (défaut : premier contenant "ZONE")
  const targetSheet = sheetName
    ?? sheetNames.find(n => n.toUpperCase().includes('ZONE'))
    ?? sheetNames[0];

  const worksheet = workbook.Sheets[targetSheet];
  if (!worksheet) throw new Error(`Onglet "${targetSheet}" introuvable`);

  // Conversion en tableau de tableaux (raw)
  const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: undefined,
    raw: false,
  });

  // Skip header row
  const dataRows = rows.slice(1);

  // Map pour dédoublonnage par code INSEE
  const communeMap = new Map<string, CommuneData>();

  // Traiter "VIDE" comme null
  const cleanValue = (v: string | null): string | null => {
    if (!v || v.toUpperCase() === 'VIDE') return null;
    return v;
  };

  for (const row of dataRows) {
    const codeInsee = String(row[0] ?? '').trim();
    if (!codeInsee) continue;

    const nom = String(row[1] ?? '').trim();
    const codePostal = String(row[2] ?? '').trim();
    const departement = String(row[4] ?? '').trim();

    const values = {
      PP: cleanValue(String(row[5] ?? '').trim() || null),
      ADBLUE: cleanValue(String(row[6] ?? '').trim() || null),
      PELLETS_LIV: cleanValue(String(row[7] ?? '').trim() || null),
      PELLETS_VRAC: cleanValue(String(row[8] ?? '').trim() || null),
    } as const;

    // Dédoublonnage : garder la première occurrence non-vide par produit
    const existing = communeMap.get(codeInsee);
    if (existing) {
      for (const p of ['PP', 'ADBLUE', 'PELLETS_LIV', 'PELLETS_VRAC'] as const) {
        const newVal = values[p];
        if (!newVal) continue;
        if (!existing.territoires[p]) {
          existing.territoires[p] = newVal;
        }
      }
    } else {
      communeMap.set(codeInsee, {
        codeInsee,
        nom,
        codePostal,
        departement,
        territoires: { ...values },
      });
    }
  }

  return {
    communes: Array.from(communeMap.values()),
    sheetNames,
  };
}

// Valider que les colonnes attendues sont présentes
export function validateColumns(buffer: ArrayBuffer, sheetName?: string): { valid: boolean; missing: string[] } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const targetSheet = sheetName ?? workbook.SheetNames.find(n => n.toUpperCase().includes('ZONE')) ?? workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheet];
  if (!worksheet) return { valid: false, missing: ['Onglet introuvable'] };

  const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: undefined });
  const header = (rows[0] ?? []).map(h => String(h ?? '').toLowerCase());

  const expected = ['code', 'nom', 'postal', 'dpt'];
  const missing = expected.filter(e => !header.some(h => h.includes(e)));

  return { valid: missing.length === 0, missing };
}
