import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// ==========================================
// 1. DATABASE CONNECTION SETUP
// ==========================================

// 1. PostgreSQL Connection Pool ဖန်တီးခြင်း (Database သို့ Connection အများအပြား ချိတ်ဆက်နိုင်ရန်)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Prisma တွင် PostgreSQL Driver Adapter သုံးနိုင်ရန် Pool ကို ထည့်ပေးခြင်း
const adapter = new PrismaPg(pool);

// 3. Adapter ကို အသုံးပြု၍ Prisma Client Instance ဖန်တီးခြင်း
const prisma = new PrismaClient({
  adapter,
});

// ==========================================
// 2. AUTH DATABASE SERVICES
// ==========================================

/**
 * ဖုန်းနံပါတ်ဖြင့် User ရှိမရှိ ရှာဖွေပေးသည့် Service Function
 * @param phone - စစ်ဆေးလိုသော ဖုန်းနံပါတ်
 */
export const getUserByPhone = async (phone: string) => {
  return await prisma.user.findUnique({
    where: {
      phone: phone, // phone field ကို အခြေခံ၍ Unique Record ရှာခြင်း
    },
  });
};

/**
 * OTP Record အသစ် ဖန်တီးပေးသည့် Service Function
 * @param otpData - Database ထဲသို့ သိမ်းဆည်းမည့် OTP အချက်အလက်များ
 */
export const createOtp = async (otpData: any) => {
  return await prisma.otp.create({
    data: otpData, // OTP Record အသစ်ဆောက်ခြင်း
  });
};

/**
 * ဖုန်းနံပါတ်ဖြင့် OTP Record ရှိမရှိ ရှာဖွေပေးသည့် Service Function
 * @param phone - ရှာဖွေလိုသော ဖုန်းနံပါတ်
 */
export const getOtpByPhone = async (phone: string) => {
  return await prisma.otp.findUnique({
    where: {
      phone: phone, // phone field ကို အခြေခံ၍ OTP Record ရှာခြင်း
    },
  });
};

/**
 * ရှိပြီးသား OTP Record ကို ပြင်ဆင်/Update လုပ်ပေးသည့် Service Function
 * @param phone - ပြင်ဆင်လိုသော OTP ပိုင်ရှင်၏ ဖုန်းနံပါတ်
 * @param otpData - ပြင်ဆင်မည့် အချက်အလက်များ (ဥပမာ- OTP အသစ်၊ Count သို့မဟုတ် Error အကြိမ်ရေ)
 */
export const updateOtp = async (phone: string, otpData: any) => {
  return await prisma.otp.update({
    where: {
      phone: phone, // schema.prisma တွင် phone ၌ @unique ပါဝင်ရန် လိုအပ်သည်
    },
    data: otpData, // Update လုပ်မည့် အချက်အလက်များကို ထည့်သွင်းခြင်း
  });
};

export const createUser = async (userData: any) => {
  return await prisma.user.create({
    data: userData, // User Record အသစ်ဆောက်ခြင်း
  });
};

export const updateUser = async (phone: string, userData: any) => {
  return await prisma.user.update({
    where: {
      phone: phone, // schema.prisma တွင် phone ၌ @unique ပါဝင်ရန် လိုအပ်သည်
    },
    data: userData, // Update လုပ်မည့် အချက်အလက်များကို ထည့်သွင်းခြင်း
  });
};

export const getUserById = async (id: number) => {
  return await prisma.user.findUnique({
    where: {
      id: id, // id field ကို အခြေခံ၍ Unique Record ရှာခြင်း
    },
  });
};