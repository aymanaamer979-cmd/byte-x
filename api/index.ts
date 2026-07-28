// @ts-nocheck
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Catch all process errors to prevent Vercel crash
process.on('uncaughtException', (err) => {
  console.error('🔥 CRITICAL UNCAUGHT ERROR:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
});

const app = express();
app.use(cors());
app.use(express.json());

// Boot logs
console.log("🚀 Vercel Function Booting...");

// Lazy load routes to prevent boot-time crashes
let routesLoaded = false;
const loadRoutes = async () => {
  if (routesLoaded) return;
  try {
    const { default: authRoutes } = await import('../backend/routes/authRoutes');
    const { default: userRoutes } = await import('../backend/routes/userRoutes');
    const { default: adminRoutes } = await import('../backend/routes/adminRoutes');
    const { default: debugRoutes } = await import('../backend/routes/debugRoutes');

    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/debug', debugRoutes);
    routesLoaded = true;
    console.log("✅ Routes Loaded Successfully");
  } catch (err) {
    console.error("❌ Failed to load routes:", err.message);
  }
};

// Ping route (Top level, no DB dependency)
app.get('/api/ping', (req, res) => {
  res.json({ status: "alive", time: new Date().toISOString() });
});

// Middleware to ensure routes are loaded
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') && !routesLoaded) {
    await loadRoutes();
  }
  next();
});

export default app;
