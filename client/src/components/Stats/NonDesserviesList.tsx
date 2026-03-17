import { useMemo, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { CommuneData, ProductType } from '../../types';
import { PRODUCT_LABELS } from '../../types';
import { getDesserviesSet, getNonDesservies } from '../../utils/aggregation';

interface NonDesserviesListProps {
  communes: CommuneData[];
  product: ProductType;
  selectedDepartements: string[];
}

function buildFilename(product: ProductType, depts: string[], ext: string): string {
  const prodLabel = PRODUCT_LABELS[product].replace(/\s+/g, '-');
  const deptSuffix = depts.length > 0 && depts.length <= 5
    ? `_Dpt-${depts.join('-')}`
    : depts.length > 5
      ? `_${depts.length}-depts`
      : '';
  const date = new Date().toISOString().slice(0, 10);
  return `Non-desservies_${prodLabel}${deptSuffix}_${date}.${ext}`;
}

export default function NonDesserviesList({
  communes,
  product,
  selectedDepartements,
}: NonDesserviesListProps) {
  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    const desserviesSet = getDesserviesSet(communes, product);
    return getNonDesservies(desserviesSet, selectedDepartements);
  }, [communes, product, selectedDepartements]);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.nom.toLowerCase().includes(q) ||
        e.cp.includes(q) ||
        e.dep.includes(q)
    );
  }, [entries, search]);

  // Données d'export (toutes les entrées filtrées, pas limité à 500)
  const exportRows = useMemo(() => {
    return filtered.map((e) => ({
      'Code INSEE': e.codeInsee,
      'Commune': e.nom,
      'Code Postal': e.cp,
      'Département': e.dep,
      'Produit': PRODUCT_LABELS[product],
    }));
  }, [filtered, product]);

  const exportCSV = useCallback(() => {
    if (exportRows.length === 0) return;

    const headers = Object.keys(exportRows[0]);
    const csvLines = [
      headers.join(';'),
      ...exportRows.map((row) =>
        headers.map((h) => `"${String(row[h as keyof typeof row]).replace(/"/g, '""')}"`).join(';')
      ),
    ];
    const bom = '\uFEFF'; // BOM UTF-8 pour Excel
    const blob = new Blob([bom + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildFilename(product, selectedDepartements, 'csv');
    a.click();
    URL.revokeObjectURL(url);
  }, [exportRows, product, selectedDepartements]);

  const exportXLSX = useCallback(() => {
    if (exportRows.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(exportRows);
    // Largeurs de colonnes
    ws['!cols'] = [
      { wch: 12 }, // Code INSEE
      { wch: 30 }, // Commune
      { wch: 10 }, // Code Postal
      { wch: 12 }, // Département
      { wch: 20 }, // Produit
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Non desservies');
    XLSX.writeFile(wb, buildFilename(product, selectedDepartements, 'xlsx'));
  }, [exportRows, product, selectedDepartements]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Communes non desservies
        </h3>
        <span className="text-xs text-gray-400">
          {filtered.length.toLocaleString('fr-FR')} commune{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Barre de recherche + boutons export */}
      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher nom, CP, dpt..."
          className="flex-1 min-w-0 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          title="Exporter en CSV"
          className="flex-shrink-0 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          CSV
        </button>
        <button
          onClick={exportXLSX}
          disabled={filtered.length === 0}
          title="Exporter en Excel"
          className="flex-shrink-0 rounded border border-green-300 bg-green-50 px-2 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          XLS
        </button>
      </div>

      {/* Tableau */}
      <div className="max-h-64 overflow-y-auto rounded border border-gray-200">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium text-gray-600">Commune</th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-600 w-16">CP</th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-600 w-12">Dpt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 500).map((e) => (
              <tr
                key={e.codeInsee}
                className="border-t border-gray-100 even:bg-gray-50 hover:bg-blue-50"
              >
                <td className="px-2 py-1 text-gray-800">{e.nom}</td>
                <td className="px-2 py-1 text-gray-500">{e.cp}</td>
                <td className="px-2 py-1 text-gray-500">{e.dep}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 500 && (
          <p className="px-2 py-1.5 text-center text-xs text-gray-400 bg-gray-50 border-t">
            Affichage limité à 500 — l'export contient tout ({filtered.length.toLocaleString('fr-FR')})
          </p>
        )}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-gray-400">
            Aucune commune trouvée
          </p>
        )}
      </div>
    </div>
  );
}
