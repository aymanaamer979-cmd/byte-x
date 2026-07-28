// server.ts - Entry Point for Express & Vercel
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import mongoose from 'mongoose';

// Import Config & Routes
import { connectToDatabase } from './backend/config/db';
import authRoutes from './backend/routes/authRoutes';
import userRoutes from './backend/routes/userRoutes';
import adminRoutes from './backend/routes/adminRoutes';
import debugRoutes from './backend/routes/debugRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/debug', debugRoutes);

// Health Check / DB Status
app.get('/api/db-status', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const activeDbName = mongoose.connection.db?.databaseName || 'more';
    res.json({ status: "connected", database: `MongoDB Atlas (${activeDbName})` });
  } catch (error: any) {
    res.status(500).json({ status: "disconnected", error: error.message });
  }
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 Global Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Serving Static Files & SPA Routing
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  // Vercel routes handle the catch-all usually, but this is a safety fallback
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API Not Found' });
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Local Development with Vite Middleware
  import('vite').then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log(`🚀 Development server ready on http://localhost:${PORT}`);
  }).catch(err => {
    console.warn("⚠️ Vite middleware failed to load.");
  });
}

// Start Server (only if not running as a Vercel function)
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });
}

export default app;
