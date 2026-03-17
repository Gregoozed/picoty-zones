import type { CommuneData, ProductType } from '../../types';
import { PRODUCT_LABELS } from '../../types';

interface DataPreviewProps {
  communes: CommuneData[];
  product: ProductType;
}

export default function DataPreview({ communes, product }: DataPreviewProps) {
  const preview = communes.slice(0, 10);

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        Total : <strong>{communes.length.toLocaleString('fr-FR')}</strong> communes chargées
      </p>

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-600">
                Code INSEE
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-600">
                Nom
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-600">
                Département
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-600">
                {PRODUCT_LABELS[product]}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {preview.map((c) => (
              <tr key={c.codeInsee} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-1.5 text-gray-700 font-mono text-xs">
                  {c.codeInsee}
                </td>
                <td className="px-3 py-1.5 text-gray-700">{c.nom}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-gray-500">{c.departement}</td>
                <td className="px-3 py-1.5 text-gray-700">
                  {c.territoires[product] ?? (
                    <span className="text-gray-300 italic">non couvert</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {communes.length > 10 && (
        <p className="text-xs text-gray-400 italic">
          Affichage des 10 premières communes sur {communes.length.toLocaleString('fr-FR')}.
        </p>
      )}
    </div>
  );
}
