import { useEffect, useRef, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { CommuneData, ProductType } from '../../types';
import { PRODUCT_LABELS } from '../../types';
import { getFilialeColor } from '../../utils/colors';
import { referentiel } from '../../utils/referentiel';

interface CommuneLayerProps {
  communes: CommuneData[];
  product: ProductType;
  selectedFiliales: string[];
  selectedDepartements: string[];
  showNonDesservies: boolean;
}

// Point pré-calculé pour le rendu canvas
interface RenderPoint {
  lat: number;
  lng: number;
  color: string;
  nom: string;
  codePostal: string;
  departement: string;
  filiale: string; // "" pour les non desservies
  isNonDesservie: boolean;
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

/** Convex hull — Andrew's monotone chain, O(n log n) */
function convexHull(pts: { lat: number; lng: number }[]): { lat: number; lng: number }[] {
  if (pts.length < 3) return [...pts];

  const sorted = [...pts].sort((a, b) => a.lng - b.lng || a.lat - b.lat);

  const cross = (o: { lat: number; lng: number }, a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
    (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);

  const lower: { lat: number; lng: number }[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: { lat: number; lng: number }[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();

  return lower.concat(upper);
}

/**
 * Couche Canvas haute performance pour afficher les communes.
 * - Points colorés par filiale + points gris pour les non desservies
 * - Enveloppes convexes pour délimiter les zones de chaque filiale
 * - Index spatial pour tooltip au survol
 */
export default function CommuneLayer({
  communes,
  product,
  selectedFiliales,
  selectedDepartements,
  showNonDesservies,
}: CommuneLayerProps) {
  const map = useMap();
  const canvasLayerRef = useRef<L.Layer | null>(null);
  const tooltipRef = useRef<L.Tooltip | null>(null);
  const gridRef = useRef(new SpatialGrid(0.3));

  // Set des codes INSEE desservis pour le produit courant
  const desserviesSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of communes) {
      if (c.territoires[product]) {
        set.add(c.codeInsee);
      }
    }
    return set;
  }, [communes, product]);

  // Points desservis (colorés)
  const points = useMemo(() => {
    const result: RenderPoint[] = [];
    const filialeSet = new Set(selectedFiliales);
    const deptSet = selectedDepartements.length > 0 ? new Set(selectedDepartements) : null;

    for (const c of communes) {
      if (deptSet && !deptSet.has(c.departement)) continue;
      const filiale = c.territoires[product];
      if (!filiale || !filialeSet.has(filiale)) continue;
      const ref = referentiel[c.codeInsee];
      if (!ref) continue;

      result.push({
        lat: ref.lat,
        lng: ref.lng,
        color: getFilialeColor(filiale),
        nom: c.nom || ref.nom,
        codePostal: c.codePostal || ref.cp,
        departement: c.departement || ref.dep,
        filiale,
        isNonDesservie: false,
      });
    }
    return result;
  }, [communes, product, selectedFiliales, selectedDepartements]);

  // Points non desservis (gris)
  const nonDesserviesPoints = useMemo(() => {
    if (!showNonDesservies) return [];

    const result: RenderPoint[] = [];
    const deptSet = selectedDepartements.length > 0 ? new Set(selectedDepartements) : null;

    for (const [codeInsee, ref] of Object.entries(referentiel)) {
      if (desserviesSet.has(codeInsee)) continue;
      if (deptSet && !deptSet.has(ref.dep)) continue;
      if (!ref.lat || !ref.lng) continue;

      result.push({
        lat: ref.lat,
        lng: ref.lng,
        color: '#BBBBBB',
        nom: ref.nom,
        codePostal: ref.cp || '',
        departement: ref.dep,
        filiale: '',
        isNonDesservie: true,
      });
    }
    return result;
  }, [showNonDesservies, desserviesSet, selectedDepartements]);

  // Tous les points combinés pour le spatial grid
  const allPoints = useMemo(() => [...nonDesserviesPoints, ...points], [points, nonDesserviesPoints]);

  // Enveloppes convexes par filiale (seulement les points desservis)
  const hulls = useMemo(() => {
    const byFiliale = new Map<string, { lat: number; lng: number; color: string }[]>();
    for (const p of points) {
      const arr = byFiliale.get(p.filiale);
      if (arr) arr.push(p);
      else byFiliale.set(p.filiale, [{ lat: p.lat, lng: p.lng, color: p.color }]);
    }

    const result: { color: string; hull: { lat: number; lng: number }[] }[] = [];
    for (const [, pts] of byFiliale) {
      if (pts.length < 3) continue;
      const hull = convexHull(pts);
      result.push({ color: pts[0].color, hull });
    }
    return result;
  }, [points]);

  useEffect(() => {
    if (canvasLayerRef.current) {
      map.removeLayer(canvasLayerRef.current);
    }
    if (tooltipRef.current) {
      map.removeLayer(tooltipRef.current);
      tooltipRef.current = null;
    }

    // Construire l'index spatial avec tous les points
    const grid = gridRef.current;
    grid.clear();
    for (const p of allPoints) {
      grid.add(p);
    }

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
        canvas.style.pointerEvents = 'none';
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

        // 1) Dessiner les enveloppes convexes en arrière-plan
        for (const { color, hull } of hulls) {
          if (hull.length < 3) continue;

          const pixels = hull.map(p => m.latLngToContainerPoint([p.lat, p.lng]));

          ctx.beginPath();
          ctx.moveTo(pixels[0].x, pixels[0].y);
          for (let i = 1; i < pixels.length; i++) {
            ctx.lineTo(pixels[i].x, pixels[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.08;
          ctx.fill();

          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 2) Dessiner les communes non desservies (croix rouges)
        if (nonDesserviesPoints.length > 0) {
          const crossSize = zoom >= 11 ? 4 : zoom >= 9 ? 3 : zoom >= 7 ? 2.5 : 1.5;
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = zoom >= 9 ? 1.5 : 1;
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          for (const p of nonDesserviesPoints) {
            if (p.lat < bounds.getSouth() || p.lat > bounds.getNorth()) continue;
            if (p.lng < bounds.getWest() || p.lng > bounds.getEast()) continue;

            const pixel = m.latLngToContainerPoint([p.lat, p.lng]);
            const x = pixel.x;
            const y = pixel.y;
            // Diagonale \
            ctx.moveTo(x - crossSize, y - crossSize);
            ctx.lineTo(x + crossSize, y + crossSize);
            // Diagonale /
            ctx.moveTo(x + crossSize, y - crossSize);
            ctx.lineTo(x - crossSize, y + crossSize);
          }
          ctx.stroke();
        }

        // 3) Dessiner les points desservis par-dessus
        const radius = zoom >= 11 ? 5 : zoom >= 9 ? 4 : zoom >= 7 ? 3 : 2;
        const byColor = new Map<string, { x: number; y: number }[]>();

        for (const p of points) {
          if (p.lat < bounds.getSouth() || p.lat > bounds.getNorth()) continue;
          if (p.lng < bounds.getWest() || p.lng > bounds.getEast()) continue;

          const pixel = m.latLngToContainerPoint([p.lat, p.lng]);
          const arr = byColor.get(p.color);
          if (arr) arr.push({ x: pixel.x, y: pixel.y });
          else byColor.set(p.color, [{ x: pixel.x, y: pixel.y }]);
        }

        for (const [color, pixels] of byColor) {
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          for (const { x, y } of pixels) {
            ctx.moveTo(x + radius, y);
            ctx.arc(x, y, radius, 0, Math.PI * 2);
          }
          ctx.fill();

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

    // Tooltip au survol
    const tooltip = L.tooltip({ sticky: true, direction: 'top', offset: [0, -10] });
    tooltipRef.current = tooltip;

    function onMouseMove(e: L.LeafletMouseEvent) {
      const latlng = e.latlng;
      const zoom = map.getZoom();
      const searchDist = zoom >= 12 ? 0.005 : zoom >= 10 ? 0.02 : zoom >= 8 ? 0.05 : 0.15;
      const nearest = grid.findNearest(latlng.lat, latlng.lng, searchDist);

      if (nearest) {
        tooltip.setLatLng([nearest.lat, nearest.lng]);

        if (nearest.isNonDesservie) {
          tooltip.setContent(
            `<div style="min-width:150px;">` +
              `<strong>${nearest.nom}</strong><br/>` +
              `<span style="font-size:11px;color:#666;">` +
                `${nearest.codePostal} — Dpt ${nearest.departement}` +
              `</span><br/>` +
              `<span style="display:inline-block;font-size:12px;color:#dc2626;margin-right:4px;font-weight:bold;vertical-align:middle;">✕</span>` +
              `<span style="font-size:11px;color:#dc2626;font-style:italic;">Non desservie</span><br/>` +
              `<span style="font-size:10px;color:#999;">${PRODUCT_LABELS[product]}</span>` +
            `</div>`
          );
        } else {
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
        }

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
  }, [map, points, nonDesserviesPoints, allPoints, hulls, product]);

  return null;
}
