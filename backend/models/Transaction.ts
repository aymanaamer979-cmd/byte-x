import mongoose from 'mongoose';
import { currencySetter } from '../config/db';

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, set: currencySetter },
  type: { type: String, enum: ['deposit', 'withdraw', 'reward', 'investment', 'profit'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'reviewing', 'suspended'], default: 'pending', index: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, index: true }
});

TransactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
