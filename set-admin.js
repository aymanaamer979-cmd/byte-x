const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // اسم الملف اللي نزلته

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// حط الـ UID بتاع حسابك هنا (بتجيبه من صفحة Authentication في Firebase)
const targetUid = '2Yi3kkmel5TKJjaPZpT6ugq4aSI3';

admin.auth().setCustomUserClaims(targetUid, { admin: true })
  .then(() => {
    console.log(`Success! User ${targetUid} is now an Admin.`);
    process.exit();
  })
  .catch((error) => {
    console.error('Error setting custom claim:', error);
  });