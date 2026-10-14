import mongoose, { Schema, Document, Types } from 'mongoose';

export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash';

export interface IAccount extends Document {
  userId: Types.ObjectId;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  accountNumberMask: string;
  institution: string;
  color: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['checking', 'savings', 'credit_card', 'investment', 'cash'],
    },
    balance: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: 'INR' },
    accountNumberMask: { type: String, default: '••••' },
    institution: { type: String, default: 'Self' },
    color: { type: String, default: '#10B981' },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AccountSchema.index({ userId: 1, type: 1 });

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
