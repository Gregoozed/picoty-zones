import { useMemo } from 'react';
import type { CommuneData, FilterState, DepartmentAggregation, RegionAggregation } from '../types';
import { aggregateByDepartment, aggregateByRegion } from '../utils/aggregation';

interface UseDepartmentAggregationReturn {
  departmentAggregations: DepartmentAggregation[];
  regionAggregations: RegionAggregation[];
  filteredCommunes: CommuneData[];
  totalCouvertes: number;
  totalCommunes: number;
}

export function useDepartmentAggregation(
  communes: CommuneData[],
  filters: FilterState
): UseDepartmentAggregationReturn {
  const filteredCommunes = useMemo(() => {
    if (filters.departements.length === 0) return communes;
    return communes.filter(c => filters.departements.includes(c.departement));
  }, [communes, filters.departements]);

  const departmentAggregations = useMemo(
    () => aggregateByDepartment(filteredCommunes, filters.product, filters.filiales),
    [filteredCommunes, filters.product, filters.filiales]
  );

  const regionAggregations = useMemo(
    () => aggregateByRegion(filteredCommunes, filters.product, filters.filiales),
    [filteredCommunes, filters.product, filters.filiales]
  );

  const totalCouvertes = useMemo(() => {
    if (filters.viewMode === 'region') {
      return regionAggregations.reduce((sum, r) => sum + r.communesCouvertes, 0);
    }
    return departmentAggregations.reduce((sum, d) => sum + d.communesCouvertes, 0);
  }, [departmentAggregations, regionAggregations, filters.viewMode]);

  const totalCommunes = useMemo(() => {
    if (filters.viewMode === 'region') {
      return regionAggregations.reduce((sum, r) => sum + r.totalCommunes, 0);
    }
    return departmentAggregations.reduce((sum, d) => sum + d.totalCommunes, 0);
  }, [departmentAggregations, regionAggregations, filters.viewMode]);

  return {
    departmentAggregations,
    regionAggregations,
    filteredCommunes,
    totalCouvertes,
    totalCommunes,
  };
}
