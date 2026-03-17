import { useMemo, useState } from 'react';
import type { ProductType } from '../../types';
import { exportNonDesserviesUrl } from '../../services/communeApi';

interface NonDesserviesEntry {
  codeInsee: string;
  nom: string;
  cp: string;
  dep: string;
}

interface NonDesserviesListProps {
  entries: NonDesserviesEntry[];
  product: ProductType;
  selectedDepartements: string[];
}

export default function NonDesserviesList({
  entries,
  product,
  selectedDepartements,
}: NonDesserviesListProps) {
  const [search, setSearch] = useState('');

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

  const handleExportCSV = () => {
    window.open(exportNonDesserviesUrl(product, selectedDepartements, 'csv'));
  };

  const handleExportXLSX = () => {
    window.open(exportNonDesserviesUrl(product, selectedDepartements, 'xlsx'));
  };

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

      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher nom, CP, dpt..."
          className="flex-1 min-w-0 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={handleExportCSV}
          disabled={entries.length === 0}
          title="Exporter en CSV"
          className="flex-shrink-0 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          CSV
        </button>
        <button
          onClick={handleExportXLSX}
          disabled={entries.length === 0}
          title="Exporter en Excel"
          className="flex-shrink-0 rounded border border-green-300 bg-green-50 px-2 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          XLS
        </button>
      </div>

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
            Affichage limite a 500 — l'export contient tout ({filtered.length.toLocaleString('fr-FR')})
          </p>
        )}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-gray-400">
            Aucune commune trouvee
          </p>
        )}
      </div>
    </div>
  );
}
