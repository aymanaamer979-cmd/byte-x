# خطة التثبيت النهائي وإصلاح انهيار السيرفر (Stability & Version Fix)

الخطأ `FUNCTION_INVOCATION_FAILED` وانهيار السيرفر (500) يرجح وجود مشكلة في نسخة مكتبة `mongoose` المستخدمة أو في كود الربط الأولي. لاحظت أن نسخة `9.8.0` المسجلة في المشروع غير موجودة رسمياً في سجلات Mongoose المستقرة، مما قد يسبب تحميل مكتبة خاطئة أو معطلة.

## User Review Required

> [!CAUTION]
> **تعديل نسخة Mongoose**: سنقوم بتثبيت النسخة المستقرة الرسمية `8.10.0`. هذا سيضمن توافق الكود مع معايير MongoDB Atlas الحالية.
>
> **تبسيط صفحة الفحص**: سنقوم بإلغاء عملية الـ "Ping" مؤقتاً لتجنب أي تأخير قد يجعل فيرسل ينهي الجلسة قبل اكتمال الاتصال.

## Proposed Changes

### 1. تصحيح المكتبات (Dependency Fix)

#### [MODIFY] [package.json](file:///C:/Users/alfaa/Desktop/getProject/package.json)
- تغيير نسخة `mongoose` من `^9.8.0` إلى `8.10.0` (النسخة المستقرة الرسمية).

### 2. تأمين كود البداية (Boot Safety)

#### [MODIFY] [api/index.ts](file:///C:/Users/alfaa/Desktop/getProject/api/index.ts)
- تبسيط مسار `/api/db-status` ليعيد فقط حالة الاتصال الأساسية بدون عمليات Ping معقدة.
- التأكد من عدم وجود أي استدعاءات لمكتبات خارجية في أعلى الملف (Top-level) قد تسبب انهياراً قبل بدء السيرفر.

#### [MODIFY] [backend/config/db.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/config/db.ts)
- إضافة حماية إضافية تمنع السيرفر من الانتظار للأبد عند فشل الاتصال.

---

## Verification Plan

### Automated Tests
- بعد الرفع، اطلب مسار `/api/db-status`.
- إذا أعاد JSON (حتى لو كان فيه error)، فهذا يعني أن السيرفر "استيقظ" ولم ينهار، وسنعرف حينها حالة القاعدة بدقة.

### Manual Verification
- التحقق من صفحة "Functions" في Vercel Dashboard لرؤية أي Runtime Errors جديدة.
