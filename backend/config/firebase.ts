// @ts-nocheck
import * as admin from 'firebase-admin';

let authAdmin = null;

try {
  if (!admin.apps.length) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountVar && serviceAccountVar.trim().length > 10) {
      try {
        const cleanJson = serviceAccountVar.trim().replace(/^['"]|['"]$/g, '');
        const serviceAccount = JSON.parse(cleanJson);

        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log("🔥 Firebase Admin initialized successfully");
        authAdmin = admin.auth();
      } catch (e) {
        console.error("❌ Firebase Admin JSON Parse Error:", e.message);
      }
    } else {
      console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT env var is empty or missing");
    }
  } else {
    authAdmin = admin.auth();
  }
} catch (error) {
  console.error("❌ Global Firebase Admin Error:", error.message);
}

export { authAdmin };
export default admin;
