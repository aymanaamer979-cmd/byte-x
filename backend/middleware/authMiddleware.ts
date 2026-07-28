// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { authAdmin } from '../config/firebase';
import { connectToDatabase } from '../config/db';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error.message);
    res.status(401).json({ error: 'Unauthorized', message: 'انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى' });
  }
};

export const adminOnly = async (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'يرجى تسجيل الدخول أولاً' });
  }

  // 1. التحقق من التوكن (الختم الخفي)
  if (req.user.admin === true) {
    return next();
  }

  // 2. التحقق من قاعدة البيانات (خيار احتياطي)
  try {
    await connectToDatabase();
    const userInDb = await User.findOne({ uid: req.user.uid });
    if (userInDb && userInDb.role === 'admin') {
      console.log(`✅ Admin access granted via DB: ${req.user.email}`);
      return next();
    }
  } catch (err) {
    console.error("❌ Admin Check Error:", err.message);
  }

  console.warn(`🚫 Forbidden access: ${req.user.email}`);
  return res.status(403).json({ error: 'Forbidden', message: 'عذراً، هذه الصلاحية للمدراء فقط' });
};

export const ensureDb = async (req: any, res: any, next: any) => {
  try {
    await connectToDatabase();
    next();
  } catch (error: any) {
    res.status(500).json({ error: "Database Connection Error", message: error.message });
  }
};
