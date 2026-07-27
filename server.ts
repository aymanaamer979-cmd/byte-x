// server.ts (النسخة الكاملة 100% بدون أي اختصار - جاهزة للنشر والتشغيل على Vercel و Node.js)
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';

// ============================================================================
// 1. إعدادات اتصال MONGODB ATLAS (مرحلة التجريب والتطوير)
// ============================================================================
// 💡 دالة متطورة لإعادة صياغة رابط الاتصال وضمان توجيهه دائماً إلى قاعدة بيانات 'more'
function formatMongoUri(rawUri: string, targetDb: string = 'more'): string {
  if (!rawUri) return rawUri;
  try {
    let uri = rawUri.trim();

    // 1. معالجة كلمة المرور إذا احتوت على علامة @
    const protoIndex = uri.indexOf('://');
    if (protoIndex !== -1) {
      const protocol = uri.substring(0, protoIndex + 3);
      const remaining = uri.substring(protoIndex + 3);
      const lastAtIndex = remaining.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const credentials = remaining.substring(0, lastAtIndex);
        const rest = remaining.substring(lastAtIndex);
        const firstColonIndex = credentials.indexOf(':');
        if (firstColonIndex !== -1) {
          const user = credentials.substring(0, firstColonIndex);
          const pass = credentials.substring(firstColonIndex + 1);
          if (pass.includes('@') && !pass.includes('%40')) {
            const encodedPass = pass.replace(/@/g, '%40');
            uri = `${protocol}${user}:${encodedPass}${rest}`;
          }
        }
      }
    }

    // 2. فك وفصل الاستعلامات ?
    const queryIndex = uri.indexOf('?');
    let base = queryIndex !== -1 ? uri.substring(0, queryIndex) : uri;
    const query = queryIndex !== -1 ? uri.substring(queryIndex) : '';

    base = base.replace(/\/+$/, ''); // إزالة الشرطات المائلة في النهاية

    const pIdx = base.indexOf('://');
    if (pIdx === -1) return uri;

    const protocolPart = base.substring(0, pIdx + 3);
    const restPart = base.substring(pIdx + 3);

    const firstSlashIndex = restPart.indexOf('/');
    let hostPart = restPart;
    if (firstSlashIndex !== -1) {
      hostPart = restPart.substring(0, firstSlashIndex);
    }

    // إعادة بناء الرابط مستهدفاً قاعدة البيانات 'more' حصرياً
    return `${protocolPart}${hostPart}/${targetDb}${query}`;
  } catch (err) {
    console.error("Error formatting MONGODB_URI:", err);
    return rawUri;
  }
}

const DEFAULT_MONGODB_URI = "mongodb+srv://aymanaamer979_db_user:fahdIMRAN1@more.cmgbgda.mongodb.net/more?retryWrites=true&w=majority&appName=more";
let MONGODB_URI = formatMongoUri(process.env.MONGODB_URI || process.env.DATABASE_URL || DEFAULT_MONGODB_URI, 'more');

// التخزين المؤقت للاتصال لبيئات Vercel Serverless
let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}
let lastDbError: any = null;

