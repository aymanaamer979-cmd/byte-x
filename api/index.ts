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
    res.status(500).json({ status: "disconnected", error: error.message });
  }
});

// Final JSON Error Handler for 404s
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: "API Route Not Found", path: req.originalUrl });
});

export default app;
