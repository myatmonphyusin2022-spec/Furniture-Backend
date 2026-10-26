import { Worker } from "bullmq";
import { Redis } from "ioredis";
import sharp from "sharp";
import path from "path";
const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT!),
});
// create a worker to process the image optimization job
const imageWorker = new Worker(
  "imageQueue",
  async (job) => {
    const { filePath, fileName } = job.data;
    const optimizedImagePath = path.join(
      __dirname,
      "../../..",
      "/uploads/optimize",
      fileName,
    );
    await sharp(filePath)
      .resize(200, 200)
      .webp({ quality: 50 })
      .toFile(optimizedImagePath);
  },
  { connection },
);
imageWorker.on("completed", (job) => {
  console.log(`Job completed with result ${job.id}`);
});
imageWorker.on("failed", (job: any, err) => {
  console.group(`Job ${job.id}failed with ${err.message}`);
});