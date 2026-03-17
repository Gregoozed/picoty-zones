import { FILIALE_COLORS } from '../../utils/colors';

// Sanitize le nom de filiale pour un ID SVG valide
export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * SVG caché contenant les définitions de patterns (hachures)
 * pour toutes les filiales. Rendu une seule fois dans le DOM,
 * les patterns sont référençables via url(#hatch45-NOM) depuis
 * n'importe quel SVG de la page (y compris celui de Leaflet).
 */
export default function SvgPatternDefs() {
  return (
    <svg
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <defs>
        {Object.entries(FILIALE_COLORS).map(([name, color]) => (
          <g key={name}>
            {/* Hachures diagonales 45° — filiale secondaire */}
            <pattern
              id={`hatch45-${sanitizeName(name)}`}
              patternUnits="userSpaceOnUse"
              width="10"
              height="10"
              patternTransform="rotate(45)"
            >
              <line
                x1="0" y1="0" x2="0" y2="10"
                stroke={color}
                strokeWidth="4"
                strokeOpacity="0.65"
              />
            </pattern>

            {/* Hachures diagonales 135° — filiale tertiaire */}
            <pattern
              id={`hatch135-${sanitizeName(name)}`}
              patternUnits="userSpaceOnUse"
              width="10"
              height="10"
              patternTransform="rotate(135)"
            >
              <line
                x1="0" y1="0" x2="0" y2="10"
                stroke={color}
                strokeWidth="3"
                strokeOpacity="0.55"
              />
            </pattern>
          </g>
        ))}
      </defs>
    </svg>
  );
}
