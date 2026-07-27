import mongoose from 'mongoose';
import { currencySetter } from '../config/db';

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, default: '' },
  email: { type: String, required: true },
  photoURL: { type: String, default: '' },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },

  balance: { type: Number, default: 35, set: currencySetter },
  investments: { type: Number, default: 0, set: currencySetter },
  profits: { type: Number, default: 0, set: currencySetter },
  depositBonus: { type: Number, default: 0, set: currencySetter },

  depositBonusDate: { type: Date, default: null },
  isVerified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
