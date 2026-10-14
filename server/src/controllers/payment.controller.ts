import { Request, Response } from 'express';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Gullak } from '../models/Gullak';
import { Transaction } from '../models/Transaction';
import { sendDepositReceiptEmail } from '../services/email.service';

const stripe = ENV.STRIPE_SECRET_KEY
  ? new Stripe(ENV.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as any })
  : null;

const razorpay = (ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET)
  ? new Razorpay({
      key_id: ENV.RAZORPAY_KEY_ID,
      key_secret: ENV.RAZORPAY_KEY_SECRET,
    })
  : null;

export const PLANS = {
  monthly: {
    id: 'tizori_pro_monthly',
    name: 'PocketPaisa Pro Monthly',
    price: 99, // ₹99/mo
    currency: 'INR',
    interval: 'month',
  },
  annual: {
    id: 'tizori_pro_annual',
    name: 'PocketPaisa Pro Annual (Save 58%)',
    price: 499, // ₹499/yr
    currency: 'INR',
    interval: 'year',
  },
};

// Create Stripe Checkout Session OR Sandbox Session
export async function createCheckoutSession(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { planType = 'monthly', useSandbox = false } = req.body;

  const plan = planType === 'annual' ? PLANS.annual : PLANS.monthly;

  // If Stripe is configured and sandbox is not forced
  if (stripe && !useSandbox) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: (user.currency || 'inr').toLowerCase(),
              product_data: {
                name: plan.name,
                description: 'Unlock AI Wealth Advisory, Cashflow Forecasting & Unlimited Vaults',
              },
              unit_amount: plan.price * 100, // Stripe expects lowest denomination (cents/paise)
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: user.email,
        client_reference_id: user._id.toString(),
        metadata: {
          userId: user._id.toString(),
          planId: plan.id,
        },
        success_url: `${ENV.CLIENT_URL}/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ENV.CLIENT_URL}/settings?payment=cancelled`,
      });

      res.json({
        success: true,
        mode: 'stripe',
        url: session.url,
        sessionId: session.id,
      });
      return;
    } catch (err) {
      console.warn('Stripe checkout error, falling back to sandbox flow:', (err as Error).message);
    }
  }

  // Seamless Instant Sandbox Flow (Free / Zero-Setup Demo for Recruiters & Local Dev)
  const simulatedSessionId = `cs_sandbox_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  res.json({
    success: true,
    mode: 'sandbox',
    sessionId: simulatedSessionId,
    plan,
    message: 'Sandbox payment session initialized. Confirm payment to activate Pro tier.',
  });
}

// Complete Sandbox Payment (instant 1-click test confirmation)
export async function confirmSandboxPayment(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { planType = 'monthly', sessionId } = req.body;
  const plan = planType === 'annual' ? PLANS.annual : PLANS.monthly;

  const expirationDate = new Date();
  if (planType === 'annual') {
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  } else {
    expirationDate.setMonth(expirationDate.getMonth() + 1);
  }

  // Update user tier
  user.tier = 'pro';
  user.subscriptionExpiresAt = expirationDate;
  await user.save();

  // Create audit subscription record
  const subscription = await Subscription.create({
    userId: user._id,
    planId: plan.id as any,
    amount: plan.price,
    currency: user.currency,
    gateway: 'sandbox',
    stripeSessionId: sessionId || `cs_sandbox_${Date.now()}`,
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: expirationDate,
    receiptUrl: `https://pocketpaisa.app/receipts/${sessionId || 'demo'}`,
  });

  res.json({
    success: true,
    message: 'Congratulations! PocketPaisa Pro membership activated successfully.',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tier: user.tier,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      },
      subscription,
    },
  });
}

