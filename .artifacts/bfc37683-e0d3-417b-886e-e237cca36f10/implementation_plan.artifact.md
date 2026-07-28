# خطة التشخيص النهائي وإصلاح أخطاء الـ 500 (Deep Debugging)

تكرار أخطاء الـ 500 رغم صحة الكود المنطقي يعني وجود "انهيار" (Crash) في السيرفر أثناء التشغيل الأولي، غالباً بسبب متغيرات البيئة أو طريقة قراءتها. هذه الخطة تهدف لجعل السيرفر "يتحدث" ويخبرنا بالسبب الحقيقي للانهيار.

## User Review Required

> [!IMPORTANT]
> **الخطأ 500 المستمر**: سنقوم بتعطيل "الانهيار التلقائي" للسيرفر. بدلاً من أن يتوقف السيرفر عند وجود خطأ في مفتاح فيرباس مثلاً، سيستمر في العمل وسيرد عليك برسالة JSON واضحة بالخطأ.
>
> **تنبيه الكاش**: الكونسول لا يزال يظهر روابط قديمة (بدون `/user/`). هذا يعني أن متصفحك **يجب** أن يتم تنظيفه بالكامل (Clear Site Data) لأن النسخة القديمة من ملفات الجافاسكريبت لا تزال عالقة لديك.

## Proposed Changes

### 1. تأمين الإعدادات ضد الانهيار (Safe Configs)

#### [MODIFY] [backend/config/db.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/config/db.ts)
- إضافة تحقق صارم قبل طباعة الـ Logs لمنع خطأ `undefined.substring`.

#### [MODIFY] [backend/config/firebase.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/config/firebase.ts)
- منع السيرفر من الانهيار إذا كان مفتاح فيرباس خاطئاً، وبدلاً من ذلك تسجيل تحذير في الـ Logs.

### 2. ميزة "كاشف الأخطاء" (Global Error Catcher)

#### [MODIFY] [api/index.ts](file:///C:/Users/alfaa/Desktop/getProject/api/index.ts)
- إضافة Middleware في بداية الملف يمسك أي خطأ (Uncaught Exception) ويرسله فوراً للكونسول كـ JSON. هذا سيحول رسالة "Internal Server Error" المبهمة إلى رسالة تشرح "أين المشكلة بالضبط".

### 3. تحسين نظام التوجيه لـ Vercel

#### [MODIFY] [vercel.json](file:///C:/Users/alfaa/Desktop/getProject/vercel.json)
- ضبط دقيق لمسارات الـ Assets والـ API لضمان وصول كل طلب لوجهته الصحيحة.

---

## Verification Plan

### Automated Tests
- بعد الرفع، اطلب مسار `/api/debug/config-check`.
- إذا ظهرت صفحة JSON تخبرك بوجود خطأ في "FIREBASE_SERVICE_ACCOUNT" أو "MONGODB_URI"، فسنعرف أين الخلل بالضبط.

### Manual Verification
- **خطوة إجبارية**: يرجى فتح المتصفح -> اضغط F12 -> اذهب لتبويب Application -> ثم Storage -> ثم اضغط على **Clear site data**. هذا سيجبر المتصفح على استخدام الكود الجديد.
