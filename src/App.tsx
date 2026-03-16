import { useState, useCallback, useRef } from 'react';
import type { FeatureCollection } from 'geojson';

// Hooks
import { useCommuneData } from './hooks/useCommuneData';
import { useFilters } from './hooks/useFilters';
import { useDepartmentAggregation } from './hooks/useDepartmentAggregation';
import { useFilialeCentroids } from './hooks/useFilialeCentroids';

// Layout
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';

// Map
import MapContainerWrapper from './components/Map/MapContainer';
import DepartmentLayer from './components/Map/DepartmentLayer';
import RegionLayer from './components/Map/RegionLayer';
import FilialeMarkers from './components/Map/FilialeMarkers';
import MapLegend from './components/Map/MapLegend';
import SvgPatternDefs from './components/Map/SvgPatternDefs';
import CommuneLayer from './components/Map/CommuneLayer';

// Filters
import FilterPanel from './components/Filters/FilterPanel';

// DataLoader
import FileUpload from './components/DataLoader/FileUpload';

// Stats
import QuickStats from './components/Stats/QuickStats';

// GeoJSON statique
import departementsGeo from './data/departements.json';
import regionsGeo from './data/regions.json';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const reloadInputRef = useRef<HTMLInputElement>(null);

  // Données communes
  const { communes, loading, error, sheetNames, loadFromFile } = useCommuneData();

  // Filtres
  const {
    filters,
    setProduct,
    toggleFiliale,
    selectAllFiliales,
    deselectAllFiliales,
    setDepartements,
    setViewMode,
    availableFiliales,
    availableDepartements,
  } = useFilters(communes);

  // Agrégations
  const {
    departmentAggregations,
    regionAggregations,
    totalCouvertes,
    totalCommunes,
  } = useDepartmentAggregation(communes, filters);

  // Centroïdes des filiales
  const centroids = useFilialeCentroids(
    communes,
    filters.product,
    filters.filiales
  );

  // Upload fichier
  const handleFileLoaded = useCallback(
    (file: File, sheetName?: string) => {
      loadFromFile(file, sheetName);
    },
    [loadFromFile]
  );

  const hasData = communes.length > 0;

  return (
    <div className="flex h-screen flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar gauche */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
        >
          {/* Zone d'upload : grande si pas de données, compacte sinon */}
          {!hasData ? (
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
          ) : (
            <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-700">
                  <strong>{communes.length.toLocaleString('fr-FR')}</strong> communes chargées
                </span>
                <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800">
                  Recharger
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
              {loading && <p className="mt-1 text-xs text-blue-600">Chargement...</p>}
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
          )}

          {/* Statistiques rapides */}
          {hasData && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Statistiques
              </h3>
              <QuickStats
                communes={communes}
                product={filters.product}
                selectedFiliales={filters.filiales}
              />
            </div>
          )}

          {/* Panneau de filtres */}
          {hasData && (
            <FilterPanel
              totalCommunes={totalCommunes}
              totalCouvertes={totalCouvertes}
              filialesCount={filters.filiales.length}
              product={filters.product}
              onProductChange={setProduct}
              filiales={availableFiliales}
              selectedFiliales={filters.filiales}
              onFilialeToggle={toggleFiliale}
              onFilialeSelectAll={selectAllFiliales}
              onFilialeDeselectAll={deselectAllFiliales}
              departements={availableDepartements}
              selectedDepartements={filters.departements}
              onDepartementsChange={setDepartements}
              viewMode={filters.viewMode}
              onViewModeChange={setViewMode}
            />
          )}
        </Sidebar>

        {/* Carte */}
        <main className="relative flex-1">
          <SvgPatternDefs />

          {/* Message d'accueil si pas de données */}
          {!hasData && !loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="rounded-xl bg-white/90 p-8 shadow-lg text-center max-w-md backdrop-blur">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Aucune donnée chargée
                </h2>
                <p className="text-sm text-gray-500">
                  Glissez votre fichier Excel (.xlsx) dans le panneau de gauche pour visualiser les zones de chalandise.
                </p>
              </div>
            </div>
          )}

          <MapContainerWrapper selectedDepartements={filters.departements}>
            {hasData && filters.viewMode === 'departement' && (
              <DepartmentLayer
                geoData={departementsGeo as unknown as FeatureCollection}
                aggregations={departmentAggregations}
                selectedDepartements={filters.departements}
              />
            )}
            {hasData && filters.viewMode === 'region' && (
              <RegionLayer
                geoData={regionsGeo as unknown as FeatureCollection}
                aggregations={regionAggregations}
                selectedDepartements={filters.departements}
              />
            )}
            {hasData && filters.viewMode === 'commune' && (
              <CommuneLayer
                communes={communes}
                product={filters.product}
                selectedFiliales={filters.filiales}
                selectedDepartements={filters.departements}
              />
            )}
            {hasData && filters.viewMode !== 'commune' && (
              <FilialeMarkers
                centroids={centroids}
                product={filters.product}
              />
            )}
          </MapContainerWrapper>

          {hasData && (
            <MapLegend
              aggregations={
                filters.viewMode === 'region'
                  ? regionAggregations
                  : departmentAggregations
              }
              product={filters.product}
              viewMode={filters.viewMode}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
