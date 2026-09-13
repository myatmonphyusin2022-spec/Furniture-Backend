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

export const register = [
  // Validation Rules
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]+$/)
    .withMessage("Phone number must contain only numbers")
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone number must be between 9 and 15 digits"),

  // Request Handler
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

      const otp = 123456; // For testing purposes, replace with generateOTP() in production

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
            count: {
              increment: 1,
            },
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
        otp: result.otp,
        token: result.rememberToken,
        message: `We are sending OTP to ${rawPhone}`,
      });
    } catch (error) {
      next(error);
    }
  },
];

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

  body("token", "Invalid token").trim().notEmpty().escape(),

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

      // Check Token
      if (existingOtp!.rememberToken !== token) {
        await updateOtp(existingOtp!.phone, {
          error: { increment: 1 },
        });
        const error: AppError = new Error("Invalid token");
        error.status = 400;
        return next(error);
      }

      // Check OTP using bcrypt.compare
      const isOtpValid = await bcrypt.compare(otp, existingOtp!.otp);
      if (!isOtpValid) {
        await updateOtp(existingOtp!.phone, {
          error: { increment: 1 },
        });
        const error: AppError = new Error("Invalid OTP");
        error.status = 400;
        return next(error);
      }

      res.status(200).json({
        success: true,
        message: "Verify OTP success",
      });
    } catch (error) {
      next(error);
    }
  },
];

export const confirmPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({ message: "Confirm Password route" });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({ message: "Login route" });
};
