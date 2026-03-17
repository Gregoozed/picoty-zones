import { CircleMarker, Popup } from 'react-leaflet';
import type { FilialeCentroid, ProductType } from '../../types';
import { PRODUCT_LABELS } from '../../types';
import { getFilialeColor } from '../../utils/colors';

interface FilialeMarkersProps {
  centroids: FilialeCentroid[];
  product: ProductType;
}

export default function FilialeMarkers({ centroids, product }: FilialeMarkersProps) {
  return (
    <>
      {centroids.map((centroid) => (
        <CircleMarker
          key={centroid.filiale}
          center={[centroid.lat, centroid.lng]}
          radius={8}
          pathOptions={{
            color: getFilialeColor(centroid.filiale),
            fillColor: getFilialeColor(centroid.filiale),
            fillOpacity: 0.8,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-base mb-1">{centroid.filiale}</p>
              <p>
                <span className="font-semibold">Communes couvertes :</span>{' '}
                {centroid.nbCommunes}
              </p>
              <p>
                <span className="font-semibold">Departements :</span>{' '}
                {centroid.departements.join(', ')}
              </p>
              <p>
                <span className="font-semibold">Produits distribues :</span>{' '}
                {centroid.produits.map((p) => PRODUCT_LABELS[p]).join(', ')}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Filtre actif : {PRODUCT_LABELS[product]}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
