// @ts-nocheck
import * as admin from 'firebase-admin';

let authAdmin = null;

const initializeFirebase = () => {
  try {
    if (admin.apps.length > 0) {
      authAdmin = admin.auth();
      return;
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
      console.log("🔥 Firebase Admin Initialized");
      authAdmin = admin.auth();
    }
  } catch (error) {
    console.error("❌ Firebase Init Error:", error.message);
  }
};

initializeFirebase();

export { authAdmin };
export default admin;
