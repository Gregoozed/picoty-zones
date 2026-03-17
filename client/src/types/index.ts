// Types de produits — les 4 colonnes de territoires
export type ProductType = 'PP' | 'ADBLUE' | 'PELLETS_LIV' | 'PELLETS_VRAC';

// Labels des produits pour l'affichage
export const PRODUCT_LABELS: Record<ProductType, string> = {
  PP: 'Produits Pétroliers',
  ADBLUE: 'AdBlue',
  PELLETS_LIV: 'Pellets Livraison',
  PELLETS_VRAC: 'Pellets Vrac',
};

// Une commune avec ses territoires
export interface CommuneData {
  codeInsee: string;
  nom: string;
  codePostal: string;
  departement: string;         // "23", "2A", etc.
  territoires: {
    PP: string | null;
    ADBLUE: string | null;
    PELLETS_LIV: string | null;
    PELLETS_VRAC: string | null;
  };
}

// Agrégation par département pour un produit donné
export interface DepartmentAggregation {
  codeDept: string;
  filialeDominante: string | null;
  filialesPresentes: {
    filiale: string;
    nbCommunes: number;
    pctCommunes: number;
  }[];
  totalCommunes: number;
  communesCouvertes: number;
}

// Agrégation par région
export interface RegionAggregation {
  codeRegion: string;
  filialeDominante: string | null;
  filialesPresentes: {
    filiale: string;
    nbCommunes: number;
    pctCommunes: number;
  }[];
  totalCommunes: number;
  communesCouvertes: number;
}

// État des filtres
export interface FilterState {
  product: ProductType;
  filiales: string[];
  departements: string[];
  viewMode: 'departement' | 'region' | 'commune';
  showNonDesservies: boolean;
}

// Entrée du référentiel communes
export interface CommuneRef {
  nom: string;
  cp: string;
  dep: string;
  lat: number;
  lng: number;
}

// Centroïde de filiale
export interface FilialeCentroid {
  filiale: string;
  lat: number;
  lng: number;
  nbCommunes: number;
  departements: string[];
  produits: ProductType[];
}
