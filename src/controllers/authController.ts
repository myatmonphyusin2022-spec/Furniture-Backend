import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { getUserByPhone } from "../services/authServices";

const checkUserExists = (user: any) => {
  if (user) {
    const error: any = new Error("Phone number already exists");
    error.status = 409;
    error.code = "Error_already_exists";
    throw error;
  }
};

export const register = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    // ရှေ့ဆုံး '0' ဖြုတ်လိုက်ပါက 9 လုံး ရှိနိုင်သဖြင့် min ကို 9 သို့ ပြောင်းထားပါသည်
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone number must be between 9 and 15 digits"),

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req).array({
        onlyFirstError: true,
      });

      if (errors.length > 0) {
        const error: any = new Error(errors[0].msg);
        error.status = 400;
        error.code = "Error_Invalid";
        return next(error);
      }

      const phone = req.body.phone.trim().replace(/^(09|9)/, "");

      const user = await getUserByPhone(phone);

      checkUserExists(user);

      res.status(200).json({
        message: phone, // Postman တွင် 448024137 ပေါ်လာမည်ဖြစ်သည်
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
  res.status(200).json({
    message: "Verify OTP route",
  });
};

export const confirmPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({
    message: "Confirm Password route",
  });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({
    message: "Login route",
  });
};
