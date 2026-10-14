import { Router } from 'express';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  transferBetweenAccounts,
  accountSchema,
} from '../controllers/account.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/', getAccounts);
router.post('/', validateBody(accountSchema), createAccount);
router.patch('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.post('/transfer', transferBetweenAccounts);

export default router;
