import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { currencySetter } from '../config/db';

export const transactionService = {
  async getUserTransactions(uid: string, limit = 100) {
    return await Transaction.find({ userId: uid }).sort({ createdAt: -1 }).limit(limit);
  },

  async getAllTransactions(limit = 200) {
    return await Transaction.find({}).sort({ createdAt: -1 }).limit(limit);
  },

  async updateStatus(id: string, status: string, adminNote?: string) {
    const tx = await Transaction.findById(id);
    if (!tx) throw new Error("Transaction not found");

    const oldStatus = tx.status;
    tx.status = status as any;
    if (adminNote) tx.description = `${tx.description} [${adminNote}]`;
    await tx.save();

    // التعامل مع الأرصدة عند تغيير الحالة إلى "مكتمل" أو "فاشل"
    if (oldStatus !== 'completed' && status === 'completed') {
      if (tx.type === 'deposit') {
        await User.findOneAndUpdate({ uid: tx.userId }, { $inc: { balance: tx.amount } });
      }
    } else if (oldStatus === 'pending' && (status === 'failed' || status === 'suspended')) {
      if (tx.type === 'withdraw') {
        // إعادة المبلغ للرصيد إذا فشل السحب
        await User.findOneAndUpdate({ uid: tx.userId }, { $inc: { balance: tx.amount } });
      }
    }

    return tx;
  }
};
