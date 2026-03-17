import { useState, useCallback, useRef, useEffect } from 'react';
import type { FeatureCollection } from 'geojson';
import type { CommuneData, ProductType, DepartmentAggregation, RegionAggregation, FilialeCentroid } from '../types';

import {
  fetchCommunes, fetchStatus, uploadFile,
  fetchFilters, fetchDeptAggregations, fetchRegionAggregations,
  fetchCentroids, fetchNonDesservies,
} from '../services/communeApi';

// Layout
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';

// Map
import MapContainerWrapper from '../components/Map/MapContainer';
import DepartmentLayer from '../components/Map/DepartmentLayer';
import RegionLayer from '../components/Map/RegionLayer';
import FilialeMarkers from '../components/Map/FilialeMarkers';
import MapLegend from '../components/Map/MapLegend';
import SvgPatternDefs from '../components/Map/SvgPatternDefs';
import CommuneLayer from '../components/Map/CommuneLayer';

// Filters
import FilterPanel from '../components/Filters/FilterPanel';

// DataLoader
import FileUpload from '../components/DataLoader/FileUpload';

// Stats
import QuickStats from '../components/Stats/QuickStats';
import NonDesserviesList from '../components/Stats/NonDesserviesList';

// GeoJSON statique
import departementsGeo from '../data/departements.json';
import regionsGeo from '../data/regions.json';

