import { Router } from 'express';
import multer from 'multer';
import {
  getCommunes, getStatus, uploadFile,
  getFiltersEndpoint, getDeptAggregations, getRegionAggregations,
  getCentroids, getNonDesserviesEndpoint, exportNonDesservies,
} from '../controllers/communeController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// GET /api/communes
router.get('/', getCommunes);

// GET /api/communes/status
router.get('/status', getStatus);

// GET /api/communes/filters?product=PP
router.get('/filters', getFiltersEndpoint);

// GET /api/communes/aggregations/departement?product=PP&filiales=A,B&departements=01,02
router.get('/aggregations/departement', getDeptAggregations);

// GET /api/communes/aggregations/region?product=PP&filiales=A,B&departements=01,02
router.get('/aggregations/region', getRegionAggregations);

// GET /api/communes/centroids?product=PP&filiales=A,B
router.get('/centroids', getCentroids);

// GET /api/communes/non-desservies?product=PP&departements=01,02
router.get('/non-desservies', getNonDesserviesEndpoint);

// GET /api/communes/non-desservies/export?product=PP&departements=01,02&format=xlsx|csv
router.get('/non-desservies/export', exportNonDesservies);

// POST /api/upload (mounted separately in server.ts to keep the same URL)
export const uploadRouter = Router();
uploadRouter.post('/upload', upload.single('file'), uploadFile);

export default router;
