import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { checkUserIfNotExist } from "../../utils/auth";
import { checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import { getUserById } from "../../services/authService";
import { getPostById } from "../../services/postService";
interface CustomRequest extends Request {
  userId?: number;
}
export const getPost = [
  param("id", "Post ID is required").isInt({ gt: 0 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const postId = req.params.id;
    const userId = req.userId;
    
    const user = await getUserById(userId!);
    checkUserIfNotExist(user);
    const post = await getPostById(+postId);
    res.status(200).json({ message: "OK", post });
  },
];
export const getPostsByPagination = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const { phone, password, token } = req.body;
    res.status(200).json({ message: "OK" });
  },
];

export const getInfinitePostsByPagination = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const { phone, password, token } = req.body;
    res.status(200).json({ message: "OK" });
  },
];
