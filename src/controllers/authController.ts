import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import {
  getUserByPhone,
  createOtp,
  getOtpByPhone,
  updateOtp,
} from "../services/authService";
import { generateOTP, generateToken } from "../utils/generate";
import bcrypt from "bcrypt";
import moment from "moment";
import { checkOtpErrorIfSameDate, checkOtpRowExists } from "../utils/auth";

interface AppError extends Error {
  status?: number;
  code?: string;
}

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
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]+$/)
    .withMessage("Phone number must contain only numbers")
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone number must be between 9 and 15 digits"),

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        const error: AppError = new Error(firstError.msg);
        error.status = 400;
        error.code = "Error_Invalid";
        return next(error);
      }

      const rawPhone = req.body.phone ? String(req.body.phone).trim() : "";
      const phone = rawPhone.replace(/^(09|9)/, "");

      const user = await getUserByPhone(phone);
      checkUserExists(user);

      const otp = 123456; // Testing အတွက်
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp.toString(), salt);
      const Token = generateToken();

      const existingOtp = await getOtpByPhone(phone);
      let result;

      if (!existingOtp) {
        const otpData = {
          phone,
          otp: hashedOtp,
          rememberToken: Token,
          count: 1,
          error: 0,
        };
        result = await createOtp(otpData);
      } else {
        const lastOtpRequest = new Date(existingOtp.updatedAt).toDateString();
        const today = new Date().toDateString();
        const isSameDate = lastOtpRequest === today;

        checkOtpErrorIfSameDate(isSameDate, existingOtp.error);

        if (isSameDate) {
          if (existingOtp.count >= 3) {
            const error: any = new Error("OTP is allowed only 3 times per day");
            error.status = 405;
            error.code = "Error_OverLimit";
            return next(error);
          }

          const otpData = {
            otp: hashedOtp,
            rememberToken: Token,
            count: { increment: 1 },
            error: 0,
          };
          result = await updateOtp(existingOtp.phone, otpData);
        } else {
          const otpData = {
            otp: hashedOtp,
            rememberToken: Token,
            count: 1,
            error: 0,
          };
          result = await updateOtp(existingOtp.phone, otpData);
        }
      }

      res.status(200).json({
        success: true,
        phone: result.phone,
        otp: otp, // Testing အတွက် ပို့ပေးခြင်း
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

  body("token", "Invalid token").trim().notEmpty(),

  async (req: Request, res: Response, next: NextFunction) => {
    try {
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

      const user = await getUserByPhone(phone);
      checkUserExists(user);

      const existingOtp = await getOtpByPhone(phone);
      checkOtpRowExists(existingOtp);

      const lastOtpVerify = new Date(existingOtp!.updatedAt).toDateString();
      const today = new Date().toDateString();
      const isSameDate = lastOtpVerify === today;
      checkOtpErrorIfSameDate(isSameDate, existingOtp!.error);

      // Token စစ်ဆေးခြင်း
      if (existingOtp!.rememberToken !== token) {
        await updateOtp(existingOtp!.phone, { error: { increment: 1 } });
        const error: AppError = new Error("Invalid token");
        error.status = 400;
        return next(error);
      }

      // သက်တမ်းကုန်ဆုံးမှု စစ်ဆေးခြင်း (၂ မိနစ်)
      const isExpired = moment().diff(existingOtp?.updatedAt, "minutes") > 2;
      if (isExpired) {
        const error: AppError = new Error("OTP has expired");
        error.status = 400;
        error.code = "Error_OTP_Expired";
        return next(error);
      }

      // OTP မှန်မမှန် စစ်ဆေးခြင်း
      const isOtpValid = await bcrypt.compare(otp, existingOtp!.otp);
      if (!isOtpValid) {
        const errorData = isSameDate
          ? { error: { increment: 1 } }
          : { error: 1 };
        await updateOtp(existingOtp!.phone, errorData);

        const error: any = new Error("Invalid OTP");
        error.status = 400;
        error.code = "Error_Invalid_OTP";
        return next(error);
      }

      // အောင်မြင်ပါက Token အသစ်ထုတ်ပေးပြီး Save မည်
      const verifyToken = generateToken();
      const otpData = {
        rememberToken: verifyToken,
        error: 0,
        count: 1,
      };

      const result = await updateOtp(existingOtp!.phone, otpData);

      res.status(200).json({
        success: true,
        phone: result.phone,
        token: result.rememberToken, // ပြင်ဆင်ပြီး (result.verifyToken အစား)
        message: "Verify OTP success",
      });
    } catch (error) {
      next(error);
    }
  },
];

//Sending OTP --> Verify OTP --> Confirm Password --> New Account
export const confirmPassword = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 5, max: 12 }),
  body("password", "Password must be 8 digits.")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 8, max: 8 }),
  body("token", "Invalid token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
     const error: AppError = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    const { phone, password, token } = req.body;
    res.status(200).json({ message: "Confirm Password route" });
  },
];

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({ message: "Login route" });
};
