import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { unlink as fsUnlink } from "fs/promises";
import path from "path";

import { errorCode } from "../../config/errorCode";
import { checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import ImageQueue from "../../jobs/queues/imageQueue";
import { createOneProduct } from "../../services/porductService";
import cacheQueue from "../../jobs/queues/cachQueue";

interface CustomRequest extends Request {
  userId?: number;
  user?: any;
  files?: any[];
}

/**
 * Attempts to unlink a file, retrying on Windows EPERM/EBUSY.
 */
async function safeUnlink(
  filePath: string,
  retries = 3,
  delayMs = 100,
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fsUnlink(filePath);
      return;
    } catch (err: any) {
      if ((err.code === "EPERM" || err.code === "EBUSY") && attempt < retries) {
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }
      throw err;
    }
  }
}

const removeFiles = async (
  originalFiles: string[],
  optimizedFiles: string[] | null,
) => {
  try {
    for (const originalFile of originalFiles) {
      const originalFilePath = path.join(
        __dirname,
        "../../..",
        "uploads/images", // Fixed: Removed leading slash
        originalFile,
      );
      await safeUnlink(originalFilePath).catch(() => {});
    }

    if (optimizedFiles) {
      for (const optimizedFile of optimizedFiles) {
        const optimizedFilePath = path.join(
          __dirname,
          "../../..",
          "uploads/optimize", // Fixed: Removed leading slash
          optimizedFile,
        );
        await safeUnlink(optimizedFilePath).catch(() => {});
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const createProduct = [
  body("name", "Name is required.").trim().notEmpty().escape(),
  body("description", "Description is required.").trim().notEmpty().escape(),
  body("price", "Price is required.")
    .isFloat({ min: 0.1 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("discount", "Discount is required.") // Fixed message typo
    .isFloat({ min: 0 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "Inventory is required.").isInt({ min: 1 }), // Fixed message typo
  body("category", "Category is required.").trim().notEmpty().escape(),
  body("type", "Type is required.").trim().notEmpty().escape(),
  body("tags", "Tag is invalid.")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      }
      return value;
    }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });

    // Safely cast files array if present
    const files = (req.files as any[]) || [];

    if (errors.length > 0) {
      if (files.length > 0) {
        const originalFiles = files.map((file: any) => file.filename);
        await removeFiles(originalFiles, null);
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

    checkUploadFile(files.length > 0);

    await Promise.all(
      files.map(async (file: any) => {
        const splitFileName = file.filename.split(".")[0];
        return ImageQueue.add(
          "optimize-image",
          {
            filePath: file.path,
            fileName: `${splitFileName}.webp`,
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

    // Matches your Prisma service image property structure (filename)
    const originalFileNames = files.map((file: any) => ({
      filename: file.filename,
    }));

    const data: any = {
      name,
      description,
      price,
      discount,
      inventory: +inventory,
      category,
      type,
      tags,
      images: originalFileNames,
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

    res.status(201).json({
      message: "Successfully created a product.", // Fixed from "post" to "product"
      productId: product.id,
    });
  },
];
