import { useMemo } from 'react';
import type { DepartmentAggregation, ProductType, RegionAggregation } from '../../types';
import { PRODUCT_LABELS } from '../../types';
import { getFilialeColor } from '../../utils/colors';

interface MapLegendProps {
  aggregations: DepartmentAggregation[] | RegionAggregation[];
  product: ProductType;
  viewMode?: 'departement' | 'region' | 'commune';
}

export default function MapLegend({ aggregations, product, viewMode = 'departement' }: MapLegendProps) {
  const filiales = useMemo(() => {
    const set = new Set<string>();
    for (const agg of aggregations) {
      for (const fp of agg.filialesPresentes) {
        set.add(fp.filiale);
      }
    }
    return Array.from(set).sort();
  }, [aggregations]);

  if (filiales.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 z-[1000] rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur-sm max-h-72 overflow-y-auto min-w-[200px]">
      <h4 className="mb-2 text-sm font-bold text-gray-800">
        L&eacute;gende &mdash; {PRODUCT_LABELS[product]}
      </h4>
      <ul className="space-y-1">
        {filiales.map((filiale) => (
          <li key={filiale} className="flex items-center gap-2 text-xs text-gray-700">
            <span
              className="inline-block h-3 w-3 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: getFilialeColor(filiale) }}
            />
            <span className="truncate">{filiale}</span>
          </li>
        ))}
      </ul>

      {/* Indicateurs visuels pour le mode régions */}
      {viewMode === 'region' && (
        <div className="mt-3 border-t border-gray-200 pt-2">
          <p className="text-[10px] font-semibold uppercase text-gray-400 mb-1">
            Lecture r&eacute;gions
          </p>
          <div className="space-y-1 text-[11px] text-gray-500">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-5 rounded-sm"
                style={{ backgroundColor: '#888', opacity: 0.35 }}
              />
              <span>Aplat = filiale dominante</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-5 rounded-sm"
                style={{
                  background: 'repeating-linear-gradient(45deg, #888 0px, #888 2px, transparent 2px, transparent 5px)',
                }}
              />
              <span>Hachures 45&deg; = 2e filiale</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-5 rounded-sm"
                style={{
                  background: 'repeating-linear-gradient(135deg, #888 0px, #888 2px, transparent 2px, transparent 5px)',
                }}
              />
              <span>Hachures 135&deg; = 3e filiale</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