async function connectToDatabase() {
  const currentRawUri = process.env.MONGODB_URI || process.env.DATABASE_URL || DEFAULT_MONGODB_URI;
  const targetUri = formatMongoUri(currentRawUri, 'more');

  if (cached.conn && mongoose.connection.readyState === 1) {
    const currentDb = mongoose.connection.db?.databaseName;
    if (currentDb === 'more') {
      return cached.conn;
    } else if (currentDb) {
      console.warn(`⚠️ Connection is active on db '${currentDb}' instead of 'more'. Reconnecting to 'more'...`);
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      dbName: 'more', // التأكيد القاطع على استخدام قاعدة البيانات 'more'
    };
    cached.promise = mongoose.connect(targetUri, opts).then((mongooseInstance) => {
      lastDbError = null;
      const connectedDb = mongoose.connection.db?.databaseName || 'more';
      console.log(`🔌 Connected to MongoDB Atlas successfully on database: ${connectedDb}`);
      return mongooseInstance;
    }).catch((error) => {
      cached.promise = null;
      console.error("❌ Failed to connect to MongoDB Atlas:", error);
      lastDbError = error;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e: any) {
    cached.promise = null;
    lastDbError = e;
    return null;
  }
}

const ensureDb = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conn = await connectToDatabase();
    if (!conn || mongoose.connection.readyState !== 1) {
      const errMsg = lastDbError ? (lastDbError.message || String(lastDbError)) : "Unknown Connection Error";
      res.status(500).json({
        error: "Database Configuration Error",
        message: `فشل الاتصال بقاعدة MongoDB Atlas: ${errMsg}. تأكد من إضافة 0.0.0.0/0 في Network Access داخل حسابك في Atlas.`
      });
      return;
    }
    next();
  } catch (err: any) {
    res.status(500).json({ error: "Database Connection Error", message: err.message });
    return;
  }
};

// ============================================================================
// 2. المخططات بعد تظبيط الأنواع (Schemas with Precise Currency & Date Types)
// ============================================================================

// دالة لتنظيف وتقريب الأرقام المالية لـ خانتين عشريتين (تمنع أخطاء الجافاسكريبت 0.3000000004)
const currencySetter = (val: number) => Math.round((Number(val) || 0) * 100) / 100;

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, default: '' },
  email: { type: String, required: true },
  photoURL: { type: String, default: '' },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  
  // 🎯 تظبيط أنواع الرصيد والأرباح مع setter لضمان الدقة المالية
  balance: { type: Number, default: 35, set: currencySetter },
  investments: { type: Number, default: 0, set: currencySetter },
  profits: { type: Number, default: 0, set: currencySetter },
  depositBonus: { type: Number, default: 0, set: currencySetter },
  
  // 🎯 تحويل التواريخ إلى Date قياسي (يُفرز سريعاً ويُرسل للفرونت كـ ISO String)
  depositBonusDate: { type: Date, default: null },
  isVerified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, set: currencySetter }, // دقة مالية 100%
  type: { type: String, enum: ['deposit', 'withdraw', 'reward', 'investment', 'profit'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'reviewing', 'suspended'], default: 'pending', index: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, index: true } // Date قياسي للترتيب
});

// فهرس مركب لسجل المعاملات السريع
TransactionSchema.index({ userId: 1, createdAt: -1 });

const ChatMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true }
});

const getUserModel = () => {
  const db = mongoose.connection.useDb('more', { useCache: true });
  return db.models.User || db.model('User', UserSchema);
};

const getTransactionModel = () => {
  const db = mongoose.connection.useDb('more', { useCache: true });
  return db.models.Transaction || db.model('Transaction', TransactionSchema);
};

const getChatMessageModel = () => {
  const db = mongoose.connection.useDb('more', { useCache: true });
  return db.models.ChatMessage || db.model('ChatMessage', ChatMessageSchema);
};

const User: any = new Proxy(function() {}, {
  construct(target, args) {
    const Model = getUserModel();
    return new (Model as any)(...args);
  },
  get(target, prop) {
    const Model = getUserModel();
    const val = (Model as any)[prop];
    if (typeof val === 'function') {
      return val.bind(Model);
    }
    return val;
  }
});

const Transaction: any = new Proxy(function() {}, {
  construct(target, args) {
    const Model = getTransactionModel();
    return new (Model as any)(...args);
  },
  get(target, prop) {
    const Model = getTransactionModel();
    const val = (Model as any)[prop];
    if (typeof val === 'function') {
      return val.bind(Model);
    }
    return val;
  }
});

