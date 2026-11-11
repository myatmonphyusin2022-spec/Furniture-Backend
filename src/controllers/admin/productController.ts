import { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { checkUserIfNotExist } from "../../utils/auth";
import { checkModelIfExists, checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import { getUserById } from "../../services/authService";
import ImageQueue from "../../jobs/queues/imageQueue";
import {
  PostArgs,
  createOnePost,
  deleteOnePost,
  getPostById,
  updateOnePost,
} from "../../services/postService";

import { unlink } from "fs/promises";
import path from "path";
import cacheQueue from "../../jobs/queues/cachQueue";
import { createOneProduct } from "../../services/porductService";

interface CustomRequest extends Request {
  userId?: number;
  user?: any;
  files?: any;
}
const removeFiles = async (
  originalFiles: string[],
  optimizedFiles: string[] | null,
) => {
  try {
    // Remove original files if they exist
    if (originalFiles && originalFiles.length > 0) {
      for (const originalFile of originalFiles) {
        const originalFilePath = path.join(
          __dirname,
          "../../..",
          "uploads/images",
          originalFile,
        );

        await unlink(originalFilePath).catch(() => {});
      }
    }

    // Remove optimized files if provided
    if (optimizedFiles && optimizedFiles.length > 0) {
      for (const optimizedFile of optimizedFiles) {
        const optimizedFilePath = path.join(
          __dirname,
          "../../..",
          "uploads/optimize",
          optimizedFile,
        );
        await unlink(optimizedFilePath).catch(() => {});
      }
    }
  } catch (error) {
    console.error(error);
  }
};

export const createProduct = [
  body("name", "Name is required").trim().notEmpty().escape(),
  body("description", "Description is required").trim().notEmpty().escape(),
  body("price", "Price is required.")
    .isFloat({ min: 0.1 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("discount", "Discount is required.")
    .isFloat({ min: 0 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "Inventory is required.").isInt({ min: 1 }),
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
      if (req.files && req.files.length > 0) {
        const orginalFiles = req.files.map((file: any) => file.filename);
        await removeFiles(orginalFiles, null);
      }
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const {
      name,
      description,
      price,
      discount,
      inventory,
      category,
      type,
      tags,
    } = req.body;

    checkUploadFile(req.files && req.files.length > 0);

    await Promise.all(
      req.files.map(async (file: any) => {
        const splitFileName = req.file?.filename.split(".")[0];
        return ImageQueue.add(
          "optimize-image",
          {
            filePath: file.Path,
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
      }),
    );

    const splitFileName = req.file?.filename.split(".")[0];
    const webpFileName = `${splitFileName?.[0]}-${Date.now()}.webp`;

    // If using memoryStorage, image.buffer is available.
    // If using diskStorage, you'd read from image.path instead.
const originalFileName = req.files.map((file:any )=>{
    path:file.filename
})
    const data: any = {
      name,
      description,
      price,
      discount,
      inventory: +inventory,
      category,
      type,
      tags,
      images:originalFileName,
    };

    const product = await createOneProduct(data);
    await cacheQueue.add(
      "invalidate-product-cache",
      {
        pattern: "products:*",
      },
      {
        jobId: `invalidate-${Date.now()}`,
        priority: 1,
      },
    );
    res
      .status(201)
      .json({ message: "Successfully created a post.", productId: product.id });
  },
];
