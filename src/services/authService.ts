import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// ==========================================
// 1. DATABASE CONNECTION SETUP
// ==========================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

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
      phone: phone,
    },
  });
};

/**
 * OTP Record အသစ် ဖန်တီးပေးသည့် Service Function
 * @param otpData - Database ထဲသို့ သိမ်းဆည်းမည့် OTP အချက်အလက်များ
 */
export const createOtp = async (otpData: any) => {
  return await prisma.otp.create({
    data: otpData,
  });
};

/**
 * ဖုန်းနံပါတ်ဖြင့် OTP Record ရှိမရှိ ရှာဖွေပေးသည့် Service Function
 * @param phone - ရှာဖွေလိုသော ဖုန်းနံပါတ်
 */
export const getOtpByPhone = async (phone: string) => {
  return await prisma.otp.findUnique({
    where: {
      phone: phone,
    },
  });
};

/**
 * ရှိပြီးသား OTP Record ကို ပြင်ဆင်/Update လုပ်ပေးသည့် Service Function
 * @param phone - ပြင်ဆင်လိုသော OTP ပိုင်ရှင်၏ ဖုန်းနံပါတ်
 * @param otpData - ပြင်ဆင်မည့် အချက်အလက်များ
 */
export const updateOtp = async (identifier: string | number, otpData: any) => {
  // Check if identifier is an ID (number/string ID) or a phone string
  // If your database uses a numeric auto-increment ID or string UUID for id:
  const isId =
    typeof identifier === "number" ||
    (typeof identifier === "string" && identifier.length > 12);

  if (isId) {
    // If we have an existing ID, update by id
    return await prisma.otp.update({
      where: { id: Number(identifier) },
      data: otpData,
    });
  } else {
    // Otherwise, use upsert based on the phone number
    const phoneStr = String(identifier);
    return await prisma.otp.upsert({
      where: { phone: phoneStr },
      update: otpData,
      create: {
        phone: phoneStr,
        otp: otpData.otp || "",
        rememberToken: otpData.rememberToken || "",
        count: otpData.count || 1,
        error: otpData.error || 0,
      },
    });
  }
};

/**
 * User အသစ် ဖန်တီးပေးသည့် Service Function
 * @param userData - သိမ်းဆည်းမည့် User အချက်အလက်များ
 */
export const createUser = async (userData: any) => {
  return await prisma.user.create({
    data: userData,
  });
};

/**
 * User ၏ ဖုန်းနံပါတ် သို့မဟုတ် ID ဖြင့် User အချက်အလက်များကို Update လုပ်ပေးသည့် Service Function
 * @param phoneOrId - ပြင်ဆင်လိုသော User ၏ ဖုန်းနံပါတ် (string) သို့မဟုတ် ID (number)
 * @param userData - Update လုပ်မည့် အချက်အလက်များ
 */
export const updateUser = async (phoneOrId: string | number, userData: any) => {
  const isPhone = typeof phoneOrId === "string";
  return await prisma.user.update({
    where: isPhone
      ? { phone: phoneOrId as string }
      : { id: phoneOrId as number },
    data: userData,
  });
};

/**
 * ID ဖြင့် User ကို ရှာဖွေပေးသည့် Service Function
 * @param id - ရှာဖွေလိုသော User ၏ ID
 */
export const getUserById = async (id: number) => {
  return await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
};
