import { Router } from 'express';
import { getDashboardOverview } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/overview', getDashboardOverview);

export default router;
