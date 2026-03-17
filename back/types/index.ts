export type ProductType = 'PP' | 'ADBLUE' | 'PELLETS_LIV' | 'PELLETS_VRAC';

export interface CommuneData {
  codeInsee: string;
  nom: string;
  codePostal: string;
  departement: string;
  territoires: {
    PP: string | null;
    ADBLUE: string | null;
    PELLETS_LIV: string | null;
    PELLETS_VRAC: string | null;
  };
}

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

export interface FilialeCentroid {
  filiale: string;
  lat: number;
  lng: number;
  nbCommunes: number;
  departements: string[];
  produits: ProductType[];
}

export interface CommuneRef {
  nom: string;
  cp: string;
  dep: string;
  lat: number;
  lng: number;
}
