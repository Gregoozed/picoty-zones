import { useEffect, type ReactNode } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [46.603354, 1.888334];
const DEFAULT_ZOOM = 6;

// Approximate bounding boxes per department (rough centroids approach)
// We use fitBounds with a set of known coords; for simplicity we reset to default when empty.
interface ZoomHandlerProps {
  selectedDepartements: string[];
}

function ZoomHandler({ selectedDepartements }: ZoomHandlerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedDepartements.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    // If there are GeoJSON layers on the map, try to compute bounds from them
    const bounds: [number, number][] = [];
    map.eachLayer((layer) => {
      // Check if it's a GeoJSON layer with getBounds
      if ('getBounds' in layer && typeof (layer as Record<string, unknown>).getBounds === 'function') {
        try {
          const layerWithBounds = layer as { getBounds: () => { isValid: () => boolean; getSouthWest: () => { lat: number; lng: number }; getNorthEast: () => { lat: number; lng: number } } };
          const b = layerWithBounds.getBounds();
          if (b && b.isValid()) {
            bounds.push([b.getSouthWest().lat, b.getSouthWest().lng]);
            bounds.push([b.getNorthEast().lat, b.getNorthEast().lng]);
          }
        } catch {
          // ignore layers without valid bounds
        }
      }
    });

    if (bounds.length >= 2) {
      map.fitBounds(bounds as LatLngBoundsExpression, { padding: [20, 20] });
    }
  }, [selectedDepartements, map]);

  return null;
}

interface MapContainerProps {
  children: ReactNode;
  selectedDepartements: string[];
}

export default function MapContainerWrapper({ children, selectedDepartements }: MapContainerProps) {
  return (
    <LeafletMapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Limites administratives communales — IGN Géoplateforme */}
      <TileLayer
        url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&TILEMATRIXSET=PM&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&LAYER=LIMITES_ADMINISTRATIVES_EXPRESS.LATEST&FORMAT=image/png&STYLE=normal"
        attribution="IGN-F/Géoportail"
        minZoom={6}
        maxZoom={16}
        opacity={0.5}
      />
      <ZoomHandler selectedDepartements={selectedDepartements} />
      {children}
    </LeafletMapContainer>
  );
}
