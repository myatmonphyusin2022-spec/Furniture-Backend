// src/utils/auth.ts

interface AppError extends Error {
  status?: number;
  code?: string;
}

export const checkUserExists = (user: any): void => {
  if (user) {
    const error: AppError = new Error("Phone number already exists");
    error.status = 409;
    error.code = "Error_already_exists";
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
    error.code = "Error_OverLimit";
    throw error;
  }
};

export const checkOtpRowExists = (otpRow: any): void => {
  if (!otpRow) {
    const error: AppError = new Error("Phone number is incorrect");
    error.status = 404;
    error.code = "Error_NotFound";
    throw error;
  }
};
