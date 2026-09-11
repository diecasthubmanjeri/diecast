import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

let hasWarnedFallback = false;

export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI || '';
  if (!uri || uri.includes('<db_password>')) {
    if (!hasWarnedFallback) {
      console.warn('[MongoDB] MONGODB_URI is not configured or still has <db_password> placeholder. Operating in persistent local fallback mode (.data/store.json).');
      hasWarnedFallback = true;
    }
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log('[MongoDB] Connected successfully to Atlas cluster.');
      return m;
    }).catch((err) => {
      console.error('[MongoDB] Connection error:', err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    return null;
  }
}
