// Palette de couleurs — 22 filiales indépendantes
export const FILIALE_COLORS: Record<string, string> = {
  'AUVERGNE CARBURANTS': '#E74C3C',
  'BEYNAT ROCHE ENERGIES': '#E67E22',
  'BOURREL': '#27AE60',
  'BRETECHE': '#2ECC71',
  'BRETECHE OUEST': '#1ABC9C',
  'CAMPUS IDF': '#8E44AD',
  'CAMPUS PROVENCE': '#9B59B6',
  'DEGENNE': '#F39C12',
  'GEM BARRES': '#D35400',
  'MARLIM': '#16A085',
  'P.E.S.': '#2980B9',
  'PAGES': '#C0392B',
  'PICOTY AQUITAINE': '#1B4F72',
  'PICOTY ATLANTIQUE': '#5DADE2',
  'PICOTY CENTRE': '#1a2a50',
  'PICOTY CENTRE JAUNAY CLAN': '#3498DB',
  'PICOTY CENTRE MONTMORILLON': '#85C1E9',
  'PICOTY OUEST': '#2E86C1',
  'RAMOND': '#7D3C98',
  'RAMOND & CÉVENNES': '#A569BD',
  'S.O.E.S.': '#34495E',
  'TAUPIN': '#F1C40F',
};

const DEFAULT_COLOR = '#BDC3C7';

export function getFilialeColor(filiale: string): string {
  return FILIALE_COLORS[filiale] ?? DEFAULT_COLOR;
}
