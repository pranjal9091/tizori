import { Router } from 'express';
import {
  getVaults,
  createVault,
  depositIntoVault,
  withdrawFromVault,
  deleteVault,
  vaultSchema,
} from '../controllers/vault.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/', getVaults);
router.post('/', validateBody(vaultSchema), createVault);
router.post('/:id/deposit', depositIntoVault);
router.post('/:id/withdraw', withdrawFromVault);
router.delete('/:id', deleteVault);

export default router;
