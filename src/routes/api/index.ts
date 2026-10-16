import express from "express";
import {
  changeLanguage,
  uploadProfile,
  testPermission,
} from "../../controllers/api/profileController";
import { auth } from "../../middlewares/auth";
import upload from "../../middlewares/uploadFiles";

const router = express.Router();

router.post("/change-language", changeLanguage);
router.get("/test-permission", auth, testPermission);
router.patch("/profile/upload", auth, upload.single("avatar"), uploadProfile);

export default router;
