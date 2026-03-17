# Picoty Zones de Chalandise

Application de visualisation et gestion des zones de chalandise du Groupe Picoty.
Import de fichiers Excel de communes avec filiales par produit, affichage sur carte interactive.

## Stack

- **Frontend** : React 19 + Vite + Tailwind CSS 4 + Leaflet + react-router-dom
- **Backend** : Express + Sequelize ORM + MySQL
- **Langage** : TypeScript strict sur front et back

## Demarrage

```bash
# Les deux en parallele
npm run dev

# Ou separement
cd back && npm run dev     # Serveur Express sur :3001
cd front && npm run dev    # Vite dev server sur :5173
```

## Base de donnees

- **Moteur** : MySQL
- **Base** : `picoty_zones`, user `picoty_user`
- **ORM** : Sequelize avec `underscored: true` (camelCase en TS, snake_case en BDD)
- **Migrations** : `cd back && npx sequelize-cli db:migrate`
- **Tables** : `communes` (donnees Excel), `users` (nom, prenom, email, username)
- Jamais de `sync({ force: true })` en production

## Architecture

```
back/
  server.ts              # Point d'entree Express
  config/
    database.ts          # Config Sequelize (MySQL)
    database.cjs         # Config pour sequelize-cli
  models/
    Commune.ts           # Modele Sequelize (timestamps: createdAt + updatedAt)
    User.ts              # Modele Sequelize (nom, prenom, email, username)
    index.ts             # Init Sequelize + export models
  controllers/
    communeController.ts # Tous les handlers API (communes, filtres, aggregations, export)
  routes/
    communeRoutes.ts     # Definitions de routes Express
  services/
    importExcel.ts       # Parsing Excel avec exceljs
  middlewares/
    auth.ts              # Placeholder JWT/RBAC pour PingOne
  utils/
    aggregation.ts       # Logique metier : agregations dept/region, filiales, non-desservies
    geo.ts               # DEPT_CENTERS + computeCentroid
  types/
    index.ts             # Types partages (CommuneData, ProductType, etc.)
  data/
    communes-referentiel.json  # Referentiel 36k communes
    referentiel.ts             # Import et export du referentiel
  migrations/            # Migrations sequelize-cli

front/src/
  pages/
    ZonesPage.tsx        # Page principale (carte + filtres + stats) — appels API directs
    LoginPage.tsx        # Placeholder login (PingOne)
  components/
    Layout/              # Header, Sidebar
    Map/                 # MapContainer, DepartmentLayer, RegionLayer, CommuneLayer, etc.
    Filters/             # FilterPanel, ProductSelector, FilialeFilter, GeoFilter
    DataLoader/          # FileUpload
    Stats/               # QuickStats, NonDesserviesList
  services/
    communeApi.ts        # Appels API centralises (fetch + export URLs)
  types/
    index.ts             # Types TS derives des modeles Sequelize
  contexts/
    UserContext.ts       # createContext + types auth
    UserProvider.tsx     # Composant provider auth (placeholder PingOne)
    useUser.ts           # Hook useUser
  utils/
    colors.ts            # Couleurs par filiale
    deptRegionMap.ts     # Mapping departement → region
    svg.ts               # sanitizeName pour IDs SVG
    referentiel.ts       # Referentiel communes (pour CommuneLayer canvas)
  data/                  # GeoJSON statique (communes, departements, regions)
```

## Principes

### API-first
Toute la logique metier (aggregations, filtres, centroides, non-desservies, export Excel/CSV) est cote back. Le front ne fait qu'afficher et consommer les API via `communeApi.ts`. Pas de hooks custom — ZonesPage utilise directement useState + useEffect + appels API.

### Migration & base de donnees
Toujours utiliser Sequelize ORM + MySQL. Toute modification de schema passe obligatoirement par une migration `sequelize-cli`. Jamais de `sync({ force: true })` hors environnement de dev isole.

### Typage TypeScript
Les types front (`front/src/types/`) sont derives des modeles Sequelize (`back/models/`). Aucun type custom sans source reelle. Les `any` sont interdits sauf cas extreme documente.

### Dependances
Utiliser `exceljs` pour tout traitement Excel cote back. La librairie `xlsx` est bannie du projet.

### Qualite du code
Objectif 0 erreur ESLint/TypeScript sur le back et le front. Aucun `eslint-disable` — corriger les vraies causes a la place.

### Authentification
L'auth PingOne sera branchee dans `UserProvider.tsx` (front) et `middlewares/auth.ts` (back). Des commentaires `// TODO: PingOne` marquent les emplacements exacts. Aucune logique auth ne doit etre dispersee dans les composants ou pages.

## API Endpoints

| Methode | URL | Description |
|---------|-----|-------------|
| GET | `/api/communes` | Toutes les communes avec territoires |
| GET | `/api/communes/status` | Count + lastUpdated |
| GET | `/api/communes/filters?product=PP` | Filiales et departements disponibles |
| GET | `/api/communes/aggregations/departement?product&filiales&departements` | Agregations par departement |
| GET | `/api/communes/aggregations/region?product&filiales&departements` | Agregations par region |
| GET | `/api/communes/centroids?product&filiales` | Centroides des filiales |
| GET | `/api/communes/non-desservies?product&departements` | Communes non desservies |
| GET | `/api/communes/non-desservies/export?product&departements&format=xlsx\|csv` | Export fichier |
| POST | `/api/upload` | Upload Excel, remplace toutes les donnees |
| GET | `/api/health` | Health check |

## Build preprod

```bash
npm run build:preprod   # Vite build avec base path /zone-picoty/
```
