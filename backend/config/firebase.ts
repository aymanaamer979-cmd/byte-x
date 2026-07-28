// @ts-nocheck
import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let authAdmin = null;

try {
  if (!admin.apps.length) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    let serviceAccount = null;

    if (serviceAccountVar && serviceAccountVar.trim().length > 10) {
      try {
        const cleanJson = serviceAccountVar.trim().replace(/^['"]|['"]$/g, '');
        serviceAccount = JSON.parse(cleanJson);
      } catch (e) {
        console.error("❌ Firebase Admin JSON Parse Error from Env:", e.message);
      }
    } else {
      // محاولة التحميل من الملف المحلي إذا لم يتوفر متغير البيئة
      const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(localKeyPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
          console.log("📂 Firebase initialized using local serviceAccountKey.json");
        } catch (e) {
          console.error("❌ Error reading local serviceAccountKey.json:", e.message);
        }
      }
    }

    if (serviceAccount) {
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("🔥 Firebase Admin initialized successfully");
      authAdmin = admin.auth();
    } else {
      console.warn("⚠️ Firebase Admin could not be initialized: No service account credentials found");
    }
  } else {
    authAdmin = admin.auth();
  }
} catch (error) {
  console.error("❌ Global Firebase Admin Error:", error.message);
}

export { authAdmin };
export default admin;
