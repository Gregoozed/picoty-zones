/** Sanitize un nom de filiale pour un ID SVG valide */
export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}
