import { Request, Response } from 'express';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { ChatMessage } from '../models/ChatMessage';
import { currencySetter } from '../config/db';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { uid, displayName, phone } = req.body;
    if (!uid) return res.status(400).json({ error: "Missing required parameter: uid" });

    const updateData: any = { updatedAt: new Date() };
    if (displayName !== undefined) updateData.displayName = displayName;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await User.findOneAndUpdate({ uid }, { $set: updateData }, { new: true });
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({ success: true, message: "تم تحديث الملف الشخصي بنجاح", user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: "Update profile error", details: error.message });
  }
};

export const updatePresence = async (req: Request, res: Response) => {
  try {
    const { uid, isOnline } = req.body;
    if (!uid) return res.status(400).json({ error: "Missing required parameter: uid" });

    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { $set: { isOnline: Boolean(isOnline), lastSeen: new Date(), updatedAt: new Date() } },
      { new: true }
    );
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: "Update presence error", details: error.message });
  }
};

export const deposit = async (req: Request, res: Response) => {
  try {
    const { uid, amount, description } = req.body;
    if (!uid || !amount || Number(amount) <= 0) return res.status(400).json({ error: "Invalid parameters" });

    const cleanAmount = currencySetter(Number(amount));
    const tx = new Transaction({
      userId: uid,
      amount: cleanAmount,
      type: 'deposit',
      status: 'pending',
      description: description || 'طلب إيداع',
      createdAt: new Date()
    });
    await tx.save();
    res.json({ success: true, transaction: tx });
  } catch (error: any) {
    res.status(500).json({ error: "Deposit error", details: error.message });
  }
};

export const withdraw = async (req: Request, res: Response) => {
  try {
    const { uid, amount, description } = req.body;
    if (!uid || !amount || Number(amount) <= 0) return res.status(400).json({ error: "Invalid parameters" });

    const cleanAmount = currencySetter(Number(amount));
    const user = await User.findOne({ uid });
    if (!user || user.balance < cleanAmount) return res.status(400).json({ error: "Insufficient balance" });

    user.balance = currencySetter(user.balance - cleanAmount);
    await user.save();

    const tx = new Transaction({
      userId: uid,
      amount: cleanAmount,
      type: 'withdraw',
      status: 'pending',
      description: description || 'طلب سحب',
      createdAt: new Date()
    });
    await tx.save();
    res.json({ success: true, balance: user.balance, transaction: tx });
  } catch (error: any) {
    res.status(500).json({ error: "Withdraw error", details: error.message });
  }
};

export const invest = async (req: Request, res: Response) => {
  try {
    const { uid, amount } = req.body;
    const cleanAmount = currencySetter(Number(amount));
    const user = await User.findOne({ uid });
    if (!user || user.balance < cleanAmount) return res.status(400).json({ error: "Insufficient balance" });

    user.balance = currencySetter(user.balance - cleanAmount);
    user.investments = currencySetter(user.investments + cleanAmount);
    await user.save();

    const tx = new Transaction({
      userId: uid,
      amount: cleanAmount,
      type: 'investment',
      status: 'completed',
      description: 'استثمار جديد',
      createdAt: new Date()
    });
    await tx.save();
    res.json({ success: true, user, transaction: tx });
  } catch (error: any) {
    res.status(500).json({ error: "Investment error", details: error.message });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const transactions = await Transaction.find({ userId: uid }).sort({ createdAt: -1 }).limit(100);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: "Error fetching transactions", details: error.message });
  }
};

export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const messages = await ChatMessage.find({ userId: uid }).sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: "Error fetching chat messages", details: error.message });
  }
};

export const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const { userId, senderId, senderName, text, isAdmin } = req.body;
    const msg = new ChatMessage({
      userId,
      senderId: senderId || userId,
      senderName: senderName || 'User',
      text,
      isAdmin: Boolean(isAdmin),
      createdAt: new Date()
    });
    await msg.save();
    res.json(msg);
  } catch (error: any) {
    res.status(500).json({ error: "Error sending message", details: error.message });
  }
};
