import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables')
}

// Cache connection across hot reloads in dev
const cached = global as typeof global & {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.mongoose!.conn) return cached.mongoose!.conn

  if (!cached.mongoose!.promise) {
    cached.mongoose!.promise = mongoose.connect(MONGODB_URI).then((m) => m)
  }

  try {
    cached.mongoose!.conn = await cached.mongoose!.promise
  } catch (err) {
    cached.mongoose!.promise = null
    throw err
  }
  return cached.mongoose!.conn
}
