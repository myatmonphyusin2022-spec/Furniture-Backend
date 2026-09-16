import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import {
  getUserByPhone,
  createOtp,
  getOtpByPhone,
  updateOtp,
} from "../services/authServices";
import { generateOTP, generateToken } from "../utils/generate";
import bcrypt from "bcrypt";
import { checkOtpErrorIfSameDate, checkOtpRowExists } from "../utils/auth";

// AppError interface - Error handling အတွက် Custom error type သတ်မှတ်ခြင်း
interface AppError extends Error {
  status?: number;
  code?: string;
}

// User ရှိပြီးသား ဟုတ်မဟုတ် စစ်ဆေးပေးသည့် helper function
const checkUserExists = (user: any) => {
  if (user) {
    const error: AppError = new Error("Phone number already exists");
    error.status = 409;
    error.code = "Error_already_exists";
    throw error;
  }
};

// ==========================================
// 1. REGISTER CONTROLLER (OTP တောင်းဆိုခြင်း)
// ==========================================
export const register = [
  // Validation Rules (ဖုန်းနံပါတ် စစ်ဆေးခြင်း)
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]+$/)
    .withMessage("Phone number must contain only numbers")
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone number must be between 9 and 15 digits"),

  // Request Handler (OTP ထုတ်ပေးပြီး Database သို့ သိမ်းဆည်းခြင်း)
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validation Error ရှိမရှိ စစ်ဆေးခြင်း
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        const error: AppError = new Error(firstError.msg);
        error.status = 400;
        error.code = "Error_Invalid";
        return next(error);
      }

      // 2. ဖုန်းနံပါတ် ပုံစံညှိခြင်း (09 သို့မဟုတ် 9 စတာတွေကို ဖြတ်ထုတ်ခြင်း)
      const rawPhone = req.body.phone ? String(req.body.phone).trim() : "";
      const phone = rawPhone.replace(/^(09|9)/, "");

      // 3. အကောင့်ရှိပြီးသားလား စစ်ဆေးခြင်း
      const user = await getUserByPhone(phone);
      checkUserExists(user);

      // 4. OTP နှင့် Token ထုတ်ယူခြင်း
      const otp = 123456; // Testing အတွက် Fixed စမ်းထားခြင်း (Production တွင် generateOTP() သုံးရမည်)

      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp.toString(), salt); // OTP ကို bcrypt ဖြင့် Hash လုပ်ခြင်း
      const Token = generateToken(); // Verification Token ထုတ်ယူခြင်း

      // 5. ဖုန်းနံပါတ်အတွက် OTP record ရှိပြီးသားလား စစ်ဆေးခြင်း
      const existingOtp = await getOtpByPhone(phone);
      let result;

      if (!existingOtp) {
        // OTP မရှိသေးပါက Record အသစ်ဆောက်ခြင်း
        const otpData = {
          phone,
          otp: hashedOtp,
          rememberToken: Token,
          count: 1,
          error: 0,
        };

        result = await createOtp(otpData);
      } else {
        // OTP ရှိပြီးသားဆိုပါက ရက်စွဲနှိုင်းယှဉ်ပြီး တောင်းဆိုသည့် အကြိမ်ရေ Limit စစ်ခြင်း
        const lastOtpRequest = new Date(existingOtp.updatedAt).toDateString();
        const today = new Date().toDateString();
        const isSameDate = lastOtpRequest === today;

        // ဒီနေ့အတွက် အမှားအရေအတွက်များနေလား စစ်ဆေးခြင်း
        checkOtpErrorIfSameDate(isSameDate, existingOtp.error);

        if (isSameDate) {
          // တနေ့လျှင် ၃ ကြိမ်ထက်ပိုတောင်းပါက တားမြစ်ခြင်း (Limit 3 per day)
          if (existingOtp.count >= 3) {
            const error: any = new Error("OTP is allowed only 3 times per day");
            error.status = 405;
            error.code = "Error_OverLimit";
            return next(error);
          }

          // ဒီနေ့အတိုင်းဖြစ်ပါက Count ကို 1 တိုးပြီး Update လုပ်ခြင်း
          const otpData = {
            otp: hashedOtp,
            rememberToken: Token,
            count: {
              increment: 1,
            },
            error: 0,
          };
          result = await updateOtp(existingOtp.phone, otpData);
        } else {
          // ရက်အသစ်ဖြစ်ပါက Count ကို 1 ကပြန်စခြင်း
          const otpData = {
            otp: hashedOtp,
            rememberToken: Token,
            count: 1,
            error: 0,
          };
          result = await updateOtp(existingOtp.phone, otpData);
        }
      }

      // 6. Response ပြန်လည်ပေးပို့ခြင်း
      res.status(200).json({
        success: true,
        phone: result.phone,
        otp: result.otp,
        token: result.rememberToken,
        message: `We are sending OTP to ${rawPhone}`,
      });
    } catch (error) {
      next(error);
    }
  },
];

