import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Layer, PathOptions } from 'leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { DepartmentAggregation } from '../../types';
import { getFilialeColor } from '../../utils/colors';

interface DepartmentLayerProps {
  geoData: FeatureCollection;
  aggregations: DepartmentAggregation[];
  selectedDepartements: string[];
}

export default function DepartmentLayer({
  geoData,
  aggregations,
  selectedDepartements,
}: DepartmentLayerProps) {
  const aggMap = useMemo(() => {
    const map = new Map<string, DepartmentAggregation>();
    for (const agg of aggregations) {
      map.set(agg.codeDept, agg);
    }
    return map;
  }, [aggregations]);

  const filteredGeoData = useMemo<FeatureCollection>(() => {
    if (selectedDepartements.length === 0) return geoData;
    return {
      type: 'FeatureCollection',
      features: geoData.features.filter((f) => {
        const code = (f.properties as Record<string, unknown>)?.code as string | undefined;
        return code !== undefined && selectedDepartements.includes(code);
      }),
    };
  }, [geoData, selectedDepartements]);

  // Identifier les filiales actives
  const activeFiliales = useMemo(() => {
    const set = new Set<string>();
    for (const agg of aggregations) {
      for (const fp of agg.filialesPresentes) {
        set.add(fp.filiale);
      }
    }
    return Array.from(set).sort();
  }, [aggregations]);

  const geoKey = useMemo(
    () =>
      JSON.stringify(
        aggregations.map((a) => `${a.codeDept}:${a.filialeDominante}:${a.communesCouvertes}`)
      ) + selectedDepartements.join(','),
    [aggregations, selectedDepartements]
  );

  // Mode multi-filiales : 2-8 filiales → couches superposées semi-transparentes
  const isMultiMode = activeFiliales.length > 1 && activeFiliales.length <= 8;

  // Tooltip enrichi avec toutes les filiales présentes
  function onEachFeature(feature: Feature<Geometry>, layer: Layer) {
    const props = feature.properties as Record<string, unknown>;
    const code = props?.code as string | undefined;
    const nom = (props?.nom as string) ?? '';
    const agg = code ? aggMap.get(code) : undefined;

    if (!agg || agg.filialesPresentes.length === 0) {
      layer.bindTooltip(
        `<strong>${nom} (${code ?? ''})</strong><br/><em>Aucune couverture</em>`
      );
      return;
    }

    const filialeLines = agg.filialesPresentes
      .map((f) => {
        const color = getFilialeColor(f.filiale);
        return (
          `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;` +
          `background:${color};margin-right:5px;vertical-align:middle;"></span>` +
          `${f.filiale} — ${f.nbCommunes} com. (${f.pctCommunes}%)`
        );
      })
      .join('<br/>');

    layer.bindTooltip(
      `<div style="min-width:200px;">` +
        `<strong style="font-size:13px;">${nom} (${code ?? ''})</strong><br/>` +
        `<span style="font-size:11px;color:#666;">` +
          `Couverture : ${agg.communesCouvertes} / ${agg.totalCommunes} communes` +
        `</span>` +
        `<hr style="margin:4px 0;border-color:#e5e5e5;"/>` +
        `<div style="font-size:11px;line-height:1.6;">${filialeLines}</div>` +
      `</div>`,
      { sticky: true }
    );
  }

  // --- Mode classique (beaucoup de filiales ou 1 seule) : couleur dominante ---
  if (!isMultiMode) {
    function styleSingle(feature: Feature<Geometry> | undefined): PathOptions {
      if (!feature) return {};
      const code = (feature.properties as Record<string, unknown>)?.code as string | undefined;
      const agg = code ? aggMap.get(code) : undefined;
      const fillColor = agg?.filialeDominante
        ? getFilialeColor(agg.filialeDominante)
        : '#BDC3C7';

      return {
        fillColor,
        fillOpacity: 0.4,
        color: '#333',
        weight: 1,
      };
    }

    return (
      <GeoJSON
        key={geoKey}
        data={filteredGeoData}
        style={styleSingle}
        onEachFeature={onEachFeature}
      />
    );
  }

  // --- Mode multi-filiales : couches superposées semi-transparentes ---
  return (
    <>
      {/* Couche de base : contours + tooltips */}
      <GeoJSON
        key={`borders-${geoKey}`}
        data={filteredGeoData}
        style={() => ({
          fillColor: '#f0f0f0',
          fillOpacity: 0.05,
          color: '#333',
          weight: 1.5,
        })}
        onEachFeature={onEachFeature}
      />

      {/* Une couche colorée par filiale */}
      {activeFiliales.map((filiale) => {
        const filialeGeoData: FeatureCollection = {
          type: 'FeatureCollection',
          features: filteredGeoData.features.filter((f) => {
            const code = (f.properties as Record<string, unknown>)?.code as string | undefined;
            if (!code) return false;
            const agg = aggMap.get(code);
            return agg?.filialesPresentes.some((fp) => fp.filiale === filiale) ?? false;
          }),
        };

        if (filialeGeoData.features.length === 0) return null;

        const color = getFilialeColor(filiale);

        function styleFiliale(feature: Feature<Geometry> | undefined): PathOptions {
          if (!feature) return {};
          const code = (feature.properties as Record<string, unknown>)?.code as string | undefined;
          const agg = code ? aggMap.get(code) : undefined;
          const fp = agg?.filialesPresentes.find((f) => f.filiale === filiale);
          const share = fp ? fp.pctCommunes / 100 : 0;
          const opacity = 0.15 + share * 0.3;

          return {
            fillColor: color,
            fillOpacity: opacity,
            color: 'transparent',
            weight: 0,
          };
        }

        // Désactiver le pointer-events pour laisser passer le tooltip de la couche de base
        function disablePointer(_feat: Feature<Geometry>, layer: Layer) {
          layer.on('add', () => {
            const el = (layer as unknown as { getElement?: () => SVGElement | null }).getElement?.();
            if (el) el.style.pointerEvents = 'none';
          });
        }

        return (
          <GeoJSON
            key={`filiale-${filiale}-${geoKey}`}
            data={filialeGeoData}
            style={styleFiliale}
            onEachFeature={disablePointer}
          />
        );
      })}
    </>
  );
}
