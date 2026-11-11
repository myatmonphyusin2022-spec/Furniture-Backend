import { Worker } from "bullmq";
import { redis } from "../../config/redisClient";
import sharp from "sharp";
import path from "path";

// Create a worker to process the image optimization job
const imageWorker = new Worker(
  "imageQueue",
  async (job) => {
    // Controller မှ ပို့လိုက်သော filePath နဲ့ အခြား အချက်အလက်များကို လက်ခံရန်
    const { filePath, fileName, width, height, quality } = job.data;

    // Define the path where the optimized image will be saved
    const optimizedImagePath = path.join(
      __dirname,
      "../../..",
      "uploads",
      "optimize",
      fileName,
    );

    // Sharp ကိုသုံးပြီး ဒေသတွင်း ဖိုင်လမ်းကြောင်း (filePath) မှတစ်ဆင့် တိုက်ရိုက် Process လုပ်ပါ
    await sharp(filePath)
      .resize(width || 200, height || 200)
      .webp({ quality: quality || 50 })
      .toFile(optimizedImagePath);
  },
  { connection: redis },
);

// Event listener for successfully completed jobs
imageWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

// Event listener for failed jobs
imageWorker.on("failed", (job: any, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});