const ChatMessage: any = new Proxy(function() {}, {
  construct(target, args) {
    const Model = getChatMessageModel();
    return new (Model as any)(...args);
  },
  get(target, prop) {
    const Model = getChatMessageModel();
    const val = (Model as any)[prop];
    if (typeof val === 'function') {
      return val.bind(Model);
    }
    return val;
  }
});

// ============================================================================
// 3. EXPRESS APPLICATION SETUP & ENDPOINTS
// ============================================================================
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 1️⃣ فحص الاتصال السريع بقاعدة البيانات
app.get('/api/db-status', async (req: Request, res: Response) => {
  const conn = await connectToDatabase();
  if (conn && mongoose.connection.readyState === 1) {
    const activeDbName = mongoose.connection.db?.databaseName || 'more';
    res.json({ status: "connected", database: `MongoDB Atlas (${activeDbName})`, dbName: activeDbName });
  } else {
    res.status(500).json({ status: "disconnected", error: lastDbError?.message || "Unknown error" });
  }
});

// 2️⃣ مزامنة المستخدم عند الدخول (تنشئ الحساب وتعطي مكافأة 35 دولار)
app.post('/api/auth/sync', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    if (!uid || !email) {
      res.status(400).json({ error: "Missing required parameters: uid and email" });
      return;
    }
    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || '',
        balance: 35, // مكافأة التسجيل الترحيبية
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await user.save();

      const initialReward = new Transaction({
        userId: uid,
        amount: 35,
        type: 'reward',
        status: 'completed',
        description: 'هدية ترحيبية عند التسجيل في المنصة',
        createdAt: new Date()
      });
      await initialReward.save();
    }
    res.json(user);
  } catch (error: any) {
    console.error("Error in auth sync:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// 3️⃣ جلب بروفايل المستخدم الحالي
app.get('/api/user/profile/:uid', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// تحديث رقم هاتف المستخدم
app.post('/api/user/update-phone', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid, phone } = req.body;
    if (!uid || !phone) {
      res.status(400).json({ error: "Missing required parameters: uid and phone" });
      return;
    }
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { $set: { phone, updatedAt: new Date() } },
      { new: true }
    );
    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ success: true, message: "تم تحديث رقم الهاتف بنجاح", user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: "Update phone error", details: error.message });
  }
});

// تحديث الملف الشخصي للمستخدم
app.post('/api/user/update-profile', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid, displayName, phone } = req.body;
    if (!uid) {
      res.status(400).json({ error: "Missing required parameter: uid" });
      return;
    }
    const updateData: any = { updatedAt: new Date() };
    if (displayName !== undefined) updateData.displayName = displayName;
    if (phone !== undefined) updateData.phone = phone;
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { $set: updateData },
      { new: true }
    );
    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ success: true, message: "تم تحديث الملف الشخصي بنجاح", user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: "Update profile error", details: error.message });
  }
});

// تحديث حالة الاتصال والحضور (Presence)
app.post('/api/user/presence', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid, isOnline } = req.body;
    if (!uid) {
      res.status(400).json({ error: "Missing required parameter: uid" });
      return;
    }
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { $set: { isOnline: Boolean(isOnline), lastSeen: new Date(), updatedAt: new Date() } },
      { new: true }
    );
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: "Update presence error", details: error.message });
  }
});

// 4️⃣ طلب إيداع رصيد جديد (Deposit)
app.post('/api/user/deposit', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid, amount, description } = req.body;
    if (!uid || !amount || Number(amount) <= 0) {
      res.status(400).json({ error: "Invalid parameters: amount must be positive" });
      return;
    }
    const cleanAmount = currencySetter(Number(amount));
    const tx = new Transaction({
      userId: uid,
      amount: cleanAmount,
      type: 'deposit',
      status: 'pending', // يتطلب موافقة الإدارة أو معالجة الدفع
      description: description || 'طلب إيداع عبر الحساب البنكي / المحفظة',
      createdAt: new Date()
    });
    await tx.save();

    res.json({ success: true, message: "تم إرسال طلب الإيداع للمراجعة بنجاح", transaction: tx });
  } catch (error: any) {
    res.status(500).json({ error: "Deposit error", details: error.message });
  }
});

