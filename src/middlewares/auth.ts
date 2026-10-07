import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { errorCode } from "../config/errorCode";

interface CustomRequest extends Request {
  userId?: number;
}

export const auth = (req: CustomRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.accessToken || null;
  const refreshToken = req.cookies?.refreshToken || null;

  if (!refreshToken) {
    const err: any = new Error(
      "You are not an unauthorized user. Please login to access this resource.",
    );
    err.status = 401;
    err.code = errorCode.unauthenticated;
    return next(err);
  }

  if (!accessToken) {
    const err: any = new Error("Access token has expired.");
    err.status = 401;
    err.code = errorCode.accessTokenExpired;
    return next(err);
  }

  // Verify Access Token
  try {
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as {
      id?: number;
      userId?: number;
    };

    // id သို့မဟုတ် userId နှစ်ခုစလုံးကို စစ်ပြီး ယူခြင်း
    req.userId = decoded.id || decoded.userId;

    return next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      const expiredErr: any = new Error("Access token has expired.");
      expiredErr.status = 401;
      expiredErr.code = errorCode.accessTokenExpired;
      return next(expiredErr);
    } else {
      err.message = "Invalid access token.";
      err.status = 400;
      err.code = errorCode.attack;
      return next(err);
    }
  }
};
