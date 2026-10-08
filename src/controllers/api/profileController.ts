import { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator"; // body အစား query သို့မဟုတ် check သုံးပါ
import { errorCode } from "../../config/errorCode";

interface CustomRequest extends Request {
  userId?: number;
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
