import { Request, Response, NextFunction } from "express";
import { getUserById } from "../../services/authService"; // authService မှ getUserById ကို import လုပ်ပါ

interface CustomRequest extends Request {
  userId?: number;
  user?: any;
}

export const getAllUsers = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. auth middleware မှ ရလာသော userId ကို ယူပါ
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "You are not an authenticated user.",
        error: "Error_Unauthenticated",
      });
    }

    // 2. Database မှ user အချက်အလက် အပြည့်အစုံကို ရှာယူပါ
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        error: "Error_NotFound",
      });
    }

    // 3. အောင်မြင်စွာ Response ပြန်ပေးပါ
    res.status(200).json({
      message: req.t("welcome"),
      currentUserRole: user.role,
      //user: user, // လိုအပ်ပါက user စာရင်း/အချက်အလက်များ ထည့်နိုင်သည်
    });
  } catch (error) {
    next(error);
  }
};
