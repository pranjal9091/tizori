import { Router } from 'express';
import express from 'express';
import {
  createCheckoutSession,
  confirmSandboxPayment,
  cancelSubscription,
  getSubscriptionStatus,
  handleStripeWebhook,
  processVaultDepositPayment,
  getGatewayConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public gateway config
router.get('/config', getGatewayConfig);

// Webhook endpoint (must receive raw buffer when configured)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Protected subscription & gateway endpoints
router.get('/status', requireAuth, getSubscriptionStatus);
router.post('/checkout', requireAuth, createCheckoutSession);
router.post('/sandbox/confirm', requireAuth, confirmSandboxPayment);
router.post('/cancel', requireAuth, cancelSubscription);
router.post('/deposit', requireAuth, processVaultDepositPayment);
router.post('/razorpay/order', requireAuth, createRazorpayOrder);
router.post('/razorpay/verify', requireAuth, verifyRazorpayPayment);

export default router;
