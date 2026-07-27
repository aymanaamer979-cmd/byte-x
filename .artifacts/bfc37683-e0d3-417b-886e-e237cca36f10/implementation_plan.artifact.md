# خطة تطوير وتحسين الباك اند وتوحيد المسارات

مشروع "Byte X" هو منصة استثمارية تعتمد على React في الفرونت اند و Node.js/Express في الباك اند، مع استخدام Firebase للمصادقة و MongoDB Atlas لقاعدة البيانات. تهدف هذه الخطة إلى تنظيم الكود، تعزيز الأمان، وتوحيد المسارات لضمان سهولة التوسع والتشغيل المستقر على Vercel.

## User Review Required

> [!IMPORTANT]
> **تغيير هيكلية المشروع**: سنقوم بنقل منطق الباك اند من ملف `server.ts` الوحيد إلى مجلدات منظمة (`models`, `routes`, `controllers`). هذا سيجعل الكود أكثر وضوحاً وسهولة في الصيانة.
>
> **تأمين المصادقة**: سنحتاج لإضافة `firebase-admin` في الباك اند للتحقق من التوكن (Token) المرسل من الفرونت اند، بدلاً من الاعتماد على الـ `uid` المرسل مباشرة.

## Proposed Changes

### 1. تنظيم هيكلية الباك اند (Backend Restructuring)

سنقوم بإنشاء مجلد `api` (متوافق مع Vercel) أو مجلد `backend` وتعديل `server.ts` ليكون مجرد نقطة دخول.

- **Models**: نقل تعريفات `User`, `Transaction`, `ChatMessage` إلى ملفات مستقلة في مجلد `models`.
- **Routes**: فصل مسارات المستخدم (`userRoutes`), الإدارة (`adminRoutes`), والمصادقة (`authRoutes`).
- **Controllers**: وضع المنطق البرمجي لكل مسار في ملفات منفصلة.

### 2. توحيد الاتصال بقاعدة البيانات (Database Unification)

- إنشاء ملف `config/db.ts` لإدارة الاتصال بـ MongoDB Atlas بشكل مركزي، مع تحسين آلية الـ Caching لضمان عدم استهلاك موارد Vercel Serverless Functions.
- توحيد مسمى قاعدة البيانات (Target Database) في كل المسارات لضمان عدم تشتت البيانات.

### 3. تأمين الربط مع Firebase (Auth Security)

- إعداد `firebase-admin` واستخدام الـ `Service Account`.
- إنشاء Middleware باسم `authMiddleware` للتحقق من هوية المستخدم في كل طلب API.

### 4. تحسين ملف `server.ts`

- تنظيف `server.ts` ليحتوي فقط على إعدادات Express الأساسية والربط مع المسارات (Routes).

---

## Proposed File Structure

```text
/
├── server.ts (Entry Point)
├── backend/
│   ├── config/
│   │   └── db.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Transaction.ts
│   │   └── ChatMessage.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   └── adminController.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   └── adminRoutes.ts
│   └── middleware/
│       └── authMiddleware.ts
```

## Verification Plan

### Automated Tests
- اختبار الاتصال بقاعدة البيانات عبر مسار `/api/db-status`.
- اختبار عملية المزامنة `/api/auth/sync` مع التأكد من إنشاء المستخدم في MongoDB.
- اختبار عمليات السحب والإيداع والتأكد من تحديث الأرصدة بشكل صحيح.

### Manual Verification
- تجربة لوحة الإدارة (Admin Panel) والتأكد من ظهور المستخدمين والعمليات.
- التأكد من أن التوجيه (Routing) يعمل بشكل صحيح بعد تقسيم الملفات.
