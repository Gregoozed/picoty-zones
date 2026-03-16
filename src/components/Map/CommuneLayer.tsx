import { useEffect, useRef, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { CommuneData, ProductType } from '../../types';
import { PRODUCT_LABELS } from '../../types';
import { getFilialeColor } from '../../utils/colors';
import communeCoords from '../../data/communes-geo.json';

const coords = communeCoords as Record<string, [number, number]>;

interface CommuneLayerProps {
  communes: CommuneData[];
  product: ProductType;
  selectedFiliales: string[];
  selectedDepartements: string[];
}

// Point pré-calculé pour le rendu canvas
interface RenderPoint {
  lat: number;
  lng: number;
  color: string;
  nom: string;
  codePostal: string;
  departement: string;
  filiale: string;
}

// Index spatial simple (grille) pour la recherche par proximité
class SpatialGrid {
  private cells = new Map<string, RenderPoint[]>();
  private cellSize: number;

  constructor(cellSize = 0.5) {
    this.cellSize = cellSize;
  }

  clear() {
    this.cells.clear();
  }

  add(point: RenderPoint) {
    const key = this.key(point.lat, point.lng);
    const arr = this.cells.get(key);
    if (arr) arr.push(point);
    else this.cells.set(key, [point]);
  }

  private key(lat: number, lng: number): string {
    return `${Math.floor(lat / this.cellSize)},${Math.floor(lng / this.cellSize)}`;
  }

  findNearest(lat: number, lng: number, maxDist: number): RenderPoint | null {
    const cx = Math.floor(lat / this.cellSize);
    const cy = Math.floor(lng / this.cellSize);
    let best: RenderPoint | null = null;
    let bestDist = maxDist * maxDist;

    // Chercher dans les 9 cellules adjacentes
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cell = this.cells.get(`${cx + dx},${cy + dy}`);
        if (!cell) continue;
        for (const p of cell) {
          const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
          if (d < bestDist) {
            bestDist = d;
            best = p;
          }
        }
      }
    }
    return best;
  }
}

/**
 * Couche Canvas haute performance pour afficher les communes.
 * - Un seul repaint canvas pour tous les points (pas d'objets Leaflet individuels)
 * - Index spatial pour la détection au survol (tooltip lazy)
 */
