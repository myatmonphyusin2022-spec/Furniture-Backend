import { Redis } from "ioredis";


// Initialize Redis connection with maxRetriesPerRequest set to null (required by BullMQ)
export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT!) || 6379,
  maxRetriesPerRequest: null,
});