import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import {
  getUserByPhone,
  createOtp,
  createUser,
  getOtpByPhone,
  updateOtp,
  updateUser,
} from "../services/authService";
import { generateToken } from "../utils/generate";
import bcrypt from "bcrypt";
import moment from "moment";
import { checkOtpErrorIfSameDate, checkOtpRowExists } from "../utils/auth";

interface AppError extends Error {
  status?: number;
  code?: string;
}
const jwt = require("jsonwebtoken");
const checkUserExists = (user: any) => {
  if (user) {
    const error: AppError = new Error("Phone number already exists");
    error.status = 409;
    error.code = "Error_already_exists";
    throw error;
  }
};

// ==========================================
// 1. REGISTER CONTROLLER
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

  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const otp = 123456; // Test OTP
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp.toString(), salt);
      const Token = generateToken();

      const existingOtp = await getOtpByPhone(phone);
      let result;

      if (!existingOtp) {
        result = await createOtp({
          phone,
          otp: hashedOtp,
          rememberToken: Token,
          count: 1,
          error: 0,
        });
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

          result = await updateOtp(existingOtp.phone, {
            otp: hashedOtp,
            rememberToken: Token,
            count: { increment: 1 },
            error: 0,
          });
        } else {
          result = await updateOtp(existingOtp.phone, {
            otp: hashedOtp,
            rememberToken: Token,
            count: 1,
            error: 0,
          });
        }
      }

      res.status(200).json({
        success: true,
        phone: result.phone,
        otp: otp,
        token: result.rememberToken,
        message: `We are sending OTP to ${rawPhone}`,
      });
    } catch (error) {
      next(error);
    }
  },
];

// ==========================================
// 2. VERIFY OTP CONTROLLER
// ==========================================
export const verifyOtp = [
  body("phone")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 9, max: 15 }),
  body("otp")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 6, max: 6 }),
  body("token", "Invalid token").trim().notEmpty(),

  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req).array({ onlyFirstError: true });
      if (errors.length > 0) {
        const error: AppError = new Error(errors[0].msg);
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

      // Verify token match
      if (existingOtp!.rememberToken !== token) {
        await updateOtp(existingOtp!.phone, { error: { increment: 1 } });
        const error: AppError = new Error("Invalid token");
        error.status = 400;
        return next(error);
      }

      // Check 2-min expiry safely using moment
      const isExpired =
        moment().diff(moment(existingOtp?.updatedAt), "minutes") > 2;
      if (isExpired) {
        const error: AppError = new Error("OTP has expired");
        error.status = 400;
        error.code = "Error_OTP_Expired";
        return next(error);
      }

      // Check OTP validity
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

      // Generate new token for password step
      const verifyToken = generateToken();
      const result = await updateOtp(existingOtp!.phone, {
        rememberToken: verifyToken,
        error: 0,
        count: 1,
      });

      res.status(200).json({
        success: true,
        phone: result.phone,
        token: result.rememberToken,
        message: "Verify OTP success",
      });
    } catch (error) {
      next(error);
    }
  },
];

// ==========================================
// 3. CONFIRM PASSWORD CONTROLLER
// ==========================================
export const confirmPassword = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 9, max: 15 }),
  body("password", "Password must be 8 digits.")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 8, max: 8 }),
  body("token", "Invalid token").trim().notEmpty().escape(),

  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req).array({ onlyFirstError: true });
      if (errors.length > 0) {
        const error: AppError = new Error(errors[0].msg);
        error.status = 400;
        error.code = "Error_Invalid";
        return next(error);
      }

      const rawPhone = req.body.phone ? String(req.body.phone).trim() : "";
      const phone = rawPhone.replace(/^(09|9)/, "");
      const { password, token } = req.body;

      const user = await getUserByPhone(phone);
      checkUserExists(user);

      const existingOtp = await getOtpByPhone(phone);
      checkOtpRowExists(existingOtp);

      // Security check for attack attempt
      if (existingOtp?.error === 5) {
        const error: AppError = new Error("This request may be an attack.");
        error.status = 400;
        error.code = "Error_Bad_Request";
        return next(error);
      }

      // Verify token match
      if (existingOtp?.rememberToken !== token) {
        await updateOtp(existingOtp!.phone, { error: 5 });
        const error: AppError = new Error("Invalid token");
        error.status = 400;
        error.code = "Error_Invalid_Token";
        return next(error);
      }

      // Check 10-min expiry window safely using moment
      const isExpired =
        moment().diff(moment(existingOtp?.updatedAt), "minutes") > 10;
      if (isExpired) {
        const error: AppError = new Error(
          "Your account has been expired, pls try again.",
        );
        error.status = 403;
        error.code = "Error_Expired";
        return next(error);
      }

      // Hash password and create user
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      const newUser = await createUser({
        phone,
        password: hashPassword,
        randToken: "I will replace Refresh Token soon", // ✅ Fixed: matches Prisma schema
      });

      // Generate JWT Access & Refresh tokens
      const accessToken = jwt.sign(
        { id: newUser.id },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: 60 * 15 }, // 15 mins
      );
      const refreshToken = jwt.sign(
        { id: newUser.id, phone: newUser.phone },
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: "30d" }, // 30 days
      );

      await updateUser(newUser.phone, { randToken: refreshToken }); // ✅ Fixed

      // Fixed sameSite invalid value ("string" -> "lax")
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        userId: newUser.id,
      });
    } catch (error) {
      next(error);
    }
  },
];