export default function ZonesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const reloadInputRef = useRef<HTMLInputElement>(null);

  // Data state
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Filter state
  const [product, setProduct] = useState<ProductType>('PP');
  const [filiales, setFiliales] = useState<string[]>([]);
  const [departements, setDepartements] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'departement' | 'region' | 'commune'>('departement');
  const [showNonDesservies, setShowNonDesservies] = useState(false);

  // Available filter options
  const [availableFiliales, setAvailableFiliales] = useState<string[]>([]);
  const [availableDepartements, setAvailableDepartements] = useState<string[]>([]);

  // Computed results
  const [deptAggregations, setDeptAggregations] = useState<DepartmentAggregation[]>([]);
  const [regionAggregations, setRegionAggregations] = useState<RegionAggregation[]>([]);
  const [centroids, setCentroids] = useState<FilialeCentroid[]>([]);
  const [totalCouvertes, setTotalCouvertes] = useState(0);
  const [totalCommunes, setTotalCommunes] = useState(0);
  const [nonDesserviesCount, setNonDesserviesCount] = useState(0);
  const [nonDesserviesEntries, setNonDesserviesEntries] = useState<{ codeInsee: string; nom: string; cp: string; dep: string }[]>([]);

  // Load initial data
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const data = await fetchCommunes();
        if (cancelled) return;
        if (data.length > 0) {
          setCommunes(data);
          try {
            const status = await fetchStatus();
            setLastUpdated(status.lastUpdated);
          } catch { /* non-bloquant */ }
        }
      } catch {
        console.warn('API indisponible');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // Load filters when communes or product change
  useEffect(() => {
    if (communes.length === 0) return;
    let cancelled = false;
    async function loadFilters() {
      try {
        const f = await fetchFilters(product);
        if (cancelled) return;
        setAvailableDepartements(f.departements);
        setAvailableFiliales(f.filiales);
        setFiliales(prev => {
          const kept = prev.filter(fil => f.filiales.includes(fil));
          return kept.length > 0 ? kept : f.filiales;
        });
      } catch {
        console.warn('Erreur chargement filtres');
      }
    }
    loadFilters();
    return () => { cancelled = true; };
  }, [communes, product]);

  // Load aggregations, centroids, non-desservies when filters change
  useEffect(() => {
    if (communes.length === 0 || filiales.length === 0) return;
    let cancelled = false;

    async function loadResults() {
      try {
        const [deptRes, regionRes, centroidsRes, ndRes] = await Promise.all([
          fetchDeptAggregations(product, filiales, departements),
          fetchRegionAggregations(product, filiales, departements),
          fetchCentroids(product, filiales),
          fetchNonDesservies(product, departements),
        ]);
        if (cancelled) return;
        setDeptAggregations(deptRes.aggregations);
        setTotalCouvertes(deptRes.totalCouvertes);
        setTotalCommunes(deptRes.totalCommunes);
        setRegionAggregations(regionRes);
        setCentroids(centroidsRes);
        setNonDesserviesCount(ndRes.count);
        setNonDesserviesEntries(ndRes.communes);
      } catch {
        console.warn('Erreur chargement resultats');
      }
    }
    loadResults();
    return () => { cancelled = true; };
  }, [communes, product, filiales, departements]);

  // File upload handler
  const handleFileLoaded = useCallback(async (file: File, sheetName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await uploadFile(file, sheetName);
      setSheetNames(result.sheetNames || []);
      const data = await fetchCommunes();
      setCommunes(data);
      try {
        const status = await fetchStatus();
        setLastUpdated(status.lastUpdated);
      } catch { /* non-bloquant */ }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du traitement du fichier';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter callbacks
  const handleProductChange = useCallback((p: ProductType) => setProduct(p), []);
  const handleToggleFiliale = useCallback((filiale: string) => {
    setFiliales(prev =>
      prev.includes(filiale) ? prev.filter(f => f !== filiale) : [...prev, filiale]
    );
  }, []);
  const handleSelectAllFiliales = useCallback(() => setFiliales(availableFiliales), [availableFiliales]);
  const handleDeselectAllFiliales = useCallback(() => setFiliales([]), []);
  const handleDepartementsChange = useCallback((d: string[]) => setDepartements(d), []);
  const handleViewModeChange = useCallback((vm: 'departement' | 'region' | 'commune') => setViewMode(vm), []);
  const handleToggleNonDesservies = useCallback(() => setShowNonDesservies(prev => !prev), []);

  const hasData = communes.length > 0;

  return (
    <div className="flex h-screen flex-col">
      <Header
        hasData={hasData}
        product={product}
        viewMode={viewMode}
        filiales={filiales}
        departements={departements}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(prev => !prev)}
        >
          {!hasData && !loading ? (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Charger un fichier Excel
              </h3>
              <FileUpload
                onFileLoaded={handleFileLoaded}
                sheetNames={sheetNames}
                loading={loading}
                error={error}
              />
            </div>
          ) : hasData ? (
            <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-700">
                  <strong>{communes.length.toLocaleString('fr-FR')}</strong> communes chargees
                </span>
                <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800">
                  Mettre a jour
                  <input
                    ref={reloadInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileLoaded(file);
                    }}
                  />
                </label>
              </div>
              {lastUpdated && (
                <p className="text-xs text-gray-400 mt-1">
                  Derniere MAJ : {new Date(lastUpdated).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {sheetNames.length > 1 && (
                <select
                  onChange={(e) => {
                    if (reloadInputRef.current?.files?.[0]) {
                      handleFileLoaded(reloadInputRef.current.files[0], e.target.value);
                    }
                  }}
                  className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                >
                  {sheetNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
              {loading && <p className="mt-1 text-xs text-blue-600">Mise a jour...</p>}
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
          ) : null}

          {hasData && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Statistiques
              </h3>
              <QuickStats
                communes={communes}
                product={product}
                selectedFiliales={filiales}
              />
            </div>
          )}

          {hasData && (
            <FilterPanel
              totalCommunes={totalCommunes}
              totalCouvertes={totalCouvertes}
              filialesCount={filiales.length}
              product={product}
              onProductChange={handleProductChange}
              filiales={availableFiliales}
              selectedFiliales={filiales}
              onFilialeToggle={handleToggleFiliale}
              onFilialeSelectAll={handleSelectAllFiliales}
              onFilialeDeselectAll={handleDeselectAllFiliales}
              departements={availableDepartements}
              selectedDepartements={departements}
              onDepartementsChange={handleDepartementsChange}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              showNonDesservies={showNonDesservies}
              onToggleNonDesservies={handleToggleNonDesservies}
              nonDesserviesCount={nonDesserviesCount}
            />
          )}

          {hasData && showNonDesservies && (
            <div className="mt-4">
              <NonDesserviesList
                entries={nonDesserviesEntries}
                product={product}
                selectedDepartements={departements}
              />
            </div>
          )}
        </Sidebar>

        <main className="relative flex-1">
          <SvgPatternDefs />

          {!hasData && !loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="rounded-xl bg-white/90 p-8 shadow-lg text-center max-w-md backdrop-blur">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Aucune donnee chargee</h2>
                <p className="text-sm text-gray-500">
                  Glissez votre fichier Excel (.xlsx) dans le panneau de gauche pour visualiser les zones de chalandise.
                </p>
              </div>
            </div>
          )}

          <MapContainerWrapper selectedDepartements={departements}>
            {hasData && viewMode === 'departement' && (
              <DepartmentLayer
                geoData={departementsGeo as unknown as FeatureCollection}
                aggregations={deptAggregations}
                selectedDepartements={departements}
              />
            )}
            {hasData && viewMode === 'region' && (
              <RegionLayer
                geoData={regionsGeo as unknown as FeatureCollection}
                aggregations={regionAggregations}
                selectedDepartements={departements}
              />
            )}
            {hasData && viewMode === 'commune' && (
              <CommuneLayer
                communes={communes}
                product={product}
                selectedFiliales={filiales}
                selectedDepartements={departements}
                showNonDesservies={showNonDesservies}
              />
            )}
            {hasData && viewMode !== 'commune' && (
              <FilialeMarkers centroids={centroids} product={product} />
            )}
          </MapContainerWrapper>

          {hasData && (
            <MapLegend
              aggregations={viewMode === 'region' ? regionAggregations : deptAggregations}
              product={product}
              viewMode={viewMode}
            />
          )}
        </main>
      </div>
    </div>
  );
}
