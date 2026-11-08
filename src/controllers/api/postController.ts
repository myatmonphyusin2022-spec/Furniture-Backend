import { Request, Response, NextFunction } from "express";
import { param, query, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { checkUserIfNotExist } from "../../utils/auth";
import { createError } from "../../utils/error";
import { getUserById } from "../../services/authService";
import { getPostList, getPostWithRelations } from "../../services/postService";

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
    const post = await getPostWithRelations(+postId);

    res.status(200).json({ message: "Post Detail", post });
  },
];
// Offset Pagination
export const getPostsByPagination = [
  query("page", "Page number must be a positive integer")
    .isInt({ gt: 0 })
    .optional(),
  query("limit", "Limit must be a positive integer")
    .isInt({ gt: 2 })
    .optional(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const page = req.query.page || 1;
    const limit = req.query.limit || 3;

    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExist(user);

    const skip = (+page - 1) * +limit; //2-1 *5
    const options = {
      skip,
      take: +limit + 1,
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        updatedAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy:{
        updatedAt:"desc",
      }
    };
const posts = await getPostList(options);

const hasNextPage = posts.length > +limit;
let nextPage = null;
const previousPage = +page !== 1 ? +page-1 : null;
if(hasNextPage){
  posts.pop();
  nextPage = +page + 1;
}
    res.status(200).json({ message: "Get All Posts.", currentPage: page, hasNextPage, nextPage, previousPage, posts });
  },
];

export const getInfinitePostsByPagination = [
  query("cursor", "Cursor must be a valid identifier").optional(),
  query("limit", "Limit must be a positive integer")
    .isInt({ gt: 0 })
    .optional(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const { cursor, limit } = req.query;
    res.status(200).json({ message: "Infinite Pagination OK", cursor, limit });
  },
];
