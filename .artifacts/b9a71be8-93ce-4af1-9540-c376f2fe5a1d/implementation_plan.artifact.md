# تحديث بيانات الاتصال بـ MongoDB وتغيير متغير البيئة إلى `MOREX`

سأقوم بتحديث رابط الاتصال بقاعدة البيانات في الكود لاستخدام البيانات الجديدة التي قدمتها، وسأقوم بتعديل الكود ليعتمد على متغير البيئة باسم `MOREX` بدلاً من `MONGODB_URI` ليتوافق مع إعداداتك في Vercel.

## التغييرات المقترحة

### [Backend Configuration]

#### [MODIFY] [db.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/config/db.ts)
*   تغيير `process.env.MONGODB_URI` إلى `process.env.MOREX`.
*   تحديث الرابط الاحتياطي (Fallback) بالرابط الجديد: `mongodb+srv://aymanaamer979_db_user:morex@more.cmgbgda.mongodb.net/?appName=more`.

#### [MODIFY] [debugRoutes.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/routes/debugRoutes.ts)
*   تحديث فحص تشخيص النظام ليتأكد من وجود المتغير `MOREX` بدلاً من `MONGODB_URI`.

### [Documentation & Samples]

#### [MODIFY] [.env.example](file:///C:/Users/alfaa/Desktop/getProject/.env.example)
*   تحديث المثال ليوضح استخدام `MOREX`.

## خطة التحقق

### التحقق اليدوي
*   التأكد من أن الكود يشير إلى `MOREX`.
*   التأكد من أن الرابط الجديد يحتوي على كلمة المرور `morex`.
