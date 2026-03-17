import { useState, useMemo, useCallback, useEffect } from 'react';
import type { CommuneData, ProductType, FilterState } from '../types';
import { getFiliales, getDepartements } from '../utils/aggregation';

interface UseFiltersReturn {
  filters: FilterState;
  setProduct: (product: ProductType) => void;
  toggleFiliale: (filiale: string) => void;
  selectAllFiliales: () => void;
  deselectAllFiliales: () => void;
  setDepartements: (departements: string[]) => void;
  setViewMode: (viewMode: 'departement' | 'region' | 'commune') => void;
  toggleNonDesservies: () => void;
  availableFiliales: string[];
  availableDepartements: string[];
}

export function useFilters(communes: CommuneData[]): UseFiltersReturn {
  const [filters, setFilters] = useState<FilterState>({
    product: 'PP',
    filiales: [],
    departements: [],
    viewMode: 'departement',
    showNonDesservies: false,
  });

  const availableFiliales = useMemo(
    () => getFiliales(communes, filters.product),
    [communes, filters.product]
  );

  const availableDepartements = useMemo(
    () => getDepartements(communes),
    [communes]
  );

  // When product changes, keep filiales that exist in the new product
  useEffect(() => {
    setFilters(prev => {
      const available = getFiliales(communes, prev.product);
      const availableSet = new Set(available);
      const kept = prev.filiales.filter(f => availableSet.has(f));
      // If none survived, select all (first load or total mismatch)
      return { ...prev, filiales: kept.length > 0 ? kept : available };
    });
  }, [communes, filters.product]);

  const setProduct = useCallback((product: ProductType) => {
    setFilters(prev => ({ ...prev, product }));
  }, []);

  const toggleFiliale = useCallback((filiale: string) => {
    setFilters(prev => {
      const isSelected = prev.filiales.includes(filiale);
      const filiales = isSelected
        ? prev.filiales.filter(f => f !== filiale)
        : [...prev.filiales, filiale];
      return { ...prev, filiales };
    });
  }, []);

  const selectAllFiliales = useCallback(() => {
    setFilters(prev => ({ ...prev, filiales: [...availableFiliales] }));
  }, [availableFiliales]);

  const deselectAllFiliales = useCallback(() => {
    setFilters(prev => ({ ...prev, filiales: [] }));
  }, []);

  const setDepartements = useCallback((departements: string[]) => {
    setFilters(prev => ({ ...prev, departements }));
  }, []);

  const setViewMode = useCallback((viewMode: 'departement' | 'region' | 'commune') => {
    setFilters(prev => ({ ...prev, viewMode }));
  }, []);

  const toggleNonDesservies = useCallback(() => {
    setFilters(prev => ({ ...prev, showNonDesservies: !prev.showNonDesservies }));
  }, []);

  return {
    filters,
    setProduct,
    toggleFiliale,
    selectAllFiliales,
    deselectAllFiliales,
    setDepartements,
    setViewMode,
    toggleNonDesservies,
    availableFiliales,
    availableDepartements,
  };
}
