import mongoose from "mongoose";
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const isDevelopment = process.env.NODE_ENV !== "production";
const localMongoUri = process.env.MONGODB_URI_LOCAL;
const rawMongoUri =
  isDevelopment && localMongoUri ? localMongoUri : process.env.MONGODB_URI;
const MONGODB_URI = rawMongoUri?.trim();

if (!MONGODB_URI) {
  throw new Error(
    "Please define MONGODB_URI (or MONGODB_URI_LOCAL in development) in environment variables",
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "lnf",
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    cached.promise = null;
    throw error;
  }
}
