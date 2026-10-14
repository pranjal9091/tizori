import { Router } from 'express';
import { checkAffordability } from '../controllers/affordability.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.post('/check', checkAffordability);

export default router;
