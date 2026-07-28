import { Router } from 'express';
import { User } from '../models/User';
import { connectToDatabase } from '../config/db';
import { getAuthAdmin } from '../config/firebase';

const router = Router();

router.get('/config-check', async (req, res) => {
  const hasMongo = !!process.env.MONGODB_URI;
  const hasFirebaseEnv = !!process.env.FIREBASE_SERVICE_ACCOUNT;
  const adminAuth = getAuthAdmin();
  const isFirebaseInitialized = !!adminAuth;

  let dbStatus = "Unknown";
  let userCount = 0;
  let dbError = null;

  try {
    await connectToDatabase();
    dbStatus = "✅ Connected to Atlas";
    userCount = await User.countDocuments();
  } catch (err: any) {
    dbStatus = "❌ Failed";
    dbError = err.message;
  }

  res.json({
    env: {
      MONGODB_URI: hasMongo ? "✅ Present" : "❌ Missing",
      FIREBASE_SERVICE_ACCOUNT_ENV: hasFirebaseEnv ? "✅ Present" : "❌ Missing"
    },
    firebase: {
      status: isFirebaseInitialized ? "✅ Initialized" : "❌ Failed",
      hint: !isFirebaseInitialized ? "Check FIREBASE_SERVICE_ACCOUNT format or serviceAccountKey.json" : "Ready"
    },
    database: {
      status: dbStatus,
      error: dbError,
      usersInDb: userCount
    },
    serverTime: new Date().toISOString(),
    version: "2.2-Diagnostic-Deep"
  });
});

export default router;
