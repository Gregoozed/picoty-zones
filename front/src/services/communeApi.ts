import type { CommuneData, ProductType, DepartmentAggregation, RegionAggregation, FilialeCentroid } from '../types';

export async function fetchCommunes(): Promise<CommuneData[]> {
  const res = await fetch('/api/communes');
  if (!res.ok) throw new Error('Serveur indisponible');
  return res.json();
}

export async function fetchStatus(): Promise<{ count: number; lastUpdated: string | null }> {
  const res = await fetch('/api/communes/status');
  if (!res.ok) throw new Error('Impossible de charger le statut');
  return res.json();
}

export async function uploadFile(
  file: File,
  sheetName?: string
): Promise<{ count: number; sheetNames: string[] }> {
  const formData = new FormData();
  formData.append('file', file);
  if (sheetName) formData.append('sheetName', sheetName);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erreur serveur' }));
    throw new Error(body.error || 'Erreur serveur');
  }

  return res.json();
}

export async function fetchFilters(product: ProductType): Promise<{ filiales: string[]; departements: string[] }> {
  const res = await fetch(`/api/communes/filters?product=${product}`);
  if (!res.ok) throw new Error('Erreur chargement filtres');
  return res.json();
}

export async function fetchDeptAggregations(
  product: ProductType,
  filiales: string[],
  departements: string[]
): Promise<{ aggregations: DepartmentAggregation[]; totalCouvertes: number; totalCommunes: number }> {
  const params = new URLSearchParams({ product });
  if (filiales.length) params.set('filiales', filiales.join(','));
  if (departements.length) params.set('departements', departements.join(','));
  const res = await fetch(`/api/communes/aggregations/departement?${params}`);
  if (!res.ok) throw new Error('Erreur chargement aggregations departement');
  return res.json();
}

export async function fetchRegionAggregations(
  product: ProductType,
  filiales: string[],
  departements: string[]
): Promise<RegionAggregation[]> {
  const params = new URLSearchParams({ product });
  if (filiales.length) params.set('filiales', filiales.join(','));
  if (departements.length) params.set('departements', departements.join(','));
  const res = await fetch(`/api/communes/aggregations/region?${params}`);
  if (!res.ok) throw new Error('Erreur chargement aggregations region');
  return res.json();
}

export async function fetchCentroids(
  product: ProductType,
  filiales: string[]
): Promise<FilialeCentroid[]> {
  const params = new URLSearchParams({ product });
  if (filiales.length) params.set('filiales', filiales.join(','));
  const res = await fetch(`/api/communes/centroids?${params}`);
  if (!res.ok) throw new Error('Erreur chargement centroides');
  return res.json();
}

export async function fetchNonDesservies(
  product: ProductType,
  departements: string[]
): Promise<{ count: number; communes: { codeInsee: string; nom: string; cp: string; dep: string }[] }> {
  const params = new URLSearchParams({ product });
  if (departements.length) params.set('departements', departements.join(','));
  const res = await fetch(`/api/communes/non-desservies?${params}`);
  if (!res.ok) throw new Error('Erreur chargement non-desservies');
  return res.json();
}

export function exportNonDesserviesUrl(product: ProductType, departements: string[], format: 'xlsx' | 'csv'): string {
  const params = new URLSearchParams({ product, format });
  if (departements.length) params.set('departements', departements.join(','));
  return `/api/communes/non-desservies/export?${params}`;
}
