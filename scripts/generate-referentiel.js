const fs = require('fs');
const path = require('path');

const GEO_API_URL = 'https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux,codeDepartement,centre&format=json&boost=population';
const GEO_JSON_PATH = path.join(__dirname, '..', 'client', 'src', 'data', 'communes-geo.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'client', 'src', 'data', 'communes-referentiel.json');

async function main() {
  // 1. Load existing communes-geo.json
  console.log('Loading communes-geo.json...');
  const communesGeo = JSON.parse(fs.readFileSync(GEO_JSON_PATH, 'utf-8'));
  console.log(`  ${Object.keys(communesGeo).length} entries in communes-geo.json`);

  // 2. Fetch from geo.api.gouv.fr
  console.log('Fetching from geo.api.gouv.fr...');
  const response = await fetch(GEO_API_URL);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }
  const apiCommunes = await response.json();
  console.log(`  ${apiCommunes.length} communes from API`);

  // 3. Build referentiel from API data
  const referentiel = {};
  let apiUsedCoords = 0;
  let geoUsedCoords = 0;

  for (const commune of apiCommunes) {
    const code = commune.code;
    const nom = commune.nom;
    const cp = (commune.codesPostaux && commune.codesPostaux.length > 0)
      ? commune.codesPostaux[0]
      : '';
    const dep = commune.codeDepartement; // handles 2A, 2B natively

    // Prefer existing geo coordinates if available
    let lat, lng;
    if (communesGeo[code]) {
      lat = communesGeo[code][0];
      lng = communesGeo[code][1];
      geoUsedCoords++;
    } else if (commune.centre && commune.centre.coordinates) {
      // GeoJSON format: [lng, lat]
      lng = commune.centre.coordinates[0];
      lat = commune.centre.coordinates[1];
      apiUsedCoords++;
    } else {
      // Skip communes without any coordinates
      continue;
    }

    referentiel[code] = { nom, cp, dep, lat, lng };
  }

  // 4. Add communes from geo file that are NOT in the API (old codes, etc.)
  const apiCodes = new Set(apiCommunes.map(c => c.code));
  let geoOnly = 0;
  for (const [code, coords] of Object.entries(communesGeo)) {
    if (!apiCodes.has(code)) {
      // Derive department from code
      let dep;
      if (code.startsWith('2A') || code.startsWith('2a')) {
        dep = '2A';
      } else if (code.startsWith('2B') || code.startsWith('2b')) {
        dep = '2B';
      } else {
        dep = code.substring(0, 2);
      }

      referentiel[code] = {
        nom: '',
        cp: '',
        dep,
        lat: coords[0],
        lng: coords[1]
      };
      geoOnly++;
    }
  }

  // 5. Write output (compact JSON)
  console.log(`\nResults:`);
  console.log(`  ${Object.keys(referentiel).length} total communes in referentiel`);
  console.log(`  ${geoUsedCoords} coords from communes-geo.json (preferred)`);
  console.log(`  ${apiUsedCoords} coords from API (fallback)`);
  console.log(`  ${geoOnly} communes only in geo file (no API match)`);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(referentiel), 'utf-8');

  const sizeMB = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\nWritten to ${OUTPUT_PATH} (${sizeMB} MB)`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
