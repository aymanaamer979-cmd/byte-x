// @ts-nocheck
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountVar) {
      let serviceAccount;
      try {
        // تنظيف متغير البيئة من أي مسافات زائدة أو علامات اقتباس خارجية قد تضيفها بعض المنصات
        const cleanJson = serviceAccountVar.trim().replace(/^['"]|['"]$/g, '');
        serviceAccount = JSON.parse(cleanJson);

        // إصلاح مشكلة رموز سطر جديد في المفتاح الخاص
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
      } catch (e) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON. Error:", e);
        console.error("Raw value starts with:", serviceAccountVar.substring(0, 50));
        throw e;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("🔥 Firebase Admin initialized via Environment Variable");
    } else {
      // محاولة استخدام الاعتمادات التلقائية إذا لم يوجد متغير البيئة
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log("🔥 Firebase Admin initialized via Application Default Credentials");
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error);
  }
}

export const authAdmin = admin.auth();
export default admin;
