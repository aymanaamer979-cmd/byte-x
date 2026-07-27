import { Request, Response } from 'express';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { currencySetter } from '../config/db';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: "Admin get users error", details: error.message });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const result = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalances: { $sum: "$balance" },
          totalInvestments: { $sum: "$investments" },
          totalProfits: { $sum: "$profits" }
        }
      }
    ]);
    const stats = result[0] || { totalBalances: 0, totalInvestments: 0, totalProfits: 0 };
    res.json({
      totalUsers,
      totalBalances: currencySetter(stats.totalBalances),
      totalInvestments: currencySetter(stats.totalInvestments),
      totalProfits: currencySetter(stats.totalProfits),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: "Admin stats error", details: error.message });
  }
};

export const updateFinancials = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { balance, investments, profits, depositBonus, depositBonusDate, isVerified, role } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (balance !== undefined) updateData.balance = currencySetter(Number(balance));
    if (investments !== undefined) updateData.investments = currencySetter(Number(investments));
    if (profits !== undefined) updateData.profits = currencySetter(Number(profits));
    if (depositBonus !== undefined) updateData.depositBonus = currencySetter(Number(depositBonus));
    if (depositBonusDate !== undefined) updateData.depositBonusDate = depositBonusDate ? new Date(depositBonusDate) : null;
    if (isVerified !== undefined) updateData.isVerified = Boolean(isVerified);
    if (role !== undefined) updateData.role = role;

    const updatedUser = await User.findOneAndUpdate({ uid }, { $set: updateData }, { new: true });
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: "Admin update financials error", details: error.message });
  }
};

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const txs = await Transaction.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(txs);
  } catch (error: any) {
    res.status(500).json({ error: "Admin get transactions error", details: error.message });
  }
};

export const updateTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const tx = await Transaction.findById(id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    const oldStatus = tx.status;
    tx.status = status;
    if (adminNote) tx.description = `${tx.description} [${adminNote}]`;
    await tx.save();

    if (oldStatus !== 'completed' && status === 'completed' && tx.type === 'deposit') {
      await User.findOneAndUpdate({ uid: tx.userId }, { $inc: { balance: tx.amount } });
    } else if (oldStatus === 'pending' && ['failed', 'suspended'].includes(status) && tx.type === 'withdraw') {
      await User.findOneAndUpdate({ uid: tx.userId }, { $inc: { balance: tx.amount } });
    }

    res.json({ success: true, transaction: tx });
  } catch (error: any) {
    res.status(500).json({ error: "Admin update tx status error", details: error.message });
  }
};