export default function CommuneLayer({
  communes,
  product,
  selectedFiliales,
  selectedDepartements,
}: CommuneLayerProps) {
  const map = useMap();
  const canvasLayerRef = useRef<L.Layer | null>(null);
  const tooltipRef = useRef<L.Tooltip | null>(null);
  const gridRef = useRef(new SpatialGrid(0.3));

  // Pré-calculer les points à rendre
  const points = useMemo(() => {
    const result: RenderPoint[] = [];
    const filialeSet = new Set(selectedFiliales);
    const deptSet = selectedDepartements.length > 0 ? new Set(selectedDepartements) : null;

    for (const c of communes) {
      if (deptSet && !deptSet.has(c.departement)) continue;
      const filiale = c.territoires[product];
      if (!filiale || !filialeSet.has(filiale)) continue;
      const latlng = coords[c.codeInsee];
      if (!latlng) continue;

      result.push({
        lat: latlng[0],
        lng: latlng[1],
        color: getFilialeColor(filiale),
        nom: c.nom,
        codePostal: c.codePostal,
        departement: c.departement,
        filiale,
      });
    }
    return result;
  }, [communes, product, selectedFiliales, selectedDepartements]);

  useEffect(() => {
    // Nettoyer la couche précédente
    if (canvasLayerRef.current) {
      map.removeLayer(canvasLayerRef.current);
    }
    if (tooltipRef.current) {
      map.removeLayer(tooltipRef.current);
      tooltipRef.current = null;
    }

    // Construire l'index spatial
    const grid = gridRef.current;
    grid.clear();
    for (const p of points) {
      grid.add(p);
    }

    // Créer un custom canvas layer
    const CanvasLayer = L.Layer.extend({
      onAdd(m: L.Map) {
        this._map = m;
        const size = m.getSize();
        const canvas = L.DomUtil.create('canvas', 'leaflet-commune-canvas') as HTMLCanvasElement;
        canvas.width = size.x;
        canvas.height = size.y;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none'; // Le tooltip est géré via l'event mousemove sur la map
        this._canvas = canvas;

        const pane = m.getPane('overlayPane');
        if (pane) pane.appendChild(canvas);

        m.on('moveend zoomend resize', this._reset, this);
        this._reset();
      },

      onRemove(m: L.Map) {
        if (this._canvas && this._canvas.parentNode) {
          this._canvas.parentNode.removeChild(this._canvas);
        }
        m.off('moveend zoomend resize', this._reset, this);
      },

      _reset() {
        const m = this._map as L.Map;
        const canvas = this._canvas as HTMLCanvasElement;
        const size = m.getSize();
        const topLeft = m.containerPointToLayerPoint([0, 0]);

        canvas.width = size.x;
        canvas.height = size.y;
        L.DomUtil.setPosition(canvas, topLeft);

        this._draw();
      },

      _draw() {
        const m = this._map as L.Map;
        const canvas = this._canvas as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bounds = m.getBounds();
        const zoom = m.getZoom();
        // Rayon adaptatif selon le zoom
        const radius = zoom >= 11 ? 5 : zoom >= 9 ? 4 : zoom >= 7 ? 3 : 2;

        // Grouper par couleur pour minimiser les changements de style
        const byColor = new Map<string, { x: number; y: number }[]>();

        for (const p of points) {
          // Viewport culling
          if (p.lat < bounds.getSouth() || p.lat > bounds.getNorth()) continue;
          if (p.lng < bounds.getWest() || p.lng > bounds.getEast()) continue;

          const pixel = m.latLngToContainerPoint([p.lat, p.lng]);
          const arr = byColor.get(p.color);
          if (arr) arr.push({ x: pixel.x, y: pixel.y });
          else byColor.set(p.color, [{ x: pixel.x, y: pixel.y }]);
        }

        // Dessiner tous les points groupés par couleur
        for (const [color, pixels] of byColor) {
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          for (const { x, y } of pixels) {
            ctx.moveTo(x + radius, y);
            ctx.arc(x, y, radius, 0, Math.PI * 2);
          }
          ctx.fill();

          // Contour léger
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      },
    });

    const layer = new CanvasLayer();
    layer.addTo(map);
    canvasLayerRef.current = layer;

    // Tooltip lazy au survol de la carte
    const tooltip = L.tooltip({ sticky: true, direction: 'top', offset: [0, -10] });
    tooltipRef.current = tooltip;

    function onMouseMove(e: L.LeafletMouseEvent) {
      const latlng = e.latlng;
      const zoom = map.getZoom();
      // Distance de recherche adaptative (plus petit quand on zoom)
      const searchDist = zoom >= 12 ? 0.005 : zoom >= 10 ? 0.02 : zoom >= 8 ? 0.05 : 0.15;
      const nearest = grid.findNearest(latlng.lat, latlng.lng, searchDist);

      if (nearest) {
        tooltip.setLatLng([nearest.lat, nearest.lng]);
        tooltip.setContent(
          `<div style="min-width:150px;">` +
            `<strong>${nearest.nom}</strong><br/>` +
            `<span style="font-size:11px;color:#666;">` +
              `${nearest.codePostal} — Dpt ${nearest.departement}` +
            `</span><br/>` +
            `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;` +
              `background:${nearest.color};margin-right:4px;vertical-align:middle;"></span>` +
            `<span style="font-size:11px;">${nearest.filiale}</span><br/>` +
            `<span style="font-size:10px;color:#999;">${PRODUCT_LABELS[product]}</span>` +
          `</div>`
        );
        if (!map.hasLayer(tooltip)) {
          tooltip.addTo(map);
        }
      } else {
        if (map.hasLayer(tooltip)) {
          map.removeLayer(tooltip);
        }
      }
    }

    function onMouseOut() {
      if (map.hasLayer(tooltip)) {
        map.removeLayer(tooltip);
      }
    }

    map.on('mousemove', onMouseMove);
    map.on('mouseout', onMouseOut);

    return () => {
      map.off('mousemove', onMouseMove);
      map.off('mouseout', onMouseOut);
      if (canvasLayerRef.current) {
        map.removeLayer(canvasLayerRef.current);
        canvasLayerRef.current = null;
      }
      if (tooltipRef.current && map.hasLayer(tooltipRef.current)) {
        map.removeLayer(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, [map, points, product]);

  return null;
}
