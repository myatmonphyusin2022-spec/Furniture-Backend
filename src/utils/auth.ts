export const checkUserExists = (user: any) => {
  if (user) {
    const error: any = new Error("Phone number already exists");
    error.status = 409;
    error.code = "Error_already_exists";
    throw error;
  }
};

export const checkOtpErrorIfSameDate = (
  isSameDate: boolean,
  errorCount: number,
) => {
  if (isSameDate && errorCount === 5) {
    const error: any = new Error(
      "OTP is wrong 5 times, please try again tomorrow",
    );
    error.status = 401;
    error.code = "Error_OverLimit";
    throw error;
  }
};

export const checkOtpRowExists = (otpRow: any) => {
  if (!otpRow) {
    const error: any = new Error("Phone number is incorrect");
    error.status = 404;
    error.code = "Error_NotFound";
    throw error;
  }
};
