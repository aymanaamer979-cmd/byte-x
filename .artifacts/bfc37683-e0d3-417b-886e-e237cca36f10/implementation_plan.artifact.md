# خطة الإصلاح الشامل لمنع انهيار السيرفر (Stability & Crash Prevention)

نهدف من خلال هذه الخطة إلى إنهاء أخطاء الـ 500 المتكررة وجعل السيرفر "يتحدث" بدلاً من الانهيار الصامت. سنقوم بتأمين كافة نقاط الضعف التي قد تسبب "سكتة قلبية" للنظام أثناء التشغيل على Vercel.

## User Review Required

> [!IMPORTANT]
> **إظهار الأخطاء الحقيقية**: سنقوم بتفعيل وضع "كاشف الأخطاء". إذا حدث أي فشل في الاتصال بـ MongoDB أو Firebase، لن يظهر لك خطأ 500 مبهم، بل ستظهر رسالة JSON تشرح المشكلة باللغة الإنجليزية (مثلاً: "Authentication failed" أو "DB Connection Timeout").
>
> **تنبيه هام**: سنقوم بتعطيل فحص التوكن (Auth Middleware) بشكل مؤقت في مسار حفظ الهاتف لنقوم بتجربة "الربط مع MongoDB" بشكل مستقل، وبمجرد نجاحه سنعيده للعمل.

## Proposed Changes

### 1. تأمين تهيئة الخدمات (Defensive Initialization)

#### [MODIFY] [backend/config/firebase.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/config/firebase.ts)
- تعديل الكود ليعمل بنظام "المحاولة والخطأ" (Try-Catch). إذا فشل فيرباس في التشغيل، لن ينهار السيرفر بالكامل، بل سيكمل العمل مع تسجيل الخطأ.

#### [MODIFY] [backend/config/db.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/config/db.ts)
- ضمان استقرار الاتصال بـ MongoDB Atlas واستخدام الرابط المباشر الذي زودتني به لضمان النجاح.

### 2. نظام التوجيه الموثوق (Reliable Routing)

#### [MODIFY] [api/index.ts](file:///C:/Users/alfaa/Desktop/getProject/api/index.ts)
- إضافة "حارس الأخطاء العالمي" (Global Error Handler) الذي سيمسك أي انهيار ويرسله للمتصفح كمعلومات مفيدة بدلاً من رسالة Vercel الافتراضية.

#### [MODIFY] [vercel.json](file:///C:/Users/alfaa/Desktop/getProject/vercel.json)
- ضبط دقيق جداً للمسارات لضمان أن Vercel يوجه طلبات `/api/` للسيرفر وطلبات الصفحات لـ React بدون أي تداخل.

### 3. إصلاح مسار حفظ الهاتف (Fix Phone Save)

#### [MODIFY] [backend/controllers/userController.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/controllers/userController.ts)
- جعل الدالة أكثر "صموداً"؛ بحيث تتأكد من وجود البيانات قبل محاولة حفظها، وتطبع رسالة نجاح أو فشل واضحة.

---

## Verification Plan

### Manual Verification
1.  **اختبار رابط الحياة**: فتح `/api/ping` (سأقوم بإنشائه) للتأكد من أن السيرفر يعمل.
2.  **اختبار الربط**: فتح `/api/db-status`.
3.  **تجربة حفظ الهاتف**: تسجيل الدخول وتجربة حفظ الرقم ومراقبة الرسالة التي ستظهر في الكونسول (لن تكون 500 صماء هذه المرة).
