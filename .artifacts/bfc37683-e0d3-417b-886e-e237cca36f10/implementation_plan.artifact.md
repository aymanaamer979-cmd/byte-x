# خطة توحيد مسارات القراءة والكتابة في قاعدة البيانات (Service Layer)

تهدف هذه الخطة إلى مركزية كافة عمليات الوصول لقاعدة البيانات (MongoDB) في طبقة "خدمات" (Services) مستقلة. هذا يضمن أن أي عملية (مثل تحديث الرصيد) تتم بنفس الطريقة والتحقق سواء قام بها المستخدم أو الأدمن.

## User Review Required

> [!IMPORTANT]
> **مركزية منطق العمليات المالية**: سنقوم بإنشاء دوال موحدة لتعديل الأرصدة. أي تعديل في الرصيد سيقوم آلياً بإنشاء سجل في جدول المعاملات (`Transactions`) لضمان الشفافية وقابلية التتبع.
>
> **تنبيه**: هذه التغييرات داخلية في الباك اند ولن تغير المسارات (URLs) التي يستخدمها الفرونت اند حالياً، لضمان عدم تعطل التطبيق.

## Proposed Changes

### 1. إنشاء طبقة الخدمات (Services)

سنقوم بإنشاء المجلد `backend/services` ونقل منطق Mongoose إليه:

#### [NEW] [userService.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/services/userService.ts)
- `getUserByUid(uid: string)`: جلب بيانات المستخدم مع ضمان تنسيق الأرقام.
- `updateProfile(uid: string, data: any)`: تحديث البيانات الشخصية (الاسم، الهاتف).
- `updateBalance(uid: string, amount: number, type: string, description: string)`: الدالة الأهم؛ تقوم بتحديث الرصيد وإنشاء سجل معاملة في خطوة واحدة (Atomic operation if possible).

#### [NEW] [transactionService.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/services/transactionService.ts)
- `createTransaction(data: any)`: إنشاء سجل معاملة جديد.
- `updateTransactionStatus(id: string, status: string, adminNote: string)`: تحديث حالة المعاملة وتعديل رصيد المستخدم المرتبط بها آلياً.

### 2. إعادة هيكلة الـ Controllers

تحديث `userController.ts` و `adminController.ts` لاستخدام هذه الخدمات بدلاً من مناداة `User` أو `Transaction` مباشرة.

- **الفائدة**: إذا قررنا مستقبلاً تغيير طريقة حساب الأرباح، سنغيرها في مكان واحد فقط (`userService`) بدلاً من البحث في كل الملفات.

### 3. توحيد الردود (API Responses)

ضمان أن جميع الـ APIs تعيد البيانات بنفس التنسيق (JSON structure) لتسهيل العمل على الفرونت اند.

---

## Verification Plan

### Automated Tests
- اختبار تحديث الرصيد من جهة المستخدم (سحب/إيداع) والتأكد من ظهورها في لوحة الأدمن بنفس اللحظة.
- اختبار تعديل الأدمن لرصيد مستخدم والتأكد من نشوء سجل معاملة تلقائي.

### Manual Verification
- مراقبة سجلات MongoDB Atlas للتأكد من عدم وجود بيانات مكررة أو مسارات مختلفة للكتابة.
