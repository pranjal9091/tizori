import mongoose, { Schema, Document, Types } from 'mongoose';

export type TransactionType = 'expense' | 'income' | 'gullak_deposit' | 'gullak_withdraw';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  title: string; // e.g. "Chai & Samosa", "Metro Recharge", "Swiggy Pizza"
  amount: number;
  type: TransactionType;
  category: string; // Chai & Food, Travel & Commute, Shopping & Fun, Rent & Bills, Health & Learning, Pocket Money
  bucket: 'needs' | 'wants' | 'savings'; // 50-30-20 Rule tagging
  date: Date;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      enum: ['expense', 'income', 'gullak_deposit', 'gullak_withdraw'],
      required: true,
      default: 'expense',
    },
    category: { type: String, required: true, trim: true, index: true },
    bucket: { type: String, enum: ['needs', 'wants', 'savings'], default: 'wants' },
    date: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1, date: -1 });
TransactionSchema.index({ userId: 1, bucket: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
