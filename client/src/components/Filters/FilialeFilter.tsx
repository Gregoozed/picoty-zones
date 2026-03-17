import { getFilialeColor } from '../../utils/colors';

interface FilialeFilterProps {
  filiales: string[];
  selected: string[];
  onToggle: (filiale: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function FilialeFilter({
  filiales,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: FilialeFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {selected.length} / {filiales.length} filiales
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Tout sélectionner
          </button>
          <span className="text-xs text-gray-300">|</span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      <ul className="max-h-52 overflow-y-auto space-y-0.5 border border-gray-200 rounded-md p-2">
        {filiales.map((filiale) => {
          const checked = selected.includes(filiale);
          const color = getFilialeColor(filiale);
          return (
            <li key={filiale} className="flex items-center gap-2">
              <input
                id={`filiale-${filiale}`}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(filiale)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span
                className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <label
                htmlFor={`filiale-${filiale}`}
                className="text-sm text-gray-700 truncate cursor-pointer"
              >
                {filiale}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
