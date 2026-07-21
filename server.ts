import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';

// --- MONGODB LAZY CONNECTION HANDLER ---
let MONGODB_URI = process.env.MONGODB_URI;

// Auto-heal connection string if the password contains an unencoded '@' character
if (MONGODB_URI && MONGODB_URI.includes('://')) {
  try {
    const protocolSplit = MONGODB_URI.split('://');
    const protocol = protocolSplit[0];
    const remaining = protocolSplit[1];
    const lastAtIndex = remaining.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const credentials = remaining.substring(0, lastAtIndex);
      const rest = remaining.substring(lastAtIndex); // includes the final '@' and host
      const firstColonIndex = credentials.indexOf(':');
      if (firstColonIndex !== -1) {
        const user = credentials.substring(0, firstColonIndex);
        const pass = credentials.substring(firstColonIndex + 1);
        if (pass.includes('@')) {
          const encodedPass = pass.replace(/@/g, '%40');
          MONGODB_URI = `${protocol}://${user}:${encodedPass}${rest}`;
          console.log("🔌 Auto-healed MONGODB_URI password containing '@'.");
        }
      }
    }
  } catch (err) {
    console.error("Error healing MONGODB_URI:", err);
  }
}

let dbConnected = false;
let lastDbError: any = null;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    dbConnected = true;
    lastDbError = null;
    return true;
  }
  
  if (!MONGODB_URI) {
    console.warn("⚠️ Warning: MONGODB_URI environment variable is not set. Database features will return configuration errors.");
    lastDbError = new Error("MONGODB_URI environment variable is missing or empty.");
    return false;
  }
  try {
    // serverSelectionTimeoutMS prevents serverless functions from hanging and timing out on Vercel
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    dbConnected = true;
    lastDbError = null;
    console.log("🔌 Connected to MongoDB Atlas successfully.");
    return true;
  } catch (error: any) {
    console.error("❌ Failed to connect to MongoDB Atlas:", error);
    dbConnected = false;
    lastDbError = error;
    return false;
  }
}

// Ensure database connection middleware
const ensureDb = async (req: Request, res: Response, next: NextFunction) => {
  const connected = await connectToDatabase();
  if (!connected) {
    const errMsg = lastDbError ? (lastDbError.message || String(lastDbError)) : "Unknown Connection Error";
    res.status(500).json({
      error: "Database Configuration Error",
      message: `Failed to connect to MongoDB: ${errMsg}. Please verify your MONGODB_URI connection string and ensure that your MongoDB Atlas cluster has "Network Access" set to allow access from anywhere (0.0.0.0/0) so that Vercel serverless functions can connect.`
    });
    return;
  }
  next();
};

// --- MONGOOSE SCHEMAS & MODELS ---
const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, default: '' },
  email: { type: String, required: true },
  photoURL: { type: String, default: '' },
  phone: { type: String, default: '' },
  role: { type: String, default: 'user' },
  balance: { type: Number, default: 35 },
  investments: { type: Number, default: 0 },
  profits: { type: Number, default: 0 },
  depositBonus: { type: Number, default: 0 },
  depositBonusDate: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true }, // 'deposit', 'withdraw', 'reward'
  status: { type: String, required: true, default: 'pending' }, // 'pending', 'completed', 'failed', 'reviewing', 'suspended'
  description: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const ChatMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

// --- EXPRESS APPLICATION SETUP ---
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/db-status', async (req: Request, res: Response) => {
  const connected = await connectToDatabase();
  res.json({
    connected,
    readyState: mongoose.connection.readyState,
    hasUri: !!MONGODB_URI,
    error: lastDbError ? (lastDbError.message || String(lastDbError)) : null,
    tip: "If you are getting a connection timeout or server selection timeout, please make sure you configured 'Network Access' (IP Access List) in MongoDB Atlas to 'Allow Access From Anywhere' (0.0.0.0/0). Vercel uses dynamic serverless IP addresses which change continuously."
  });
});

