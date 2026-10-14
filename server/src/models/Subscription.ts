import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  planId: 'tizori_pro_monthly' | 'tizori_pro_annual';
  amount: number;
  currency: string;
  gateway: 'stripe' | 'sandbox';
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: {
      type: String,
      enum: ['tizori_pro_monthly', 'tizori_pro_annual'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
    gateway: { type: String, enum: ['stripe', 'sandbox'], default: 'sandbox' },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    status: {
      type: String,
      enum: ['active', 'pending', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, required: true },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
