import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', getDashboardAnalytics);

export default router;
