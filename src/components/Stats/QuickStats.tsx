import { useMemo } from 'react';
import type { CommuneData, ProductType } from '../../types';
import { getFilialeColor } from '../../utils/colors';

interface QuickStatsProps {
  communes: CommuneData[];
  product: ProductType;
  selectedFiliales: string[];
}

export default function QuickStats({ communes, product, selectedFiliales }: QuickStatsProps) {
  const stats = useMemo(() => {
    const total = communes.length;
    const filialeCounts = new Map<string, number>();
    let couvertes = 0;

    for (const c of communes) {
      const filiale = c.territoires[product];
      if (filiale && selectedFiliales.includes(filiale)) {
        couvertes++;
        filialeCounts.set(filiale, (filialeCounts.get(filiale) ?? 0) + 1);
      }
    }

    const pctCoverage = total > 0 ? Math.round((couvertes / total) * 100) : 0;

    const top5 = [...filialeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([filiale, count]) => ({
        filiale,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

    const maxCount = top5.length > 0 ? top5[0].count : 0;

    return { total, couvertes, pctCoverage, top5, maxCount };
  }, [communes, product, selectedFiliales]);

  return (
    <div className="space-y-4">
      {/* Coverage summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md bg-gray-50 p-3 text-center">
          <p className="text-lg font-bold text-gray-900">
            {stats.total.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-gray-500">Total communes</p>
        </div>
        <div className="rounded-md bg-blue-50 p-3 text-center">
          <p className="text-lg font-bold text-blue-700">
            {stats.couvertes.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-gray-500">Couvertes</p>
        </div>
        <div className="rounded-md bg-green-50 p-3 text-center">
          <p className="text-lg font-bold text-green-700">{stats.pctCoverage}%</p>
          <p className="text-xs text-gray-500">Couverture</p>
        </div>
      </div>

      {/* Top 5 filiales bar chart */}
      {stats.top5.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Top 5 filiales
          </h4>
          <ul className="space-y-1.5">
            {stats.top5.map(({ filiale, count, pct }) => {
              const barWidth =
                stats.maxCount > 0 ? Math.round((count / stats.maxCount) * 100) : 0;
              return (
                <li key={filiale}>
                  <div className="flex items-center justify-between text-xs text-gray-700 mb-0.5">
                    <span className="truncate mr-2">{filiale}</span>
                    <span className="flex-shrink-0 tabular-nums">
                      {count.toLocaleString('fr-FR')} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: getFilialeColor(filiale),
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
