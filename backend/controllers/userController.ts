// @ts-nocheck
import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { transactionService } from '../services/transactionService';
import { ChatMessage } from '../models/ChatMessage';

export const getProfile = async (req: any, res: any) => {
  try {
    const { uid } = req.params;
    const user = await userService.getUserByUid(uid);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const updateProfile = async (req: any, res: any) => {
  try {
    const { uid, displayName, phone } = req.body;
    const updatedUser = await userService.updateProfile(uid, { displayName, phone });
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, message: "تم تحديث الملف الشخصي بنجاح", user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: "Update profile error", details: error.message });
  }
};

export const updatePresence = async (req: any, res: any) => {
  try {
    const { uid, isOnline } = req.body;
    const updatedUser = await userService.updatePresence(uid, Boolean(isOnline));
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: "Update presence error", details: error.message });
  }
};

export const deposit = async (req: any, res: any) => {
  try {
    const { uid, amount, description } = req.body;
    const result = await userService.updateFinancials(uid, {
      amount,
      type: 'deposit',
      status: 'pending',
      description: description || 'طلب إيداع'
    });
    res.json({ success: true, transaction: result.transaction });
  } catch (error: any) {
    res.status(500).json({ error: "Deposit error", details: error.message });
  }
};

export const withdraw = async (req: any, res: any) => {
  try {
    const { uid, amount, description } = req.body;
    const user = await userService.getUserByUid(uid);
    if (!user || user.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

    const result = await userService.updateFinancials(uid, {
      amount,
      type: 'withdraw',
      status: 'pending',
      description: description || 'طلب سحب'
    });
    res.json({ success: true, transaction: result.transaction });
  } catch (error: any) {
    res.status(500).json({ error: "Withdraw error", details: error.message });
  }
};

export const invest = async (req: any, res: any) => {
  try {
    const { uid, amount } = req.body;
    const user = await userService.getUserByUid(uid);
    if (!user || user.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

    const result = await userService.updateFinancials(uid, {
      amount,
      type: 'investment',
      status: 'completed',
      description: 'دخول في باقة استثمارية'
    });
    res.json({ success: true, user: result.user, transaction: result.transaction });
  } catch (error: any) {
    res.status(500).json({ error: "Investment error", details: error.message });
  }
};

export const getTransactions = async (req: any, res: any) => {
  try {
    const { uid } = req.params;
    const transactions = await transactionService.getUserTransactions(uid);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: "Error fetching transactions", details: error.message });
  }
};

export const getChatMessages = async (req: any, res: any) => {
  try {
    const { uid } = req.params;
    const messages = await ChatMessage.find({ userId: uid }).sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: "Error fetching chat messages", details: error.message });
  }
};

export const sendChatMessage = async (req: any, res: any) => {
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