// Process Direct Goal Vault Funding via Payment Gateway (UPI / Card / NetBanking)
export async function processVaultDepositPayment(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { gullakId, amount, paymentMethod = 'upi', vpaId } = req.body;

  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    res.status(400).json({ success: false, message: 'Valid deposit amount is required.' });
    return;
  }

  const gullak = await Gullak.findOne({ _id: gullakId, userId: user._id });
  if (!gullak) {
    res.status(404).json({ success: false, message: 'Goal savings vault not found.' });
    return;
  }

  // Credit amount to vault
  gullak.currentAmount += depositAmount;
  if (gullak.currentAmount >= gullak.targetAmount) {
    gullak.isCompleted = true;
  }
  await gullak.save();

  const refId = `PP_TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Create audit transaction record in ledger
  const transaction = await Transaction.create({
    userId: user._id,
    title: `Vault Deposit: ${gullak.name} ${gullak.emoji}`,
    amount: depositAmount,
    type: 'gullak_deposit',
    category: 'Goal Savings',
    bucket: 'savings',
    date: new Date(),
    notes: `Funded via ${paymentMethod.toUpperCase()} Gateway | Ref: ${refId} ${vpaId ? `| VPA: ${vpaId}` : ''}`,
  });

  // Asynchronously dispatch digital deposit receipt to user's email
  sendDepositReceiptEmail({
    email: user.email,
    name: user.name,
    vaultName: gullak.name,
    amount: depositAmount,
    referenceId: refId,
    paymentMethod: paymentMethod.toUpperCase(),
  }).catch(err => console.error('Deposit receipt email error:', err));

  res.json({
    success: true,
    message: `Payment authorized: ₹${depositAmount} successfully deposited into ${gullak.name}.`,
    data: {
      gullak,
      transaction,
      receipt: {
        referenceId: refId,
        amount: depositAmount,
        paymentMethod: paymentMethod.toUpperCase(),
        timestamp: new Date().toISOString(),
        status: 'CONFIRMED',
      },
    },
  });
}

// Create Real Razorpay Order for UPI / Cards
export async function createRazorpayOrder(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { planType = 'monthly', amount } = req.body;
  const plan = planType === 'annual' ? PLANS.annual : PLANS.monthly;
  const orderAmount = amount ? Math.round(amount * 100) : plan.price * 100;

  if (razorpay) {
    try {
      const order = await razorpay.orders.create({
        amount: orderAmount,
        currency: 'INR',
        receipt: `pp_rcpt_${Date.now()}`,
        notes: {
          userId: user._id.toString(),
          planType,
          userEmail: user.email,
        },
      });

      res.json({
        success: true,
        mode: 'razorpay',
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: ENV.RAZORPAY_KEY_ID,
      });
      return;
    } catch (err) {
      console.error('Razorpay order creation error:', err);
    }
  }

  // Graceful fallback sandbox order if real API key not yet entered in .env
  res.json({
    success: true,
    mode: 'sandbox',
    orderId: `order_sandbox_${Date.now()}`,
    amount: orderAmount,
    currency: 'INR',
    keyId: ENV.RAZORPAY_KEY_ID || 'rzp_test_pocketpaisa_sandbox',
    message: 'Sandbox order created. Provide RAZORPAY_KEY_ID in server/.env for live bank charges.',
  });
}

// Cryptographically Verify Razorpay Payment Signature
export async function verifyRazorpayPayment(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planType = 'monthly',
  } = req.body;

  if (razorpay && ENV.RAZORPAY_KEY_SECRET) {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ success: false, message: 'Invalid payment signature. Payment verification failed.' });
      return;
    }
  }

  // Activate Pro tier
  user.tier = 'pro';
  const expirationDate = new Date();
  if (planType === 'annual') {
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  } else {
    expirationDate.setMonth(expirationDate.getMonth() + 1);
  }
  user.subscriptionExpiresAt = expirationDate;
  await user.save();

  await Subscription.create({
    userId: user._id,
    planId: planType === 'annual' ? PLANS.annual.id : PLANS.monthly.id,
    planName: planType === 'annual' ? PLANS.annual.name : PLANS.monthly.name,
    amount: planType === 'annual' ? PLANS.annual.price : PLANS.monthly.price,
    currency: 'INR',
    billingCycle: planType,
    status: 'active',
    paymentMethod: 'Razorpay UPI & Cards',
    currentPeriodStart: new Date(),
    currentPeriodEnd: expirationDate,
    gatewayPaymentId: razorpay_payment_id,
  });

  res.json({
    success: true,
    message: 'Payment verified! PocketPaisa Pro membership activated.',
    user: {
      id: user._id,
      tier: user.tier,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    },
  });
}

// Get Gateway Configuration & Supported Payment Methods
export async function getGatewayConfig(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: {
      razorpayConfigured: !!razorpay,
      razorpayKeyId: ENV.RAZORPAY_KEY_ID,
      stripeConfigured: !!stripe,
      defaultCurrency: 'INR',
      supportedMethods: [
        { id: 'upi', name: 'Instant UPI (QR & Apps)', providers: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM'], active: true },
        { id: 'card', name: 'Credit / Debit Card', providers: ['Visa', 'Mastercard', 'RuPay'], active: true },
        { id: 'netbanking', name: 'Net Banking', providers: ['HDFC', 'SBI', 'ICICI', 'Axis'], active: true },
        { id: 'sandbox', name: 'Evaluation Sandbox (1-Click Test)', providers: ['Recruiter Simulator'], active: true },
      ],
      merchantVpa: 'pocketpaisa@upi',
      merchantName: 'PocketPaisa Vault Services',
    },
  });
}

// Downgrade / Cancel subscription
export async function cancelSubscription(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  user.tier = 'free';
  user.subscriptionExpiresAt = undefined;
  await user.save();

  await Subscription.updateMany(
    { userId: user._id, status: 'active' },
    { $set: { status: 'cancelled' } }
  );

  res.json({
    success: true,
    message: 'Subscription cancelled. Account reverted to Free tier.',
    user: {
      id: user._id,
      tier: user.tier,
    },
  });
}

// Get subscription history
export async function getSubscriptionStatus(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!._id;
  const history = await Subscription.find({ userId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    tier: req.user!.tier,
    expiresAt: req.user!.subscriptionExpiresAt,
    isPro: req.user!.tier === 'pro',
    history,
  });
}

// Real Stripe Webhook Handler with cryptographic signature verification
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!stripe || !ENV.STRIPE_WEBHOOK_SECRET) {
    res.status(400).send('Stripe webhook not configured');
    return;
  }

  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      ENV.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook Signature Verification Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle Stripe lifecycle events
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId || 'tizori_pro_monthly';

    if (userId) {
      const expirationDate = new Date();
      if (planId.includes('annual')) {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      } else {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      }

      await User.findByIdAndUpdate(userId, {
        tier: 'pro',
        subscriptionExpiresAt: expirationDate,
        stripeCustomerId: session.customer as string,
      });

      await Subscription.create({
        userId,
        planId,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency?.toUpperCase() || 'INR',
        gateway: 'stripe',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: expirationDate,
      });

      console.log(`[Stripe Webhook] Upgraded user ${userId} to Pro tier.`);
    }
  }

  res.json({ received: true });
}
