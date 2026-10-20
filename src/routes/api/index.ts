import express from "express";
import {
  changeLanguage,
  uploadProfile,
  testPermission,
  getMyPhoto,
  uploadProfileMultiple
} from "../../controllers/api/profileController";
import { auth } from "../../middlewares/auth";
import upload from "../../middlewares/uploadFiles";

const router = express.Router();

router.post("/change-language", changeLanguage);
router.get("/test-permission", auth, testPermission);
router.patch("/profile/upload", auth, upload.single("avatar"), uploadProfile);
router.patch("/profile/upload/multiple",auth,upload.array ("avatar"),uploadProfileMultiple)
router.get("/profile/my-photo",getMyPhoto);

export default router;
