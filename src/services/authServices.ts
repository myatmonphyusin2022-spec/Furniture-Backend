import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// 1. PostgreSQL Connection Pool ဖန်တီးပါ
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Adapter ထဲသို့ pool ကို ထည့်ပေးပါ
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

export const getUserByPhone = async (phone: string) => {
  return await prisma.user.findUnique({
    where: {
      phone: phone,
    },
  });
};


export const createOtp = async (otpData: any) => {
  return await prisma.otp.create({
    data: otpData,
  });
};