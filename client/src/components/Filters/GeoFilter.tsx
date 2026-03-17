const DEPT_NAMES: Record<string, string> = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence', '05': 'Hautes-Alpes',
  '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes', '09': 'Ariège', '10': 'Aube',
  '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal',
  '16': 'Charente', '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '2A': 'Corse-du-Sud',
  '2B': 'Haute-Corse', '21': 'Côte-d\'Or', '22': 'Côtes-d\'Armor', '23': 'Creuse', '24': 'Dordogne',
  '25': 'Doubs', '26': 'Drôme', '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistère',
  '30': 'Gard', '31': 'Haute-Garonne', '32': 'Gers', '33': 'Gironde', '34': 'Hérault',
  '35': 'Ille-et-Vilaine', '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura',
  '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire', '44': 'Loire-Atlantique',
  '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne', '48': 'Lozère', '49': 'Maine-et-Loire',
  '50': 'Manche', '51': 'Marne', '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle',
  '55': 'Meuse', '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord',
  '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme', '64': 'Pyrénées-Atlantiques',
  '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales', '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhône',
  '70': 'Haute-Saône', '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie',
  '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines', '79': 'Deux-Sèvres',
  '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne', '83': 'Var', '84': 'Vaucluse',
  '85': 'Vendée', '86': 'Vienne', '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne',
  '90': 'Territoire de Belfort', '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne', '95': 'Val-d\'Oise',
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane', '974': 'La Réunion', '976': 'Mayotte',
};

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
                {dept} — {DEPT_NAMES[dept] || dept}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
