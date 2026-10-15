import { Request, Response, NextFunction } from "express";
import { getSettingStatus } from "../services/settingService";
import { errorCode } from "../config/errorCode";
import { createError } from "../utils/error";

export const maintenance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const setting = await getSettingStatus("maintenance");

  if (setting?.value === "true") {
    return next(
      createError(
        "The server is currently under maintenance.Please try again later.",
        503,
        errorCode.maintenance,
      ),
    );
  }

  next();
};