// 5️⃣ طلب سحب رصيد (Withdraw)
app.post('/api/user/withdraw', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid, amount, description } = req.body;
    if (!uid || !amount || Number(amount) <= 0) {
      res.status(400).json({ error: "Invalid parameters: amount must be positive" });
      return;
    }
    const cleanAmount = currencySetter(Number(amount));
    const user = await User.findOne({ uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.balance < cleanAmount) {
      res.status(400).json({ error: "Insufficient balance", message: "رصيدك الحالي لا يكفي لإتمام طلب السحب" });
      return;
    }

    // خصم المبلغ من الرصيد مؤقتاً لحين مراجعة الطلب
    user.balance = currencySetter(user.balance - cleanAmount);
    user.updatedAt = new Date();
    await user.save();

    const tx = new Transaction({
      userId: uid,
      amount: cleanAmount,
      type: 'withdraw',
      status: 'pending',
      description: description || 'طلب سحب أرباح / رصيد',
      createdAt: new Date()
    });
    await tx.save();

    res.json({ success: true, message: "تم تقديم طلب السحب وخصمه من الرصيد لحين التحويل", balance: user.balance, transaction: tx });
  } catch (error: any) {
    res.status(500).json({ error: "Withdraw error", details: error.message });
  }
});

// 6️⃣ إضافة استثمار جديد (Invest)
app.post('/api/user/invest', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid, amount } = req.body;
    const cleanAmount = currencySetter(Number(amount));
    if (!uid || cleanAmount <= 0) {
      res.status(400).json({ error: "Invalid investment amount" });
      return;
    }
    const user = await User.findOne({ uid });
    if (!user || user.balance < cleanAmount) {
      res.status(400).json({ error: "Insufficient balance for investment" });
      return;
    }

    user.balance = currencySetter(user.balance - cleanAmount);
    user.investments = currencySetter(user.investments + cleanAmount);
    user.updatedAt = new Date();
    await user.save();

    const tx = new Transaction({
      userId: uid,
      amount: cleanAmount,
      type: 'investment',
      status: 'completed',
      description: 'دخول في باقة استثمارية جديدة',
      createdAt: new Date()
    });
    await tx.save();

    res.json({ success: true, user, transaction: tx });
  } catch (error: any) {
    res.status(500).json({ error: "Investment error", details: error.message });
  }
});

// 7️⃣ جلب سجل المعاملات المالية للمستخدم
app.get('/api/user/transactions/:uid', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const transactions = await Transaction.find({ userId: uid }).sort({ createdAt: -1 }).limit(100);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: "Error fetching transactions", details: error.message });
  }
});

// 8️⃣ مسارات الدردشة والدعم الفني (Chat API)
app.get('/api/chat/messages/:uid', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const messages = await ChatMessage.find({ userId: uid }).sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: "Error fetching chat messages for user", details: error.message });
  }
});

app.get('/api/chat/messages', ensureDb, async (req: Request, res: Response) => {
  try {
    const messages = await ChatMessage.find({}).sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: "Error fetching chat messages", details: error.message });
  }
});

app.post('/api/chat/send', ensureDb, async (req: Request, res: Response) => {
  try {
    const { userId, senderId, senderName, text, isAdmin } = req.body;
    if (!userId || !text) {
      res.status(400).json({ error: "Missing required chat parameters" });
      return;
    }
    const msg = new ChatMessage({
      userId,
      senderId: senderId || userId,
      senderName: senderName || 'User',
      text,
      isAdmin: Boolean(isAdmin),
      createdAt: new Date()
    });
    await msg.save();
    res.json(msg);
  } catch (error: any) {
    res.status(500).json({ error: "Error sending message", details: error.message });
  }
});

