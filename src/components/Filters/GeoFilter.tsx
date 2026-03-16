interface GeoFilterProps {
  departements: string[];
  selected: string[];
  onChange: (depts: string[]) => void;
  viewMode: 'departement' | 'region' | 'commune';
  onViewModeChange: (mode: 'departement' | 'region' | 'commune') => void;
}

export default function GeoFilter({
  departements,
  selected,
  onChange,
  viewMode,
  onViewModeChange,
}: GeoFilterProps) {
  const sorted = [...departements].sort((a, b) => a.localeCompare(b, 'fr'));

  const handleSelectAll = () => onChange([...sorted]);
  const handleDeselectAll = () => onChange([]);

  const handleToggle = (dept: string) => {
    if (selected.includes(dept)) {
      onChange(selected.filter((d) => d !== dept));
    } else {
      onChange([...selected, dept]);
    }
  };

  const modes: { key: 'departement' | 'region' | 'commune'; label: string }[] = [
    { key: 'departement', label: 'Départements' },
    { key: 'region', label: 'Régions' },
    { key: 'commune', label: 'Communes' },
  ];

  return (
    <div className="space-y-2">
      {/* View mode toggle — 3 boutons */}
      <div className="flex rounded-md overflow-hidden border border-gray-300">
        {modes.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => onViewModeChange(mode.key)}
            className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
              viewMode === mode.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {viewMode === 'region' && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
          Mode Régions : coloration par région avec hachures multi-filiales.
        </p>
      )}

      {viewMode === 'commune' && (
        <p className="text-xs text-emerald-600 bg-emerald-50 rounded px-2 py-1">
          Mode Communes : un point par commune, coloré par filiale.
        </p>
      )}

      {/* Select / Deselect all */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {selected.length === 0 ? 'Tous' : `${selected.length} / ${sorted.length}`} départements
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Tous
          </button>
          <span className="text-xs text-gray-300">|</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Aucun
          </button>
        </div>
      </div>

      {/* Departments list */}
      <ul className="max-h-48 overflow-y-auto space-y-0.5 border border-gray-200 rounded-md p-2">
        {sorted.map((dept) => {
          const checked = selected.includes(dept);
          return (
            <li key={dept} className="flex items-center gap-2">
              <input
                id={`dept-${dept}`}
                type="checkbox"
                checked={checked}
                onChange={() => handleToggle(dept)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor={`dept-${dept}`}
                className="text-sm text-gray-700 cursor-pointer"
              >
                {dept}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
