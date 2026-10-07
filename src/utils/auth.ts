// src/utils/auth.ts
import { errorCode } from "../config/errorCode";

interface AppError extends Error {
  status?: number;
  code?: string;
}

export const checkUserExists = (user: unknown): void => {
  if (user) {
    const error: AppError = new Error("Phone number already exists");
    error.status = 409;
    error.code = errorCode.userExist;
    throw error;
  }
};

export const checkOtpErrorIfSameDate = (
  isSameData: boolean,
  errorCount: number,
): void => {
  if (isSameData && errorCount === 5) {
    const error: AppError = new Error(
      "OTP is wrong 5 times, please try again tomorrow",
    );
    error.status = 401;
    error.code = errorCode.overlimit;
    throw error;
  }
};

export const checkOtpRowExists = (otpRow: unknown): void => {
  if (!otpRow) {
    const error: AppError = new Error("Phone number is incorrect");
    error.status = 404;
    error.code = errorCode.notFound;
    throw error;
  }
};

export const checkUserIfNotExist = (user: unknown): void => {
  if (!user) {
    const error: AppError = new Error("This phone has not registered yet.");
    error.status = 401;
    error.code = errorCode.unauthorized;
    throw error;
  }
};