import { Request, Response, NextFunction } from 'express';
import { authAdmin } from '../config/firebase';
import { connectToDatabase } from '../config/db';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // سنسمح لبعض المسارات بالمرور وسنتحقق داخل الـ Controller إذا كان الـ User مطلوباً
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized', message: 'انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى' });
  }
};

export const ensureDb = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectToDatabase();
    next();
  } catch (error: any) {
    res.status(500).json({ error: "Database Connection Error", message: error.message });
  }
};
