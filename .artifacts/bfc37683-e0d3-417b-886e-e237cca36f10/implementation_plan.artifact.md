# خطة إصلاح أخطاء الـ 500 وتوحيد المسارات النهائية

بعد تحليل الكونسول، اكتشفت أن هناك "تضارباً" في أسماء المسارات بين ما يطلبه الفرونت اند وما يوفره الباك اند، بالإضافة إلى وجود دوال مفقودة في المتحكمات الجديدة. هذا التضارب هو ما يسبب أخطاء 500 و 404.

## User Review Required

> [!IMPORTANT]
> **إصلاح المسارات (Path Correction)**: سنقوم بتحديث `api.js` في الفرونت اند ليتطابق تماماً مع هيكلية الباك اند الجديدة المنظمة.
>
> **إضافة الدوال المفقودة**: سنعيد إضافة دالة `updatePhone` ودوال أخرى كانت موجودة في الملف القديم ولم تُنقل للملفات الجديدة.

## Proposed Changes

### 1. تحديث الفرونت اند (Frontend)

#### [MODIFY] [src/lib/api.js](file:///C:/Users/alfaa/Desktop/getProject/src/lib/api.js)
- تصحيح مسار `getChatMessages` ليصبح `/api/user/chat/messages/` بدلاً من `/api/chat/messages/`.
- تصحيح مسار `sendChatMessage` ليصبح `/api/user/chat/send` بدلاً من `/api/chat/send`.

### 2. تحديث الباك اند (Backend)

#### [MODIFY] [backend/controllers/userController.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/controllers/userController.ts)
- إضافة دالة `updatePhone` الرسمية للتعامل مع طلبات تحديث رقم الهاتف بشكل منفصل.

#### [MODIFY] [backend/routes/userRoutes.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/routes/userRoutes.ts)
- إضافة مسار `router.post('/update-phone', userController.updatePhone)`.

#### [MODIFY] [api/index.ts](file:///C:/Users/alfaa/Desktop/getProject/api/index.ts)
- إضافة معالج أخطاء نهائي (Catch-all) يرجع JSON بدلاً من HTML عند حدوث خطأ في المسارات، لسهولة قراءتها في الكونسول.

---

## Verification Plan

### Manual Verification
- تجربة تحديث رقم الهاتف من البروفايل.
- تجربة فتح الشات والتأكد من تحميل الرسائل بدون خطأ 500.
- التحقق من رابط `https://your-domain.com/api/db-status` للتأكد من زوال الـ 404.
