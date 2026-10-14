import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGullak extends Document {
  userId: Types.ObjectId;
  name: string; // e.g. "Goa Trip 🏖️", "iPhone 16 📱", "Mom's Gift 🎁", "Emergency Fund 🛡️"
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  category: string;
  targetDate: Date;
  isCompleted: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GullakSchema = new Schema<IGullak>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 100 },
    currentAmount: { type: Number, required: true, default: 0, min: 0 },
    emoji: { type: String, default: '🐷' },
    category: { type: String, default: 'Trip' },
    targetDate: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

GullakSchema.index({ userId: 1, targetDate: 1 });

export const Gullak = mongoose.model<IGullak>('Gullak', GullakSchema);
