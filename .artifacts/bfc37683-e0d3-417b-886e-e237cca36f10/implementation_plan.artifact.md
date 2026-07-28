# خطة توحيد عمليات الكتابة في MongoDB Atlas ومنع تشتت البيانات

بعد التأكد من أن مشروعك يستخدم MongoDB Atlas كقاعدة بيانات أساسية للبيانات المالية، تهدف هذه الخطة إلى ضمان أن جميع عمليات الإيداع، السحب، الأرباح، والمكافآت تتم في "خطوة واحدة" فقط داخل MongoDB، مما يمنع أي فرصة لاستخدام قواعد بيانات أخرى بالخطأ ويضمن دقة السجلات.

## User Review Required

> [!IMPORTANT]
> **تبسيط الواجهة البرمجية (API Simplification)**: حالياً، يقوم الفرونت اند بإرسال طلبين منفصلين (واحد لتحديث الرصيد وآخر لإنشاء السجل). سنقوم بدمجهما في طلب واحد فقط للسيرفر.
>
> **النتيجة**: السيرفر سيتولى "تأمين" العملية؛ فإما أن تنجح العملية بالكامل (تحديث رصيد + إنشاء سجل) أو تفشل بالكامل، وهذا يحمي أموال المستثمرين من الضياع في الحسابات.

## Proposed Changes

### 1. تعزيز خدمات الباك اند (Backend Services)

#### [MODIFY] [adminController.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/controllers/adminController.ts)
- إضافة مسار جديد `/api/admin/user/:uid/adjust-balance` يتعامل مع (الإيداع، السحب، المكافأة، الأرباح) كعملية واحدة.
- استخدام `userService.updateFinancials` لتنفيذ هذه العمليات بشكل موحد.

### 2. توحيد الاستدعاءات في الفرونت اند (Frontend Unification)

#### [MODIFY] [api.js](file:///C:/Users/alfaa/Desktop/getProject/src/lib/api.js)
- إضافة دالة `adminAdjustBalance` التي تخاطب المسار الجديد.

#### [MODIFY] [AdminUserFinancials.jsx](file:///C:/Users/alfaa/Desktop/getProject/src/pages/private/AdminUserFinancials.jsx)
- تحديث دوال `handleAddManualDeposit`, `handleAddManualReward`, `handleAddManualProfit`, `handleAddManualWithdrawal` لتقوم بطلبية واحدة فقط للسيرفر.

### 3. إزالة أي بقايا لاستدعاءات Firebase Database

#### [AUDIT]
- التأكد من عدم استخدام `getDatabase` أو `ref` أو `set` من مكتبة Firebase داخل ملفات الـ Controllers أو الخدمات.

---

## Verification Plan

### Automated Tests
- تجربة إضافة أرباح لمستخدم من لوحة الأدمن.
- التحقق من MongoDB Atlas مباشرة للتأكد من تحديث مستند المستخدم (`User`) ونشوء مستند جديد في (`Transactions`) في نفس اللحظة.

### Manual Verification
- مراقبة كونسول السيرفر للتأكد من ظهور رسالة `🔌 Connected to MongoDB Atlas` عند تنفيذ كل عملية.
