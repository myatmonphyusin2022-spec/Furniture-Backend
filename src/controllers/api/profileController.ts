import { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator"; // body အစား query သို့မဟုတ် check သုံးပါ
import { unlink } from "node:fs/promises";
import path from "node:path";

import { errorCode } from "../../config/errorCode";
import { title } from "node:process";
import { authorise } from "../../middlewares/authorise";
import { getUserById, updateUser } from "../../services/authService";
import { checkUserIfNotExist } from "../../utils/auth";
import { error } from "node:console";
import { checkUploadFile } from "../../utils/check";
import sharp from "sharp";
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

  console.log("Image-----", image);

  // const filePath = image!.path;
  // const filePath = image!.path.replace("\\","/");
  const fileName = image!.filename;
  if (user?.image) {
    try {
      const filePath = path.join(
        __dirname,
        "../../..",
        "/uploads/images",
        user!.image!,
      );
      await unlink(filePath);
    } catch (error) {
      console.log(error);
    }
  }

  const userData = {
    image: fileName,
  };
  await updateUser(user?.id!, userData);

  res.status(200).json({
    message: "Profile picture uploaded successfully.",
    image: fileName,
  });
};
export const getMyPhoto = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  const file = path.join(
    __dirname,
    "../../..",
    "/uploads/images",
    "1792480627930-51681836-photo_6174882028172985390_x.jpg",
  );
  res.sendFile(file, (err) => {
    res.status(404).send("File not found");
  });
};
export const uploadProfileMultiple = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  console.log("req.files -------", req.files);
  res.status(200).json({
    message: "Multiple Profile pictures uploaded successfully.",
  });
};
export const uploadProfileOptimize = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  const image = req.file;
  const user = await getUserById(userId!);
  checkUserIfNotExist(user);
  checkUploadFile(image);

  const fileName = Date.now() + "-" + `${Math.round(Math.random() * 1e9)}.webp`;

  try {
    const optimizedImagePath = path.join(
      __dirname,
      "../../..",
      "/uploads/images",
      fileName,
    );
    await sharp(req.file?.buffer)
      .resize(200, 200)
      .webp({ quality: 50 })
      .toFile(optimizedImagePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Image optimization failed." });
    return;
  }

  if (user?.image) {
    try {
      const filePath = path.join(
        __dirname,
        "../../..",
        "uploads/images",
        user!.image!,
      );
      await unlink(filePath);
    } catch (error) {
      console.error(error);
    }
  }
  const userData= {
    image:fileName,
  };
  await updateUser(user?.id!,userData);

  res.status(200).json({
    message: "Profile picture uploaded successfully.",
    image: fileName,
  });
};
