import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // محاولة البحث عن متغير بيئة يحتوي على JSON الخاص بـ Service Account
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // في حال عدم وجوده، يمكن استخدام الاعتمادات التلقائية للبيئة (مثل Vercel أو Google Cloud)
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }
    console.log("🔥 Firebase Admin initialized");
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error);
  }
}

export const authAdmin = admin.auth();
export default admin;
