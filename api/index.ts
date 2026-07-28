// @ts-nocheck
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Import Organized Routes
import { connectToDatabase } from '../backend/config/db';
import authRoutes from '../backend/routes/authRoutes';
import userRoutes from '../backend/routes/userRoutes';
import adminRoutes from '../backend/routes/adminRoutes';
import debugRoutes from '../backend/routes/debugRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Log every request to Vercel Logs for visibility
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/debug', debugRoutes);

// Health Check
app.get('/api/db-status', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({
      status: "connected",
      database: mongoose.connection.db?.databaseName,
      time: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ DB Status Check Failed:", error.message);
    res.status(500).json({ status: "disconnected", error: error.message });
  }
});

// GLOBAL ERROR CATCHER - No more generic 500s!
app.use((err, req, res, next) => {
  console.error("🔥 UNCAUGHT SERVER ERROR:", err);
  res.status(500).json({
    error: "Server Crash Prevented",
    message: err.message,
    path: req.originalUrl,
    stack: process.env.NODE_ENV === 'development' ? err.stack : 'Stack hidden in production'
  });
});

// Final JSON Error Handler for 404s
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: "API Route Not Found", path: req.originalUrl });
});

export default app;
