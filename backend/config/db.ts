// @ts-nocheck
import mongoose from 'mongoose';

// It is recommended to set MOREX in your Vercel Environment Variables.
const MONGODB_URI = process.env.MOREX || "mongodb+srv://aymanaamer979_db_user:morex@more.cmgbgda.mongodb.net/?appName=more";

// Use globalThis for better compatibility with Vercel/Serverless environments
let cached = (globalThis as any).mongoose;
if (!cached) {
  cached = (globalThis as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000, // تقليل وقت الانتظار لكشف الفشل بسرعة
      connectTimeoutMS: 5000,
      dbName: 'more',
    };

    console.log("⏳ Connecting to MongoDB Atlas...");

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log(`🚀 MongoDB Connected: ${mongoose.connection.db?.databaseName}`);
      return mongooseInstance;
    }).catch(err => {
      console.error(`❌ MongoDB Connection Error Details:`);
      console.error(`   - Message: ${err.message}`);
      console.error(`   - Code: ${err.code}`);
      if (err.message.includes('IP')) {
        console.error(`   - HINT: This looks like a Network Access (IP Whitelist) issue.`);
      }
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}
