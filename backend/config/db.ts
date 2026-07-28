// @ts-nocheck
import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = "mongodb+srv://aymanaamer979_db_user:fahdIMRAN1@more.cmgbgda.mongodb.net/more?retryWrites=true&w=majority&appName=more";

function formatMongoUri(rawUri: string, targetDb: string = 'more'): string {
  if (!rawUri || typeof rawUri !== 'string') return rawUri;
  let uri = rawUri.trim();

  const protoIdx = uri.indexOf('://');
  if (protoIdx !== -1) {
    const proto = uri.substring(0, protoIdx + 3);
    const rest = uri.substring(protoIdx + 3);
    const lastAt = rest.lastIndexOf('@');
    if (lastAt !== -1) {
      const creds = rest.substring(0, lastAt);
      const afterCreds = rest.substring(lastAt);
      const colonIdx = creds.indexOf(':');
      if (colonIdx !== -1) {
        const user = creds.substring(0, colonIdx);
        const pass = creds.substring(colonIdx + 1);
        if (pass.includes('@') && !pass.includes('%40')) {
          const encodedPass = pass.replace(/@/g, '%40');
          uri = `${proto}${user}:${encodedPass}${afterCreds}`;
        }
      }
    }
  }

  const protoIndex = uri.indexOf('://');
  if (protoIndex === -1) return uri;

  const protocol = uri.substring(0, protoIndex + 3);
  const afterProto = uri.substring(protoIndex + 3);

  const queryIndex = afterProto.indexOf('?');
  let pathPart = queryIndex !== -1 ? afterProto.substring(0, queryIndex) : afterProto;
  const queryPart = queryIndex !== -1 ? afterProto.substring(queryIndex) : '';

  const firstSlashIndex = pathPart.indexOf('/');
  let hostPart = pathPart;
  if (firstSlashIndex !== -1) {
    hostPart = pathPart.substring(0, firstSlashIndex);
  }

  return `${protocol}${hostPart}/${targetDb}${queryPart}`;
}

const MONGODB_URI = formatMongoUri(process.env.MONGODB_URI || process.env.DATABASE_URL || DEFAULT_MONGODB_URI, 'more');

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
      dbName: 'more',
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log(`🔌 Connected to MongoDB Atlas: ${mongoose.connection.db?.databaseName}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export const currencySetter = (val: number) => Math.round((Number(val) || 0) * 100) / 100;
