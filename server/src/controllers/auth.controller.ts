import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { ENV } from '../config/env';
import { AuthRequest } from '../middleware/auth';
import { sendLoginAlert } from '../services/email.service';

const googleClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .email('Valid email is required')
    .refine((val) => EMAIL_REGEX.test(val) && val.split('@')[0].length >= 2, {
      message: 'Please enter a valid, legitimate email address (e.g. user@gmail.com)',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters').optional(),
  monthlyIncome: z.number().positive().default(35000),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

function signToken(userId: string): string {
  return jwt.sign({ userId }, ENV.JWT_SECRET, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, confirmPassword, monthlyIncome } = req.body;

  const cleanEmail = (email || '').trim().toLowerCase();
  const localPart = cleanEmail.split('@')[0];
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail) || localPart.length < 2) {
    res.status(400).json({
      success: false,
      message: 'Please enter a valid, legitimate email address (e.g. yourname@gmail.com).',
    });
    return;
  }

  if (confirmPassword && password !== confirmPassword) {
    res.status(400).json({ success: false, message: 'Passwords do not match. Please verify your password.' });
    return;
  }

  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    monthlyIncome: monthlyIncome || 35000,
    currency: 'INR',
    tier: 'free',
    authProvider: 'local',
  });

  // Asynchronously dispatch registration welcome & security email
  sendLoginAlert({
    email: user.email,
    name: user.name,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    authProvider: 'local',
  }).catch(err => console.error('Registration email alert error:', err));

  const token = signToken(user._id.toString());
  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      monthlyIncome: user.monthlyIncome,
      currency: user.currency,
      tier: user.tier,
      authProvider: user.authProvider,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  if (!user.passwordHash) {
    res.status(400).json({
      success: false,
      message: 'This account was created with Google Sign-In. Please sign in with Google.',
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  // Asynchronously dispatch login security email
  sendLoginAlert({
    email: user.email,
    name: user.name,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    authProvider: 'local',
  }).catch(err => console.error('Login email alert error:', err));

  const token = signToken(user._id.toString());
  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      monthlyIncome: user.monthlyIncome,
      currency: user.currency,
      tier: user.tier,
    },
  });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      monthlyIncome: req.user.monthlyIncome,
      currency: req.user.currency,
      tier: req.user.tier,
    },
  });
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  const { name, monthlyIncome } = req.body;
  if (name) req.user.name = name;
  if (monthlyIncome) req.user.monthlyIncome = monthlyIncome;
  await req.user.save();

  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      monthlyIncome: req.user.monthlyIncome,
      currency: req.user.currency,
      tier: req.user.tier,
    },
  });
}

// 1-Click Instant Demo Login (Zero friction for recruiters & evaluators)
export async function demoLogin(req: Request, res: Response): Promise<void> {
  const demoEmail = 'demo@pocketpaisa.app';
  let demoUser = await User.findOne({ email: demoEmail });

  if (!demoUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);
    demoUser = await User.create({
      name: 'Aman Verma',
      email: demoEmail,
      passwordHash,
      monthlyIncome: 35000,
      currency: 'INR',
      tier: 'pro',
    });
  }

  const token = signToken(demoUser._id.toString());
  res.json({
    success: true,
    token,
    user: {
      id: demoUser._id,
      name: demoUser.name,
      email: demoUser.email,
      monthlyIncome: demoUser.monthlyIncome,
      currency: demoUser.currency,
      tier: demoUser.tier,
      authProvider: demoUser.authProvider,
      avatar: demoUser.avatar,
    },
  });
}

// Real Google OAuth Authentication Endpoint
export async function googleAuth(req: Request, res: Response): Promise<void> {
  const { credential, mode = 'signin' } = req.body;

  if (!credential) {
    res.status(400).json({ success: false, message: 'Google credential (ID token) is required.' });
    return;
  }

  try {
    let payload: { sub: string; email?: string; name?: string; picture?: string } | null = null;

    if (ENV.GOOGLE_CLIENT_ID) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: ENV.GOOGLE_CLIENT_ID,
        });
        const ticketPayload = ticket.getPayload();
        if (ticketPayload) {
          payload = {
            sub: ticketPayload.sub,
            email: ticketPayload.email,
            name: ticketPayload.name,
            picture: ticketPayload.picture,
          };
        }
      } catch (clientErr) {
        console.warn('OAuth2Client verification note, trying tokeninfo:', (clientErr as Error).message);
      }
    }

    if (!payload) {
      // Official Google token verification via Google's OAuth2 tokeninfo endpoint
      const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
      const response = await fetch(tokenInfoUrl);

      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as { error_description?: string };
        res.status(401).json({
          success: false,
          message: errData.error_description || 'Invalid or expired Google credential token.',
        });
        return;
      }

      payload = (await response.json()) as {
        sub: string;
        email: string;
        name?: string;
        picture?: string;
      };
    }

    if (!payload.email) {
      res.status(400).json({ success: false, message: 'Google account does not have a verified email address.' });
      return;
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];
    const avatar = payload.picture || '';
    const googleId = payload.sub;

    // Check if user already exists by email or googleId
    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      // If user attempted to sign in without having registered first
      if (mode === 'signin') {
        res.status(404).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'No account found with this Google email. Please click "Create Account" first to register.',
        });
        return;
      }

      // Create new Google-authenticated user
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        authProvider: 'google',
        monthlyIncome: 35000,
        currency: 'INR',
        tier: 'free',
      });
      console.log(`👤 New user account created via Google Sign-Up: ${email}`);
    } else {
      // Update Google profile details if needed
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        modified = true;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    const token = signToken(user._id.toString());

    // Asynchronously dispatch Google OAuth login security alert
    sendLoginAlert({
      email: user.email,
      name: user.name,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      authProvider: 'google',
    }).catch(err => console.error('Google sign-in email alert error:', err));

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        currency: user.currency,
        tier: user.tier,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (err: unknown) {
    console.error('Google OAuth verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify Google login with Google authentication servers.',
    });
  }
}

// Public Auth Configuration (e.g. Google Client ID)
export async function getAuthConfig(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: {
      googleClientId: ENV.GOOGLE_CLIENT_ID || '',
      hasGoogleAuth: true,
    },
  });
}
