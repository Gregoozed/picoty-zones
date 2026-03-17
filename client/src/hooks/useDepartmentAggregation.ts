import { useMemo } from 'react';
import type { CommuneData, FilterState, DepartmentAggregation, RegionAggregation } from '../types';
import { aggregateByDepartment, aggregateByRegion } from '../utils/aggregation';

interface UseDepartmentAggregationReturn {
  departmentAggregations: DepartmentAggregation[];
  regionAggregations: RegionAggregation[];
  totalCouvertes: number;
  totalCommunes: number;
}

export function useDepartmentAggregation(
  communes: CommuneData[],
  filters: FilterState
): UseDepartmentAggregationReturn {
  const filteredCommunes = useMemo(() => {
    if (filters.departements.length === 0) return communes;
    const deptSet = new Set(filters.departements);
    return communes.filter(c => deptSet.has(c.departement));
  }, [communes, filters.departements]);

  const departmentAggregations = useMemo(
    () => aggregateByDepartment(filteredCommunes, filters.product, filters.filiales),
    [filteredCommunes, filters.product, filters.filiales]
  );

  const regionAggregations = useMemo(
    () => aggregateByRegion(filteredCommunes, filters.product, filters.filiales),
    [filteredCommunes, filters.product, filters.filiales]
  );

  const totalCouvertes = useMemo(
    () => departmentAggregations.reduce((sum, d) => sum + d.communesCouvertes, 0),
    [departmentAggregations]
  );

  const totalCommunes = useMemo(
    () => departmentAggregations.reduce((sum, d) => sum + d.totalCommunes, 0),
    [departmentAggregations]
  );

  return {
    departmentAggregations,
    regionAggregations,
    totalCouvertes,
    totalCommunes,
  };
}
