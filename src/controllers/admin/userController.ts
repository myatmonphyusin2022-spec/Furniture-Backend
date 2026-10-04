import { Request, Response, NextFunction } from "express";

interface CustomRequest extends Request {
  userId?: number;
}

export const getAllUsers = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({
    message: "All Users.",
  });
};
