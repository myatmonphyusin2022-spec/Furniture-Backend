import { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator"; // body အစား query သို့မဟုတ် check သုံးပါ
import { errorCode } from "../../config/errorCode";
import { title } from "node:process";
import { authorise } from "../../middlewares/authorise";
import { getUserById } from "../../services/authService";
import { checkUserIfNotExist } from "../../utils/auth";

interface CustomRequest extends Request {
  userId?: number;
  file?: any;
}

export const changeLanguage = [
  // 1. Validation for query language input
  query("lng", "Invalid language format")
    .trim()
    .notEmpty()
    .matches(/^[a-z]+$/)
    .isLength({ min: 2, max: 3 }),

  async (
    req: CustomRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const errors = validationResult(req).array({ onlyFirstError: true });
      if (errors.length > 0) {
        const error: any = new Error(errors[0].msg);
        error.status = 400;
        error.code = errorCode.invalid;
        return next(error);
      }

      const lng = req.query.lng || req.body.lng;
      res.cookie("i18next", lng);

      res.status(200).json({
        message: req.t("changeLan", { lang: lng }),
      });
    } catch (error) {
      next(error);
    }
  },
];
export const testPermission = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  const user = await getUserById(userId!);
  checkUserIfNotExist(user);
  const info: any = {
    title: "Testing Permission",
  };
  const can = authorise(true, user!.role, "AUTHOR");
  if (can) {
    info.content = "You have pemission to read this line";
  }
  // if user.role === "AUTHOR"
  // content = "You are an author"
  res.status(200).json({ info });
};
export const uploadProfile = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  const image = req.file;
  const user = await getUserById(userId!);
  checkUserIfNotExist(user);
  res.status(200).json({ message: "Profile picture uploaded successfully." });
};
