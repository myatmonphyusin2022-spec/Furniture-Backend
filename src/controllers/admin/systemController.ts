import { Request, Response, NextFunction } from "express";
import { getUserById } from "../../services/authService"; // authService မှ getUserById ကို import လုပ်ပါ
import { createError } from "../../utils/error";
import { errorCode } from "../../config/errorCode";
import { body, validationResult } from "express-validator";
import { createOrUpdateSettingStatus } from "../../services/settingService";

interface CustomRequest extends Request {
  userId?: number;
  user?: any;
}

export const setMaintenance = [
  body("mode", "Mode must be boolean.").isBoolean(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    // const userId = req.userId;
    const { mode } = req.body;
    const value = mode ? "true" : "false";
    const message = mode
      ? "Successfully set Maintenace mode."
      : "Successfully turn off set Maintenance mode. ";
      await createOrUpdateSettingStatus("maintenance",value);
    res.status(200).json({ message });
  },
];
