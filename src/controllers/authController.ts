import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { getUserByPhone, createOtp } from "../services/authServices";
import { generateOTP, generateToken } from "../utils/generate";

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

      // Safe access for phone input
      const rawPhone = req.body.phone ? String(req.body.phone).trim() : "";
      const phone = rawPhone.replace(/^(09|9)/, "");

      const user = await getUserByPhone(phone);
      checkUserExists(user);

      const otp = generateOTP();
      const Token = generateToken();

      const otpData = {
        phone,
        otp: String(otp), // 🟢 Schema mrr string yy htr
        rememberToken: Token,
        count: 1,
      };

      const result = await createOtp(otpData);

      res.status(200).json({
        success: true,
        phone: result.phone,
        otp: result.otp,
        token: result.rememberToken,
        message: `We are sending OTP to 09${result.phone}`,
      });
    } catch (error) {
      next(error);
    }
  },
];

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({ message: "Verify OTP route" });
};

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
