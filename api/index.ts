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

// Logger for Vercel
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
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
    const conn = await connectToDatabase();
    const isConnected = mongoose.connection.readyState === 1;

    res.json({
      status: isConnected ? "connected" : "connecting",
      readyState: mongoose.connection.readyState,
      database: mongoose.connection.db?.databaseName,
      ping: isConnected ? await mongoose.connection.db.admin().ping() : null,
      time: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ DB Status Detailed Failure:", error.message);
    res.status(500).json({
      status: "disconnected",
      error: error.message,
      stack: error.stack
    });
  }
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    path: req.url
  });
});

// Catch-all for API 404s
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: "Endpoint Not Found", url: req.originalUrl });
});

export default app;
