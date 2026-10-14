import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  demoLogin,
  googleAuth,
  getAuthConfig,
  registerSchema,
  loginSchema,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/config', getAuthConfig);
router.post('/google', googleAuth);
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/demo', demoLogin);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);

export default router;