// ============================================================================
// 4. مسارات الإدارة (ADMIN ENDPOINTS - كاملة 100%)
// ============================================================================

// جلب جميع المستخدمين للوحة الإدارة
app.get('/api/admin/users', ensureDb, async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: "Admin get users error", details: error.message });
  }
});

// جلب بيانات مستخدم محدد للوحة الإدارة
app.get('/api/admin/user/:uid', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: "Admin get user error", details: error.message });
  }
});

// جلب إحصائيات المنصة الشاملة
app.get('/api/admin/stats', ensureDb, async (req: Request, res: Response) => {
  try {
    const totalUsersCount = await User.countDocuments();
    const users = await User.find({});
    let totalBalances = 0;
    let totalInvestments = 0;
    let totalProfits = 0;

    users.forEach(u => {
      totalBalances += (u.balance || 0);
      totalInvestments += (u.investments || 0);
      totalProfits += (u.profits || 0);
    });

    res.json({
      totalUsers: totalUsersCount,
      totalBalances: currencySetter(totalBalances),
      totalInvestments: currencySetter(totalInvestments),
      totalProfits: currencySetter(totalProfits),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: "Admin stats error", details: error.message });
  }
});

// تعديل أرصدة أو استثمارات أي مستخدم من طرف الأدمن (دعم POST و PUT)
const handleAdminUpdateFinancials = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { balance, investments, profits, depositBonus, depositBonusDate, isVerified, role } = req.body;
    
    const updateData: any = { updatedAt: new Date() };
    if (balance !== undefined) updateData.balance = currencySetter(Number(balance));
    if (investments !== undefined) updateData.investments = currencySetter(Number(investments));
    if (profits !== undefined) updateData.profits = currencySetter(Number(profits));
    if (depositBonus !== undefined) updateData.depositBonus = currencySetter(Number(depositBonus));
    if (depositBonusDate !== undefined) updateData.depositBonusDate = depositBonusDate ? new Date(depositBonusDate) : null;
    if (isVerified !== undefined) updateData.isVerified = Boolean(isVerified);
    if (role !== undefined && ['user', 'admin'].includes(role)) updateData.role = role;

    const updatedUser = await User.findOneAndUpdate({ uid }, { $set: updateData }, { new: true });
    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ success: true, message: "تم تحديث البيانات المالية للحساب بنجاح", user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: "Admin update financials error", details: error.message });
  }
};

app.post('/api/admin/user/:uid/update-financials', ensureDb, handleAdminUpdateFinancials);
app.put('/api/admin/user/:uid/update-financials', ensureDb, handleAdminUpdateFinancials);

// إنشاء أو تعديل معاملة مالية لمستخدم من طرف الأدمن
app.post('/api/admin/user/:uid/transaction', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { txId, amount, type, status, description, createdAt } = req.body;
    
    if (txId) {
      const updateData: any = {};
      if (amount !== undefined) updateData.amount = currencySetter(Number(amount));
      if (type !== undefined) updateData.type = type;
      if (status !== undefined) updateData.status = status;
      if (description !== undefined) updateData.description = description;
      if (createdAt !== undefined) updateData.createdAt = new Date(createdAt);
      
      const updatedTx = await Transaction.findByIdAndUpdate(txId, { $set: updateData }, { new: true });
      if (!updatedTx) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }
      res.json({ success: true, message: "تم تعديل المعاملة بنجاح", transaction: updatedTx });
    } else {
      if (amount === undefined || !type) {
        res.status(400).json({ error: "Missing required transaction fields: amount and type" });
        return;
      }
      const newTx = new Transaction({
        userId: uid,
        amount: currencySetter(Number(amount)),
        type,
        status: status || 'completed',
        description: description || 'إضافة بواسطة الإدارة',
        createdAt: createdAt ? new Date(createdAt) : new Date()
      });
      await newTx.save();

      if (newTx.status === 'completed') {
        if (type === 'deposit' || type === 'reward' || type === 'profit') {
          const incObj: any = { balance: newTx.amount };
          if (type === 'profit') incObj.profits = newTx.amount;
          await User.findOneAndUpdate({ uid }, { $inc: incObj, $set: { updatedAt: new Date() } });
        } else if (type === 'withdraw') {
          await User.findOneAndUpdate({ uid }, { $inc: { balance: -newTx.amount }, $set: { updatedAt: new Date() } });
        } else if (type === 'investment') {
          await User.findOneAndUpdate({ uid }, { $inc: { investments: newTx.amount }, $set: { updatedAt: new Date() } });
        }
      }

      res.json({ success: true, message: "تم إنشاء المعاملة بنجاح", transaction: newTx });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Admin save transaction error", details: error.message });
  }
});

