import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/images");
  },
  filename: function (req, file, cb) {
    // Optional chaining ဖြင့် safe ဖြစ်အောင် စစ်ဆေးခြင်း
    const ext = file?.mimetype ? file.mimetype.split("/")[1] : "jpg";
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + "." + ext;
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: fileStorage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB (တစ်ကြောင်းတည်းဖြင့် မှန်ကန်စွာ ရေးသားရန်)
});

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB
});

export default upload;
