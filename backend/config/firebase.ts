// @ts-nocheck
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountVar && serviceAccountVar.trim().length > 10) {
      let serviceAccount;
      try {
        const cleanJson = serviceAccountVar.trim().replace(/^['"]|['"]$/g, '');
        serviceAccount = JSON.parse(cleanJson);

        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log("🔥 Firebase Admin initialized via Environment Variable");
      } catch (e) {
        console.error("❌ CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", e.message);
        // لا ننهي البرنامج هنا، لكي يعمل مسار التشخيص
      }
    } else {
      console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT is missing or too short. Trying Default Credentials...");
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault()
        });
      } catch (e) {
        console.error("❌ Firebase Admin: No credentials available.");
      }
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error.message);
  }
}

export const authAdmin = admin.auth();
export default admin;
