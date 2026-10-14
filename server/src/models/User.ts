import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatar?: string;
  authProvider: 'local' | 'google';
  monthlyIncome: number; // Monthly salary or pocket money
  currency: 'INR' | 'USD';
  tier: 'free' | 'pro';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: false },
    googleId: { type: String, sparse: true, index: true },
    avatar: { type: String, default: '' },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    monthlyIncome: { type: Number, default: 45000 },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    tier: { type: String, enum: ['free', 'pro'], default: 'free' },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