// Try to connect to MongoDB on startup, but do not block the server if it fails or is missing
connectToDatabase().catch(err => {
  console.error("Non-blocking startup DB connection error:", err);
});

  // ==========================================================
  // --- USER API ENDPOINTS ---
  // ==========================================================

  // Sync user profile upon sign-in / registration
  app.post('/api/auth/sync', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid, email, displayName, photoURL } = req.body;
      if (!uid || !email) {
        res.status(400).json({ error: "Missing required parameters: uid and email" });
        return;
      }

      let user = await User.findOne({ uid });

      if (!user) {
        // Create new user with welcome gift (35 USD)
        user = new User({
          uid,
          email,
          displayName: displayName || email.split('@')[0],
          photoURL: photoURL || '',
          phone: '',
          role: 'user',
          balance: 35,
          investments: 0,
          profits: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await user.save();

        // Create initial reward transaction
        const initialReward = new Transaction({
          userId: uid,
          amount: 35,
          type: 'reward',
          status: 'completed',
          description: 'هدية ترحيبية عند التسجيل',
          createdAt: new Date().toISOString()
        });
        await initialReward.save();
      }

      res.json(user);
    } catch (error: any) {
      console.error("Error in auth sync:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Get user profile
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

  // Update user phone number
  app.post('/api/user/update-phone', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid, phone } = req.body;
      if (!uid || !phone) {
        res.status(400).json({ error: "Missing parameters: uid or phone" });
        return;
      }

      const user = await User.findOneAndUpdate(
        { uid },
        { phone, updatedAt: new Date().toISOString() },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Update user profile (displayName and/or phone)
  app.post('/api/user/update-profile', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid, displayName, phone } = req.body;
      if (!uid) {
        res.status(400).json({ error: "Missing parameter: uid" });
        return;
      }

      const updateData: any = { updatedAt: new Date().toISOString() };
      if (displayName !== undefined) updateData.displayName = displayName;
      if (phone !== undefined) updateData.phone = phone;

      const user = await User.findOneAndUpdate(
        { uid },
        updateData,
        { new: true }
      );

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Update online presence status
  app.post('/api/user/presence', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid, isOnline } = req.body;
      if (!uid) {
        res.status(400).json({ error: "Missing parameters: uid" });
        return;
      }

      const user = await User.findOneAndUpdate(
        { uid },
        { isOnline, lastSeen: new Date().toISOString() },
        { new: true }
      );

      res.json({ success: true, isOnline: user?.isOnline });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Submit a deposit request
  app.post('/api/user/deposit', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid, amount, description } = req.body;
      if (!uid || !amount) {
        res.status(400).json({ error: "Missing parameters: uid or amount" });
        return;
      }

      const tx = new Transaction({
        userId: uid,
        amount: Number(amount),
        type: 'deposit',
        status: 'pending',
        description: description || 'طلب إيداع جديد',
        createdAt: new Date().toISOString()
      });
      await tx.save();

      res.json({ success: true, transaction: tx });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Submit a withdrawal request
  app.post('/api/user/withdraw', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid, amount, description } = req.body;
      if (!uid || !amount) {
        res.status(400).json({ error: "Missing parameters: uid or amount" });
        return;
      }

      const user = await User.findOne({ uid });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Pre-validation of balance (not strictly enforced if admin allows custom flow, but good practice)
      if (user.balance < Number(amount)) {
        res.status(400).json({ error: "رصيدك المتاح غير كافٍ لإجراء هذه العملية" });
        return;
      }

      const tx = new Transaction({
        userId: uid,
        amount: Number(amount),
        type: 'withdraw',
        status: 'reviewing',
        description: description || 'طلب سحب أرباح تحت المراجعة',
        createdAt: new Date().toISOString()
      });
      await tx.save();

      res.json({ success: true, transaction: tx });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Get transaction records for a user
  app.get('/api/user/transactions/:uid', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const txs = await Transaction.find({ userId: uid }).sort({ createdAt: -1 });
      
      // Map _id to id for client compatibility
      const formatted = txs.map(tx => ({
        id: tx._id.toString(),
        userId: tx.userId,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt
      }));

      res.json(formatted);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // ==========================================================
  // --- CHAT API ENDPOINTS ---
  // ==========================================================

  // Get chat history for a user
  app.get('/api/chat/messages/:uid', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const msgs = await ChatMessage.find({ userId: uid }).sort({ createdAt: 1 });
      
      const formatted = msgs.map(m => ({
        id: m._id.toString(),
        userId: m.userId,
        senderId: m.senderId,
        senderName: m.senderName,
        text: m.text,
        isAdmin: m.isAdmin,
        createdAt: m.createdAt
      }));

      res.json(formatted);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Send a chat message
  app.post('/api/chat/send', ensureDb, async (req: Request, res: Response) => {
    try {
      const { userId, senderId, senderName, text, isAdmin } = req.body;
      if (!userId || !senderId || !text) {
        res.status(400).json({ error: "Missing required message parameters" });
        return;
      }

      const msg = new ChatMessage({
        userId,
        senderId,
        senderName: senderName || 'مستخدم',
        text,
        isAdmin: !!isAdmin,
        createdAt: new Date().toISOString()
      });
      await msg.save();

      res.json({
        id: msg._id.toString(),
        userId: msg.userId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.text,
        isAdmin: msg.isAdmin,
        createdAt: msg.createdAt
      });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // ==========================================================
  // --- ADMIN API ENDPOINTS ---
  // ==========================================================

  // Get all users
  app.get('/api/admin/users', ensureDb, async (req: Request, res: Response) => {
    try {
      const users = await User.find({});
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Get specific user financials & info
  app.get('/api/admin/user/:uid', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const user = await User.findOne({ uid });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const txs = await Transaction.find({ userId: uid }).sort({ createdAt: -1 });
      const formattedTxs = txs.map(tx => ({
        id: tx._id.toString(),
        userId: tx.userId,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt
      }));

      res.json({
        user,
        transactions: formattedTxs
      });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Update specific user financials
  app.post('/api/admin/user/:uid/update-financials', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const { balance, investments, profits, isVerified, depositBonus, depositBonusDate } = req.body;

      const updateData: any = { updatedAt: new Date().toISOString() };
      if (balance !== undefined) updateData.balance = Number(balance);
      if (investments !== undefined) updateData.investments = Number(investments);
      if (profits !== undefined) updateData.profits = Number(profits);
      if (isVerified !== undefined) updateData.isVerified = Boolean(isVerified);
      if (depositBonus !== undefined) updateData.depositBonus = Number(depositBonus);
      if (depositBonusDate !== undefined) updateData.depositBonusDate = depositBonusDate;

      const user = await User.findOneAndUpdate({ uid }, updateData, { new: true });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Create or Edit User Transaction from admin
  app.post('/api/admin/user/:uid/transaction', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const { txId, amount, type, status, description, createdAt } = req.body;

      if (txId) {
        // Edit existing transaction
        const updatedTx = await Transaction.findByIdAndUpdate(
          txId,
          {
            amount: Number(amount),
            type,
            status,
            description,
            createdAt: createdAt || new Date().toISOString()
          },
          { new: true }
        );
        res.json({ success: true, transaction: updatedTx });
      } else {
        // Create new transaction
        const newTx = new Transaction({
          userId: uid,
          amount: Number(amount),
          type,
          status,
          description,
          createdAt: createdAt || new Date().toISOString()
        });
        await newTx.save();
        res.json({ success: true, transaction: newTx });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Delete transaction from admin
  app.delete('/api/admin/user/:uid/transaction/:txId', ensureDb, async (req: Request, res: Response) => {
    try {
      const { txId } = req.params;
      await Transaction.findByIdAndDelete(txId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Update user status/role from admin
  app.post('/api/admin/user/:uid/update-status', ensureDb, async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const { role } = req.body;

      const user = await User.findOneAndUpdate(
        { uid },
        { role, updatedAt: new Date().toISOString() },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // ==========================================================
  // --- VITE DEV / PRODUCTION INGRESS ---
  // ==========================================================

  if (process.env.NODE_ENV !== "production") {
    (async () => {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Byte X Platform running on http://localhost:${PORT} with MongoDB Atlas integration.`);
      });
    })();
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    if (!process.env.VERCEL) {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Byte X Platform running on port ${PORT}`);
      });
    }
  }

export default app;
