import { Request, Response, NextFunction } from "express";
import { param, query, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { checkUserIfNotExist } from "../../utils/auth";
import { createError } from "../../utils/error";
import { getUserById } from "../../services/authService";
import { getOrSetCache } from "../../utils/cache";
import { checkModelIfExists } from "../../utils/check";
import {
  getProductsList,
  getProductWithRelations,
} from "../../services/productService";

interface CustomRequest extends Request {
  userId?: number;
}

export const getProduct = [
  param("id", "Product ID is required").isInt({ gt: 0 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const productId = req.params.id;
    const userId = req.userId;

    const user = await getUserById(userId!);
    checkUserIfNotExist(user);

    const cacheKey = `products-v2:${productId}:${JSON.stringify(req.query)}`;
    const product = await getOrSetCache(cacheKey, async () => {
      return await getProductWithRelations(+productId);
    });

    checkModelIfExists(product);
    res.status(200).json({
      message: "Product Detail",
      product,
    });
  },
];

export const getProductsByPagination = [
  query("page", "Page number must be a positive integer")
    .isInt({ gt: 0 })
    .optional(),
  query("limit", "Limit must be a positive integer")
    .isInt({ gt: 4 })
    .optional(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const lastCursor = req.query.cursor;
    const limit = req.query.limit || 5;
    const category = req.query.category;
    const type = req.query.type;

    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExist(user);

    let categoryList: number[] = [];
    let typeList: number[] = [];

    if (category) {
      categoryList = category
        .toString()
        .split(",")
        .map((c) => Number(c))
        .filter((c) => !isNaN(c) && c > 0);
    }

    if (type) {
      typeList = type
        .toString()
        .split(",")
        .map((t) => Number(t))
        .filter((t) => !isNaN(t) && t > 0);
    }
    console.log("categoryList -----", categoryList);
    console.log("typeList -----", typeList);

    const where = {
      AND: [
        categoryList.length > 0 ? { categoryId: { in: categoryList } } : {},
        typeList.length > 0 ? { typeId: { in: typeList } } : {},
      ],
      // OR: [
      //   categoryList.length > 0
      //     ? { categoryId: { in: categoryList } }
      //     : undefined,
      //   typeList.length > 0 ? { typeId: { in: typeList } } : undefined,
      // ].filter(Boolean),
    };

    const options = {
      where,
      take: +limit + 1,
      skip: lastCursor ? 1 : 0,
      cursor: lastCursor ? { id: +lastCursor } : undefined,
      select: {
        id: true,
        name: true,
        price: true,
        discount: true,
        status: true,
        images: {
          select: {
            id: true,
            path: true,
          },
          take: 1, // Limit to the 1st image
        },
      },
      orderBy: {
        id: "desc",
      },
    };

    // Print out the exact Prisma query options to help debug empty lists
    console.log("Prisma Options:", JSON.stringify(options, null, 2));

    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const products = await getOrSetCache(cacheKey, async () => {
      return await getProductsList(options);
    });

    const hasNextPage = products.length > +limit;
    if (hasNextPage) {
      products.pop();
    }

    const newCursor =
      products.length > 0 ? products[products.length - 1].id : null;

    res.status(200).json({
      message: "Get All Infinite Products",
      hasNextPage,
      newCursor,
      products,
    });
  },
];
