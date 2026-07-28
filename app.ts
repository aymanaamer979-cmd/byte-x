// @ts-nocheck
// app.ts - REFRESHED VERSION 2.2
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import mongoose from 'mongoose';

// Import Organized Routes
import { connectToDatabase } from './backend/config/db';
import authRoutes from './backend/routes/authRoutes';
import userRoutes from './backend/routes/userRoutes';
import adminRoutes from './backend/routes/adminRoutes';
import debugRoutes from './backend/routes/debugRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// API Middlewares & Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/debug', debugRoutes);

// Database Health Check
app.get('/api/db-status', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    res.json({ status: "connected", database: mongoose.connection.db?.databaseName });
  } catch (error: any) {
    res.status(500).json({ status: "disconnected", error: error.message });
  }
});

// Production Static Serving
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API Not Found' });
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Local Server Start
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Local server ready on port ${PORT}`);
  });
}

export default app;
