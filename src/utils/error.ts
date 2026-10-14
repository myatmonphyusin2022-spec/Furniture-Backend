import { errorCode } from "../config/errorCode";

export const createError = (message: string, status: number, code: string) => {
  const error: any = new Error(message);
  error.status = status;
  error.code = errorCode.invalid;
  return error;
};
