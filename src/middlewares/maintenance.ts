import { Request, Response, NextFunction } from "express";
import { getSettingStatus } from "../services/settingService";
import { errorCode } from "../config/errorCode";
import { createError } from "../utils/error";

const whiteLists = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

export const maintenance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip: any = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (whiteLists.includes(ip)) {
    console.log(`Allowed IP: ${ip}`);
    return next(); // Added 'return' to prevent execution from falling through
  } else {
    console.log(`Not Allowed IP: ${ip}`); // Changed to backticks
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
  }

  next();
};
