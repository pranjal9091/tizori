import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBudget extends Document {
  userId: Types.ObjectId;
  category: string;
  monthlyLimit: number;
  periodMonth: number; // 1 - 12
  periodYear: number;
  alertThreshold: number; // e.g. 80 (meaning 80%)
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, trim: true },
    monthlyLimit: { type: Number, required: true, min: 1 },
    periodMonth: { type: Number, required: true, min: 1, max: 12 },
    periodYear: { type: Number, required: true },
    alertThreshold: { type: Number, default: 80, min: 10, max: 100 },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, periodYear: 1, periodMonth: 1, category: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
