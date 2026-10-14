import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. Token missing.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string };

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid session or user no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session expired or token invalid.' });
  }
}

export function requirePro(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.tier !== 'pro') {
    res.status(403).json({
      success: false,
      message: 'This premium analytics feature requires Tizori Pro subscription.',
      requiresUpgrade: true,
    });
    return;
  }
  next();
}
