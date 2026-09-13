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

export const getOtpByPhone = async (phone: string) => {
  return await prisma.otp.findUnique({
    where: {
      phone: phone,
    },
  });
};

// Fixed: Added phone parameter (or id, depending on your schema choice)
export const updateOtp = async (phone: string, otpData: any) => {
  return await prisma.otp.update({
    where: {
      phone: phone, // Changed from 'id' to 'phone' (ensures phone is marked @unique in schema.prisma)
    },
    data: otpData,
  });
};
