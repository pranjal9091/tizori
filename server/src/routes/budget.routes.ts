import { Router } from 'express';
import { getBudgets, upsertBudget, deleteBudget, budgetSchema } from '../controllers/budget.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/', getBudgets);
router.post('/', validateBody(budgetSchema), upsertBudget);
router.delete('/:id', deleteBudget);

export default router;
