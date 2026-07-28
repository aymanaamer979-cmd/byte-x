// @ts-nocheck
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Lazy load routes to prevent top-level crashes
import { connectToDatabase } from '../backend/config/db';
import authRoutes from '../backend/routes/authRoutes';
import userRoutes from '../backend/routes/userRoutes';
import adminRoutes from '../backend/routes/adminRoutes';
import debugRoutes from '../backend/routes/debugRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Boot check log
console.log("🚀 Server Boot Sequence Started - " + new Date().toISOString());
console.log("📍 Node Version: " + process.version);
console.log("📍 Memory Usage: " + Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB");

// Request Logger
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  next();
});

// [NEW] Simple Ping Route (Works without DB)
app.get('/api/ping', (req, res) => {
  res.json({
    status: "alive",
    message: "Server is responding",
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/debug', debugRoutes);

// [NEW] 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: "API Route Not Found",
    path: req.originalUrl,
    hint: "Check if the route is defined in authRoutes, userRoutes, or adminRoutes"
  });
});

// Detailed DB Status
app.get('/api/db-status', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({
      status: mongoose.connection.readyState === 1 ? "connected" : "connecting",
      database: mongoose.connection.db?.databaseName || 'unknown',
      time: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ DB Status Route Error:", error.message);
    res.status(500).json({
      status: "disconnected",
      error: error.message,
      hint: "Check MongoDB Atlas Network Access (0.0.0.0/0)"
    });
  }
});

// [CRITICAL] Global Error Catcher
app.use((err, req, res, next) => {
  console.error("🔥 SERVER CRASH PREVENTED:", err);
  res.status(500).json({
    error: "Internal Server Error (Caught)",
    message: err.message,
    path: req.url,
    timestamp: new Date().toISOString()
  });
});

export default app;
