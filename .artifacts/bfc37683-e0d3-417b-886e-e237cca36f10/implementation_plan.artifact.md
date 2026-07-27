# خطة ضبط استدعاءات Firebase Admin وتفعيل الأمان

بناءً على توضيحك، سنقوم بضبط طريقة استدعاء ملف السيرفس (Service Account) ليعمل بسلاسة مع متغير البيئة `FIREBASE_SERVICE_ACCOUNT` الذي أعددته، بالإضافة إلى تحديث سكريبت `set-admin.js` ليكون أكثر مرونة.

## User Review Required

> [!IMPORTANT]
> **ملاحظة حول مفتاح الخصوصية**: مفتاح `private_key` في فيرباس غالباً ما يحتوي على رموز سطر جديد (`\n`). عند وضعه كمتغير بيئة في فيرسل، قد يتم تفسيره بشكل خاطئ. سأقوم بإضافة كود لمعالجة هذا الأمر تلقائياً لضمان نجاح الاتصال.

## Proposed Changes

### 1. تحسين تهيئة الباك اند (Backend Initialization)

#### [MODIFY] [firebase.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/config/firebase.ts)
- تعديل الكود ليقوم بقراءة `FIREBASE_SERVICE_ACCOUNT` من متغيرات البيئة.
- معالجة الـ `private_key` لاستبدال `\\n` بـ `\n` الحقيقية لضمان قبول فيرباس للمفتاح.

### 2. تحديث سكريبت الإدارة (Admin Script)

#### [MODIFY] [set-admin.js](file:///C:/Users/alfaa/Desktop/getProject/set-admin.js)
- جعله يحاول القراءة من ملف `serviceAccountKey.json` محلياً أولاً، وإذا لم يجده يحاول القراءة من متغيرات البيئة. هذا يسمح لك بتشغيله في أي بيئة.

### 3. ربط التوكن في الفرونت اند (Frontend Token Integration)

#### [MODIFY] [api.js](file:///C:/Users/alfaa/Desktop/getProject/src/lib/api.js)
- تحديث جميع استدعاءات الـ API لتجلب التوكن الحالي من Firebase Auth وتضعه في الـ Header كـ `Bearer Token`.

### 4. تفعيل الحماية (Security Activation)

#### [MODIFY] [userRoutes.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/routes/userRoutes.ts)
#### [MODIFY] [adminRoutes.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/routes/adminRoutes.ts)
- ربط الـ `authMiddleware` بشكل فعلي لمنع أي وصول غير مصرح به.

---

## Verification Plan

### Automated Tests
- تشغيل `set-admin.js` والتأكد من نجاحه في الاتصال عبر متغير البيئة.
- اختبار مسار `/api/db-status` للتأكد من أن الباك اند يعمل بدون أخطاء في التهيئة.

### Manual Verification
- تسجيل الدخول من الواجهة والتأكد من أن بيانات المستخدم تظهر (مما يعني نجاح الـ Sync والتوكن).
