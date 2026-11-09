import { Worker } from "bullmq";
import { redis } from "../../config/redisClient";

export const cacheWorker = new Worker(
  "cache-invalidation", // Fixed typo: "invalidaion" -> "invalidation"
  async (job) => {
    const { pattern } = job.data;
    await invalidateCache(pattern);
  },
  {
    connection: redis,
    concurrency: 5, // Process 5 jobs concurrently
  },
);

cacheWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

cacheWorker.on("failed", (job: any, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

const invalidateCache = async (pattern: string) => {
  try {
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    });
    const pipeline = redis.pipeline();
    let totalKeys = 0;

    await new Promise<void>((resolve, reject) => {
      // Process keys in batches
      stream.on("data", (keys: string[]) => {
        if (keys.length > 0) {
          keys.forEach((key) => {
            pipeline.del(key);
          });
          totalKeys += keys.length; 
        }
      });

      stream.on("end", async () => {
        try {
          if (totalKeys > 0) {
            await pipeline.exec();
            console.log(`Invalidated ${totalKeys} keys`);
          }
          resolve();
        } catch (execError) {
          reject(execError);
        }
      });

      stream.on("error", (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error("Cache Invalidation error:", error);
    throw error;
  }
};
