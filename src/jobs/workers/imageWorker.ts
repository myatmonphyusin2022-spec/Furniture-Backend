import { Worker } from "bullmq";
import { Redis } from "ioredis";
import sharp from "sharp";
import path from "path";

// Initialize Redis connection with maxRetriesPerRequest set to null (required by BullMQ)
const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  maxRetriesPerRequest: null,
});

// Create a worker to process the image optimization job
const imageWorker = new Worker(
  "imageQueue",
  async (job) => {
    // Controller မှ buffer ပို့ထားသောကြောင့် buffer ကို လက်ခံရန်
    const { buffer, fileName, width, height, quality } = job.data;

    // Define the path where the optimized image will be saved
    const optimizedImagePath = path.join(
      __dirname,
      "../../..",
      "uploads",
      "optimize",
      fileName,
    );

    // BullMQ မှတဆင့် လာသော buffer ကို Node.js Buffer အဖြစ် အသစ်ပြန်ဆောက်ပါ
    const imageBuffer = Buffer.from(buffer.data);

    // Process the image using Sharp: resize, convert to WebP, and save to file
    await sharp(imageBuffer)
      .resize(width || 200, height || 200)
      .webp({ quality: quality || 50 })
      .toFile(optimizedImagePath);
  },
  { connection },
);

// Event listener for successfully completed jobs
imageWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

// Event listener for failed jobs
imageWorker.on("failed", (job: any, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});
