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

    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountVar) {
      let cleanJson = serviceAccountVar.trim();
      if ((cleanJson.startsWith('"') && cleanJson.endsWith('"')) ||
          (cleanJson.startsWith("'") && cleanJson.endsWith("'"))) {
        cleanJson = cleanJson.substring(1, cleanJson.length - 1);
      }

      const serviceAccount = JSON.parse(cleanJson);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

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