// ==========================================
// 2. VERIFY OTP CONTROLLER (OTP စစ်ဆေးခြင်း)
// ==========================================
export const verifyOtp = [
  // Validation Rules (Phone, OTP, Token စစ်ဆေးခြင်း)
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]+$/)
    .withMessage("Phone number must contain only numbers")
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone number must be between 9 and 15 digits"),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .matches(/^[0-9]+$/)
    .withMessage("OTP must contain only numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits long"),

  body("token", "Invalid token").trim().notEmpty().escape(),

  // Verification Handler
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Input Validation Errors စစ်ဆေးခြင်း
      const errors = validationResult(req).array({ onlyFirstError: true });
      if (errors.length > 0) {
        const firstError = errors[0];
        const error: AppError = new Error(firstError.msg);
        error.status = 400;
        return next(error);
      }

      const rawPhone = req.body.phone ? String(req.body.phone).trim() : "";
      const phone = rawPhone.replace(/^(09|9)/, "");
      const { otp, token } = req.body;

      // 2. User ရှိပြီးသားဖြစ်နေပါက သတိပေးခြင်း
      const user = await getUserByPhone(phone);
      checkUserExists(user);

      // 3. Database မှ OTP Record ကိုရှာခြင်း
      const existingOtp = await getOtpByPhone(phone);
      checkOtpRowExists(existingOtp);

      // 4. အမှားအကြိမ်ရေ အကန့်အသတ် စစ်ဆေးခြင်း
      const lastOtpVerify = new Date(existingOtp!.updatedAt).toDateString();
      const today = new Date().toDateString();
      const isSameDate = lastOtpVerify === today;
      checkOtpErrorIfSameDate(isSameDate, existingOtp!.error);

      // 5. Verification Token မှန်မမှန် စစ်ဆေးခြင်း
      if (existingOtp!.rememberToken !== token) {
        // Token မှားပါက Error count ကို 1 တိုးမည်
        await updateOtp(existingOtp!.phone, {
          error: { increment: 1 },
        });
        const error: AppError = new Error("Invalid token");
        error.status = 400;
        return next(error);
      }

      // 6. User ရိုက်ထည့်လိုက်သော OTP ကို Hash လုပ်ထားသော OTP နှင့် bcrypt.compare ဖြင့် စစ်ဆေးခြင်း
      const isOtpValid = await bcrypt.compare(otp, existingOtp!.otp);
      if (!isOtpValid) {
        // OTP မှားပါက Error count ကို 1 တိုးမည်
        await updateOtp(existingOtp!.phone, {
          error: { increment: 1 },
        });
        const error: AppError = new Error("Invalid OTP");
        error.status = 400;
        return next(error);
      }

      // 7. OTP မှန်ကန်ပါက အောင်မြင်ကြောင်း Response ပြန်ခြင်း
      res.status(200).json({
        success: true,
        message: "Verify OTP success",
      });
    } catch (error) {
      next(error);
    }
  },
];

// ==========================================
// 3. OTHER CONTROLLERS (Placeholders)
// ==========================================

// စကားဝှက် အတည်ပြုသည့် Route (လုပ်ဆောင်ချက် ဖြည့်ရန်ကျန်သေးသည်)
export const confirmPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({ message: "Confirm Password route" });
};

// Login ဝင်သည့် Route (လုပ်ဆောင်ချက် ဖြည့်ရန်ကျန်သေးသည်)
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({ message: "Login route" });
};
