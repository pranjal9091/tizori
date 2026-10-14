import { Router } from 'express';
import {
  getDatabaseStatus,
  testDatabaseConnection,
  switchDatabaseConnection,
  exportDatabaseData,
  exportCsvLedger,
  importDatabaseData,
} from '../controllers/database.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public/Admin status check
router.get('/status', getDatabaseStatus);
router.post('/test', testDatabaseConnection);
router.post('/connect', switchDatabaseConnection);

// User-specific data management
router.get('/export', requireAuth, exportDatabaseData);
router.get('/export-csv', requireAuth, exportCsvLedger);
router.post('/import', requireAuth, importDatabaseData);

export default router;
