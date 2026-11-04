import { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { checkUserIfNotExist } from "../../utils/auth";
import { checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import { getUserById } from "../../services/authService";
import ImageQueue from "../../jobs/queues/imageQueue";
import { PostArgs, createOnePost } from "../../services/postService";
import sanitizeHtml from "sanitize-html";
import { unlink } from "fs/promises";
import path from "path";

interface CustomRequest extends Request {
  userId?: number;
}

const removeFiles = async (
  originalFile: string | null,
  optimizedFile: string | null,
) => {
  try {
    if (originalFile) {
      const originalFilePath = path.join(
        __dirname,
        "../../..",
        "uploads/images",
        originalFile,
      );
      await unlink(originalFilePath).catch(() => {});
    }

    if (optimizedFile) {
      const optimizedFilePath = path.join(
        __dirname,
        "../../..",
        "uploads/optimize",
        optimizedFile,
      );
      await unlink(optimizedFilePath).catch(() => {});
    }
  } catch (error) {
    console.log(error);
  }
};

export const createPost = [
  body("title", "Title is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
  body("category", "Category is required").trim().notEmpty().escape(),
  body("type", "Type is required").trim().notEmpty().escape(),
  body("tags", "Tag is invalid")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      }
    }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      if (req.file) {
        await removeFiles(req.file.filename, null);
      }
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { title, content, body, category, type, tags } = req.body;
    const userId = req.userId;
    const image = req.file;
    checkUploadFile(image);
    const user = await getUserById(userId!);
    if (!user) {
      if (req.file) {
        await removeFiles(req.file.filename, null);
      }
      return next(
        createError(
          "This user is not registered",
          401,
          errorCode.unauthenticated,
        ),
      );
    }

    const splitFileName = image?.originalname.split(".");
    const webpFileName = `${splitFileName?.[0]}-${Date.now()}.webp`;

    // If using memoryStorage, image.buffer is available.
    // If using diskStorage, you'd read from image.path instead.
    await ImageQueue.add(
      "optimize-image",
      {
        buffer: image?.buffer,
        fileName: webpFileName,
        width: 835,
        height: 577,
        quality: 100,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    const data: PostArgs = {
      title,
      content,
      body,
      image: image!.filename || image!.originalname, // Fallback depending on storage strategy
      authorId: user!.id,
      category,
      type,
      tags,
    };

    const post = await createOnePost(data);
    res
      .status(201)
      .json({ message: "Successfully created a post.", postId: post.id });
  },
];

export const updatePost = [
  // TODO: Update validators for updating a post instead of phone number
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    res.status(200).json({ message: "Post updated successfully" });
  },
];

export const deletePost = [
  // TODO: Add proper post ID validation params/body checks here
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    res.status(200).json({ message: "Post deleted successfully" });
  },
];
