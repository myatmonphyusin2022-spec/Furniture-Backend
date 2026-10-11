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
  let accessToken = null;

  // ၁။ Authorization Header (Bearer Token) ကို အရင်ဆုံး စစ်ဆေးပါ
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    accessToken = authHeader.split(" ")[1];
  }

  // ၂။ Header မှာ မပါလာမှသာ Cookie ထဲက accessToken ကို ယူသုံးပါ
  if (!accessToken && req.cookies && req.cookies.accessToken) {
    accessToken = req.cookies.accessToken;
  }

  let refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!accessToken && !refreshToken) {
    const error: any = new Error("You are not an authenticated user.");
    error.status = 401;
    error.code = errorCode.unauthenticated;
    return next(error);
  }

  const generateNewTokens = async () => {
    if (!refreshToken) {
      const err: any = new Error("You are not an authenticated user.");
      err.status = 401;
      err.code = errorCode.unauthenticated;
      return next(err);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
        userId: number;
        phone: string;
      };
    } catch (error) {
      const err: any = new Error("You are not an authenticated user.");
      err.status = 401;
      err.code = errorCode.unauthenticated;
      return next(err);
    }

    if (isNaN(decoded.userId)) {
      const error: any = new Error("You are not an authenticated user.");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      const error: any = new Error("This account has not registered!.");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    if (user.phone !== decoded.phone || user.randToken !== refreshToken) {
      const error: any = new Error("You are not an authenticated user.");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    const accessTokenPayload = { userId: user.id };
    const refreshTokenPayload = { userId: user.id, phone: user.phone };

    const newAccessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "15m" },
    );

    const newRefreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "30d" },
    );

    await updateUser(user.id, { randToken: newRefreshToken });

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

    req.userId = user.id;
    return next();
  };

  if (!accessToken) {
    return await generateNewTokens();
  } else {
    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET!,
      ) as { userId: number };

      if (isNaN(decoded.userId)) {
        const error: any = new Error("You are not an authenticated user.");
        error.status = 401;
        error.code = errorCode.unauthenticated;
        return next(error);
      }

      req.userId = decoded.userId;
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
