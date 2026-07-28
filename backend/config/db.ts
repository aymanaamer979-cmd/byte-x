// @ts-nocheck
import mongoose from 'mongoose';

const FALLBACK_MONGODB_URI = "mongodb+srv://aymanaamer979_db_user:fahdIMRAN1@more.cmgbgda.mongodb.net/more?retryWrites=true&w=majority&appName=more";
const MONGODB_URI = process.env.MONGODB_URI || FALLBACK_MONGODB_URI;

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      dbName: 'more',
    };

    console.log("⏳ Connecting to MongoDB Atlas...");

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log(`🚀 MongoDB Connected: ${mongoose.connection.db?.databaseName}`);
      return mongooseInstance;
    }).catch(err => {
      console.error(`❌ MongoDB Connection Error:`, err.message);
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

export const currencySetter = (val: number) => Math.round((Number(val) || 0) * 100) / 100;
