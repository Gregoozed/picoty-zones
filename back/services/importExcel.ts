import ExcelJS from 'exceljs';

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

function cleanValue(v: string | null): string | null {
  if (!v || v.toUpperCase() === 'VIDE') return null;
  return v;
}

function cellToString(cell: ExcelJS.Cell): string {
  const val = cell.value;
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

export async function parseExcel(
  buffer: Buffer,
  sheetName?: string
): Promise<{ communes: CommuneRow[]; sheetNames: string[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheetNames = workbook.worksheets.map((ws) => ws.name);

  const targetSheetName =
    sheetName ??
    sheetNames.find((n) => n.toUpperCase().includes('ZONE')) ??
    sheetNames[0];

  const worksheet = workbook.getWorksheet(targetSheetName);
  if (!worksheet) throw new Error(`Onglet "${targetSheetName}" introuvable`);

  const communeMap = new Map<string, CommuneRow>();

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    // Columns are 1-indexed in exceljs
    // Col 1 = code_insee, Col 2 = nom, Col 3 = code_postal
    // Col 5 = departement, Col 6 = pp, Col 7 = adblue
    // Col 8 = pellets_liv, Col 9 = pellets_vrac
    const codeInsee = cellToString(row.getCell(1));
    if (!codeInsee) return;

    const values = {
      pp: cleanValue(cellToString(row.getCell(6)) || null),
      adblue: cleanValue(cellToString(row.getCell(7)) || null),
      pelletsLiv: cleanValue(cellToString(row.getCell(8)) || null),
      pelletsVrac: cleanValue(cellToString(row.getCell(9)) || null),
    };

    const existing = communeMap.get(codeInsee);
    if (existing) {
      // Merge: keep first non-null value per product
      if (!existing.pp && values.pp) existing.pp = values.pp;
      if (!existing.adblue && values.adblue) existing.adblue = values.adblue;
      if (!existing.pelletsLiv && values.pelletsLiv) existing.pelletsLiv = values.pelletsLiv;
      if (!existing.pelletsVrac && values.pelletsVrac) existing.pelletsVrac = values.pelletsVrac;
    } else {
      communeMap.set(codeInsee, {
        codeInsee,
        nom: cellToString(row.getCell(2)),
        codePostal: cellToString(row.getCell(3)),
        departement: cellToString(row.getCell(5)),
        ...values,
      });
    }
  });

  return { communes: Array.from(communeMap.values()), sheetNames };
}
