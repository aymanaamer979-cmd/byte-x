import { Router } from 'express';

const router = Router();

router.get('/config-check', (req, res) => {
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

  res.json({
    env: {
      MONGODB_URI: hasMongo ? "✅ Configured" : "❌ Missing",
      FIREBASE_SERVICE_ACCOUNT: hasFirebase ? (firebaseValid ? "✅ Valid JSON" : "⚠️ Invalid JSON Format") : "❌ Missing"
    },
    version: "2.0-Organized-Backend" // لنتأكد أننا نشغل الكود الجديد
  });
});

export default router;
