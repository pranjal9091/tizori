import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  transactionSchema,
} from '../controllers/transaction.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/', getTransactions);
router.post('/', validateBody(transactionSchema), createTransaction);
router.delete('/:id', deleteTransaction);

export default router;
