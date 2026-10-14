import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVault extends Document {
  userId: Types.ObjectId;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate: Date;
  lockUntilDate?: Date;
  isLocked: boolean;
  color: string;
  icon: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaultSchema = new Schema<IVault>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, required: true, default: 0, min: 0 },
    category: { type: String, default: 'Savings Goal' },
    targetDate: { type: Date, required: true },
    lockUntilDate: { type: Date },
    isLocked: { type: Boolean, default: false },
    color: { type: String, default: '#F59E0B' }, // gold/amber vault accent
    icon: { type: String, default: 'Vault' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

VaultSchema.index({ userId: 1, targetDate: 1 });

export const Vault = mongoose.model<IVault>('Vault', VaultSchema);
