// @ts-nocheck
import * as admin from 'firebase-admin';

let authAdmin = null;

export const getAuthAdmin = () => {
  if (authAdmin) return authAdmin;

  try {
    if (admin.apps.length > 0) {
      authAdmin = admin.auth();
      return authAdmin;
    }

    let serviceAccount;
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountVar) {
      let cleanJson = serviceAccountVar.trim();
      if ((cleanJson.startsWith('"') && cleanJson.endsWith('"')) ||
          (cleanJson.startsWith("'") && cleanJson.endsWith("'"))) {
        cleanJson = cleanJson.substring(1, cleanJson.length - 1);
      }

      serviceAccount = JSON.parse(cleanJson);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    } else {
      // Fallback to local file if environment variable is not set (useful for local development)
      try {
        const path = await import('path');
        const fs = await import('fs');
        const localPath = path.join(process.cwd(), 'serviceAccountKey.json');
        if (fs.existsSync(localPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'));
          console.log("📍 Using local serviceAccountKey.json for Firebase Admin");
        }
      } catch (err) {
        console.warn("⚠️ Could not load local serviceAccountKey.json:", err.message);
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("🔥 Firebase Admin Initialized Lazily");
      authAdmin = admin.auth();
      return authAdmin;
    }
  } catch (error) {
    console.error("❌ Firebase Lazy Init Error:", error.message);
  }
  return null;
};

export { authAdmin };
export default admin;
