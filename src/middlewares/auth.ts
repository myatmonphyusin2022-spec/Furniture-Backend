import { Request, Response, NextFunction } from "express";

interface CustomRequest extends Request {
  userId?: number;
}
export const auth = (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  // const err: any = new Error("Token has expired.");
  // err.status = 401;
  // err.code = "Error_TokenExpired";
  // return next(err);

  const accessToken = req.cookies.accessToken ?req.cookies.accessToken : null;
  const refreshToken = req.cookies.refreshToken ? req.cookies.refreshToken : null;
  if (!refreshToken){
    const err: any = new Error("You are not an unthorized user. Please login to access this resource.");
    err.status = 401;
    err.code = "Error_Unauthenticated";
    return next(err);
  }
  if (!accessToken){
const err: any = new Error("Access token has expired.");
    err.status = 401;
    err.code = "Error_AccessTokenExpired";
    return next(err);
  }

  next();
};
