import crypto from 'node:crypto'
import mongoose from 'mongoose'

if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.getRandomValues) {
  try {
    // @ts-ignore
    globalThis.crypto = crypto.webcrypto || crypto
  } catch {
    // ignore
  }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prepvvise'

interface GlobalMongoose {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: GlobalMongoose | undefined
}

const cached: GlobalMongoose = global.mongooseCache || { conn: null, promise: null }
if (!global.mongooseCache) {
  global.mongooseCache = cached
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prepvvise'

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    }
    cached.promise = mongoose.connect(uri, opts).then((m) => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error('[MongoDB] Database connection error:', e)
    throw new Error('Database connection failed. Please check MONGODB_URI environment configuration.')
  }

  return cached.conn
}
