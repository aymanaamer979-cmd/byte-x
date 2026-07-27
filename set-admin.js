const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// محاولة جلب الاعتمادات من ملف محلي أو متغير بيئة
let serviceAccount;
const localPath = path.join(__dirname, 'serviceAccountKey.json');

if (fs.existsSync(localPath)) {
  serviceAccount = require(localPath);
  console.log("📍 Using local serviceAccountKey.json");
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    console.log("📍 Using FIREBASE_SERVICE_ACCOUNT environment variable");
  } catch (e) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable");
  }
}

if (!serviceAccount) {
  console.error("❌ No service account credentials found. Please provide serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var.");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// الـ UID المستهدف للترقية
const targetUid = 'fE1IwnCPqjbqwtYEkba07XVmYGe2';

admin.auth().setCustomUserClaims(targetUid, { admin: true })
  .then(() => {
    console.log(`✅ Success! User ${targetUid} is now an Admin (Custom Claims set).`);
    process.exit();
  })
  .catch((error) => {
    console.error('❌ Error setting custom claim:', error);
    process.exit(1);
  });
