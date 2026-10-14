import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecurringBill extends Document {
  userId: Types.ObjectId;
  name: string; // e.g. "Spotify Premium", "Netflix 4K", "Gym Membership", "Jio Fiber"
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annual';
  category: string; // Entertainment, Utilities, Fitness, Cloud & Software, Housing
  nextBillingDate: Date;
  status: 'active' | 'paused' | 'cancelled';
  paymentMethod: string; // UPI, Credit Card, Debit Card, Net Banking
  reminderDaysBefore: number; // e.g. 3 days before
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringBillSchema = new Schema<IRecurringBill>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      default: 'monthly',
    },
    category: { type: String, required: true, default: 'Utilities' },
    nextBillingDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled'],
      default: 'active',
      index: true,
    },
    paymentMethod: { type: String, default: 'UPI AutoPay' },
    reminderDaysBefore: { type: Number, default: 3 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

RecurringBillSchema.index({ userId: 1, nextBillingDate: 1 });

export const RecurringBill = mongoose.model<IRecurringBill>('RecurringBill', RecurringBillSchema);
