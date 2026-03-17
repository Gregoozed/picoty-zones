// Helpers géographiques

// Calcule le centroïde (barycentre) à partir d'une liste de coordonnées
export function computeCentroid(points: [number, number][]): [number, number] {
  if (points.length === 0) return [46.603354, 1.888334]; // Centre France par défaut

  let sumLat = 0;
  let sumLng = 0;
  for (const [lat, lng] of points) {
    sumLat += lat;
    sumLng += lng;
  }

  return [sumLat / points.length, sumLng / points.length];
}

// Obtenir le code département depuis le code INSEE d'une commune
export function getDepartementFromInsee(codeInsee: string): string {
  // Corse : 2A et 2B
  if (codeInsee.startsWith('2A') || codeInsee.startsWith('2B')) {
    return codeInsee.substring(0, 2);
  }
  // DOM : 3 chiffres pour le département
  if (codeInsee.length === 5 && parseInt(codeInsee.substring(0, 2)) > 95) {
    return codeInsee.substring(0, 3);
  }
  // Métropole
  return codeInsee.substring(0, 2);
}
