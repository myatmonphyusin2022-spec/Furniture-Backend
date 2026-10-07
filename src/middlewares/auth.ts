// src/utils/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorCode } from "../config/errorCode";
import { getUserById, updateUser } from "../services/authService";

interface CustomRequest extends Request {
  userId?: number;
}

export const auth = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  const accessToken = req.cookies ? req.cookies.accessToken : null;
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    const error: any = new Error("You are not an authenticated user.");
    error.status = 401;
    error.code = errorCode.unauthenticated;
    return next(error);
  }

  const generateNewTokens = async () => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
        id: number;
        phone: string;
      };
    } catch (error) {
      const err: any = new Error("You are not an authenticated user.");
      err.status = 401;
      err.code = errorCode.unauthenticated;
      return next(err);
    }

    if (isNaN(decoded.id)) {
      const error: any = new Error("You are not an authenticated user.");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    const user = await getUserById(decoded.id);
    if (!user) {
      const error: any = new Error("This account has not registered!.");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    if (user.phone !== decoded.phone) {
      const error: any = new Error("You are not an authenticated user.");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    if (user.randToken !== refreshToken) {
      const error: any = new Error("You are not an authenticated user.");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    // Authorization token
    const accessTokenPayload = { id: user.id };
    const refreshTokenPayload = { id: user.id, phone: user.phone };

    const newAccessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, // 15 min
      },
    );

    const newRefreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      },
    );

    const userData = {
      randToken: newRefreshToken,
    };

    await updateUser(user.id, userData);

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

    req.userId = user.id;
    return next();
  };

  if (!accessToken) {
    return await generateNewTokens();
  } else {
    // Verify access Token
    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET!,
      ) as {
        id: number;
      };

      if (isNaN(decoded.id)) {
        const error: any = new Error("You are not an authenticated user.");
        error.status = 401;
        error.code = errorCode.unauthenticated;
        return next(error);
      }

      req.userId = decoded.id;
      return next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return await generateNewTokens();
      } else {
        error.message = "Access Token is invalid.";
        error.status = 400;
        error.code = errorCode.attack;
        return next(error);
      }
    }
  }
};
