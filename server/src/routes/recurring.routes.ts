import { Router } from 'express';
import {
  getRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  logRecurringPayment,
  recurringBillSchema,
} from '../controllers/recurring.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/', getRecurringBills);
router.post('/', validateBody(recurringBillSchema), createRecurringBill);
router.patch('/:id', updateRecurringBill);
router.delete('/:id', deleteRecurringBill);
router.post('/:id/log-payment', logRecurringPayment);

export default router;
