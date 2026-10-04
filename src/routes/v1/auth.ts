// src/routes/v1/auth.ts
import { Router } from "express";
import {
  register,
  verifyOtp,
  confirmPassword,
  login, 
} from "../../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/confirm-password", confirmPassword);
router.post("/login", login); 
export default router;
