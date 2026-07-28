import { Router } from 'express';
import { User } from '../models/User';
import { connectToDatabase } from '../config/db';

const router = Router();

router.get('/config-check', async (req, res) => {
  const hasMongo = !!process.env.MONGODB_URI;
  const hasFirebase = !!process.env.FIREBASE_SERVICE_ACCOUNT;

  let firebaseValid = false;
  if (hasFirebase) {
    try {
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
      firebaseValid = true;
    } catch (e) {
      firebaseValid = false;
    }
  }

  let dbStatus = "Unknown";
  let userCount = 0;
  try {
    await connectToDatabase();
    dbStatus = "✅ Connected to Atlas";
    userCount = await User.countDocuments();
  } catch (err: any) {
    dbStatus = `❌ Error: ${err.message}`;
  }

  res.json({
    env: {
      MONGODB_URI: hasMongo ? "✅ Configured" : "❌ Missing",
      FIREBASE_SERVICE_ACCOUNT: hasFirebase ? (firebaseValid ? "✅ Valid JSON" : "⚠️ Invalid JSON Format") : "❌ Missing"
    },
    database: {
      status: dbStatus,
      usersInDb: userCount
    },
    version: "2.1-Diagnostic-Build"
  });
});

export default router;
