import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from './env';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<string> {
  let uri = ENV.MONGODB_URI;

  if (uri) {
    try {
      console.log(`📡 Connecting to MongoDB URI from ENV...`);
      await mongoose.connect(uri);
      console.log(`✅ MongoDB connected successfully to remote/local instance`);
      return uri;
    } catch (err) {
      console.warn(`⚠️ Failed to connect to MONGODB_URI: ${(err as Error).message}. Falling back to in-memory instance.`);
    }
  }

  // Fallback to high-performance MongoMemoryServer
  console.log(`🚀 Initializing high-speed in-memory MongoDB engine for seamless development...`);
  mongoMemoryServer = await MongoMemoryServer.create();
  uri = mongoMemoryServer.getUri();
  await mongoose.connect(uri);
  console.log(`✅ In-memory MongoDB connected: ${uri}`);
  return uri;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
