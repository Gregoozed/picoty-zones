import type { ProductType } from '../../types';
import ProductSelector from './ProductSelector';
import FilialeFilter from './FilialeFilter';
import GeoFilter from './GeoFilter';

interface FilterPanelProps {
  /* Stats */
  totalCommunes: number;
  totalCouvertes: number;
  filialesCount: number;
  /* Product */
  product: ProductType;
  onProductChange: (product: ProductType) => void;
  /* Filiales */
  filiales: string[];
  selectedFiliales: string[];
  onFilialeToggle: (filiale: string) => void;
  onFilialeSelectAll: () => void;
  onFilialeDeselectAll: () => void;
  /* Geo */
  departements: string[];
  selectedDepartements: string[];
  onDepartementsChange: (depts: string[]) => void;
  viewMode: 'departement' | 'region' | 'commune';
  onViewModeChange: (mode: 'departement' | 'region' | 'commune') => void;
}

export default function FilterPanel({
  totalCommunes,
  totalCouvertes,
  filialesCount,
  product,
  onProductChange,
  filiales,
  selectedFiliales,
  onFilialeToggle,
  onFilialeSelectAll,
  onFilialeDeselectAll,
  departements,
  selectedDepartements,
  onDepartementsChange,
  viewMode,
  onViewModeChange,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      {/* Quick stats */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2">
        <span>
          <strong className="text-gray-900">{totalCouvertes.toLocaleString('fr-FR')}</strong>{' '}
          communes couvertes / {totalCommunes.toLocaleString('fr-FR')} total
        </span>
        <span className="text-gray-300">|</span>
        <span>
          <strong className="text-gray-900">{filialesCount}</strong> filiales
        </span>
      </div>

      {/* Product selector */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Produit
        </h3>
        <ProductSelector product={product} onChange={onProductChange} />
      </section>

      {/* Filiale filter */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Filiales
        </h3>
        <FilialeFilter
          filiales={filiales}
          selected={selectedFiliales}
          onToggle={onFilialeToggle}
          onSelectAll={onFilialeSelectAll}
          onDeselectAll={onFilialeDeselectAll}
        />
      </section>

      {/* Geo filter */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Géographie
        </h3>
        <GeoFilter
          departements={departements}
          selected={selectedDepartements}
          onChange={onDepartementsChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </section>
    </div>
  );
}
