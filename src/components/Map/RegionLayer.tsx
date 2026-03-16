import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Layer, PathOptions } from 'leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { RegionAggregation } from '../../types';
import { getFilialeColor } from '../../utils/colors';
import { getDeptToRegionMap } from '../../utils/aggregation';
import { sanitizeName } from './SvgPatternDefs';

interface RegionLayerProps {
  geoData: FeatureCollection;
  aggregations: RegionAggregation[];
  selectedDepartements: string[];
}

export default function RegionLayer({
  geoData,
  aggregations,
  selectedDepartements,
}: RegionLayerProps) {
  const aggMap = useMemo(() => {
    const map = new Map<string, RegionAggregation>();
    for (const agg of aggregations) {
      map.set(agg.codeRegion, agg);
    }
    return map;
  }, [aggregations]);

  const filteredGeoData = useMemo<FeatureCollection>(() => {
    if (selectedDepartements.length === 0) return geoData;
    const deptToRegion = getDeptToRegionMap();
    const visibleRegions = new Set<string>();
    for (const dept of selectedDepartements) {
      const region = deptToRegion[dept];
      if (region) visibleRegions.add(region);
    }
    return {
      type: 'FeatureCollection',
      features: geoData.features.filter((f) => {
        const code = (f.properties as Record<string, unknown>)?.code as string | undefined;
        return code !== undefined && visibleRegions.has(code);
      }),
    };
  }, [geoData, selectedDepartements]);

  const geoKey = useMemo(
    () =>
      JSON.stringify(
        aggregations.map((a) => `${a.codeRegion}:${a.filialeDominante}:${a.communesCouvertes}`)
      ) + selectedDepartements.join(','),
    [aggregations, selectedDepartements]
  );

  // Tooltip enrichi avec toutes les filiales
  function onEachFeature(feature: Feature<Geometry>, layer: Layer) {
    const props = feature.properties as Record<string, unknown>;
    const code = props?.code as string | undefined;
    const nom = (props?.nom as string) ?? '';
    const agg = code ? aggMap.get(code) : undefined;

    if (!agg || agg.filialesPresentes.length === 0) {
      layer.bindTooltip(
        `<strong>${nom}</strong><br/><em>Aucune couverture</em>`
      );
      return;
    }

    const filialeLines = agg.filialesPresentes
      .map((f, i) => {
        const color = getFilialeColor(f.filiale);
        const badge = i === 0 ? '█' : i === 1 ? '▓' : '░';
        return `<span style="color:${color};font-weight:bold;">${badge}</span> ${f.filiale} — ${f.nbCommunes} com. (${f.pctCommunes}%)`;
      })
      .join('<br/>');

    layer.bindTooltip(
      `<div style="min-width:220px;">` +
        `<strong style="font-size:13px;">${nom}</strong><br/>` +
        `<span style="font-size:11px;color:#666;">` +
          `Couverture : ${agg.communesCouvertes} / ${agg.totalCommunes} communes` +
        `</span>` +
        `<hr style="margin:4px 0;border-color:#e5e5e5;"/>` +
        `<div style="font-size:11px;line-height:1.6;">${filialeLines}</div>` +
      `</div>`,
      { sticky: true, direction: 'top' }
    );
  }

  // --- Couche 1 : aplat solide (filiale dominante) + contours + tooltips ---
  function styleBase(feature: Feature<Geometry> | undefined): PathOptions {
    if (!feature) return {};
    const code = (feature.properties as Record<string, unknown>)?.code as string | undefined;
    const agg = code ? aggMap.get(code) : undefined;
    const fillColor = agg?.filialeDominante
      ? getFilialeColor(agg.filialeDominante)
      : '#BDC3C7';

    return {
      fillColor,
      fillOpacity: 0.3,
      color: '#333',
      weight: 1.5,
    };
  }

  // --- Couche 2 : hachures 45° pour la 2e filiale ---
  function styleHatch45(feature: Feature<Geometry> | undefined): PathOptions {
    if (!feature) return { fillOpacity: 0, stroke: false };
    const code = (feature.properties as Record<string, unknown>)?.code as string | undefined;
    const agg = code ? aggMap.get(code) : undefined;
    const second = agg?.filialesPresentes[1];
    if (!second) return { fillOpacity: 0, stroke: false };

    return {
      // Leaflet passe cette valeur directement à l'attribut SVG fill=""
      fillColor: `url(#hatch45-${sanitizeName(second.filiale)})`,
      fillOpacity: 1,
      stroke: false,
    };
  }

  // --- Couche 3 : hachures 135° pour la 3e filiale ---
  function styleHatch135(feature: Feature<Geometry> | undefined): PathOptions {
    if (!feature) return { fillOpacity: 0, stroke: false };
    const code = (feature.properties as Record<string, unknown>)?.code as string | undefined;
    const agg = code ? aggMap.get(code) : undefined;
    const third = agg?.filialesPresentes[2];
    if (!third) return { fillOpacity: 0, stroke: false };

    return {
      fillColor: `url(#hatch135-${sanitizeName(third.filiale)})`,
      fillOpacity: 1,
      stroke: false,
    };
  }

  // Désactiver les interactions sur les couches de hachures (pour que le tooltip
  // de la couche de base reste accessible)
  function disablePointerEvents(_feature: Feature<Geometry>, layer: Layer) {
    layer.on('add', () => {
      const el = (layer as unknown as { getElement?: () => SVGElement | null }).getElement?.();
      if (el) {
        el.style.pointerEvents = 'none';
      }
    });
  }

  return (
    <>
      {/* Couche de base : aplat + contours + tooltips */}
      <GeoJSON
        key={`base-${geoKey}`}
        data={filteredGeoData}
        style={styleBase}
        onEachFeature={onEachFeature}
      />

      {/* Couche hachures 45° (2e filiale) */}
      <GeoJSON
        key={`hatch2-${geoKey}`}
        data={filteredGeoData}
        style={styleHatch45}
        onEachFeature={disablePointerEvents}
      />

      {/* Couche hachures 135° (3e filiale) */}
      <GeoJSON
        key={`hatch3-${geoKey}`}
        data={filteredGeoData}
        style={styleHatch135}
        onEachFeature={disablePointerEvents}
      />
    </>
  );
}