// حذف معاملة مالية من طرف الأدمن
app.delete('/api/admin/user/:uid/transaction/:txId', ensureDb, async (req: Request, res: Response) => {
  try {
    const { txId } = req.params;
    const deletedTx = await Transaction.findByIdAndDelete(txId);
    if (!deletedTx) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json({ success: true, message: "تم حذف المعاملة بنجاح", transaction: deletedTx });
  } catch (error: any) {
    res.status(500).json({ error: "Admin delete transaction error", details: error.message });
  }
});

// تحديث رتبة وحالة المستخدم من طرف الأدمن
app.post('/api/admin/user/:uid/update-status', ensureDb, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ error: "Invalid role value" });
      return;
    }
    const updatedUser = await User.findOneAndUpdate({ uid }, { $set: { role, updatedAt: new Date() } }, { new: true });
    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ success: true, message: "تم تحديث الرتبة بنجاح", user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: "Admin update status error", details: error.message });
  }
});

// جلب جميع المعاملات المالية في المنصة
app.get('/api/admin/transactions', ensureDb, async (req: Request, res: Response) => {
  try {
    const txs = await Transaction.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(txs);
  } catch (error: any) {
    res.status(500).json({ error: "Admin get transactions error", details: error.message });
  }
});

// تغيير حالة طلب إيداع أو سحب (تفعيل / رفض / تعليق)
app.put('/api/admin/transaction/:id/status', ensureDb, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    if (!['pending', 'completed', 'failed', 'reviewing', 'suspended'].includes(status)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    const tx = await Transaction.findById(id);
    if (!tx) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    const oldStatus = tx.status;
    tx.status = status;
    if (adminNote) tx.description = `${tx.description} [ملاحظة الإدارة: ${adminNote}]`;
    await tx.save();

    // إذا تم الموافقة على طلب إيداع، يتم إضافة المبلغ لرصيد المستخدم
    if (oldStatus !== 'completed' && status === 'completed' && tx.type === 'deposit') {
      await User.findOneAndUpdate({ uid: tx.userId }, { $inc: { balance: tx.amount }, $set: { updatedAt: new Date() } });
    }
    // إذا تم رفض طلب سحب، يتم إعادة المبلغ لرصيد المستخدم
    else if (oldStatus === 'pending' && ['failed', 'suspended'].includes(status) && tx.type === 'withdraw') {
      await User.findOneAndUpdate({ uid: tx.userId }, { $inc: { balance: tx.amount }, $set: { updatedAt: new Date() } });
    }

    res.json({ success: true, message: "تم تحديث حالة المعاملة بنجاح", transaction: tx });
  } catch (error: any) {
    res.status(500).json({ error: "Admin update tx status error", details: error.message });
  }
});

// ============================================================================
// 5. VITE / STATIC STATIC SERVING AND LAUNCH
// ============================================================================
if (process.env.NODE_ENV !== "production") {
  import('vite').then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server ready on port ${PORT}`));
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => res.sendFile(path.join(distPath, 'index.html')));
  app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Production server ready on port ${PORT}`));
}
