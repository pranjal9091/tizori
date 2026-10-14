import { Router } from 'express';
import {
  getGullaks,
  createGullak,
  addMoneyToGullak,
  breakGullak,
  deleteGullak,
  gullakSchema,
} from '../controllers/gullak.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/', getGullaks);
router.post('/', validateBody(gullakSchema), createGullak);
router.post('/:id/add', addMoneyToGullak);
router.post('/:id/break', breakGullak);
router.delete('/:id', deleteGullak);

export default router;
