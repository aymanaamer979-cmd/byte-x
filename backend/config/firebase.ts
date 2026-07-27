import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountVar) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountVar);
        // إصلاح مشكلة رموز سطر جديد في المفتاح الخاص عند استخدامه كمتغير بيئة
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
      } catch (e) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", e);
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
