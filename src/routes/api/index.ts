import express from "express";
import {
  changeLanguage,
  uploadProfile,
  testPermission,
  getMyPhoto,
  uploadProfileMultiple,
  uploadProfileOptimize,
} from "../../controllers/api/profileController";
import { auth } from "../../middlewares/auth";
import upload, { uploadMemory } from "../../middlewares/uploadFiles";

const router = express.Router();

router.post("/change-language", changeLanguage);
router.get("/test-permission", auth, testPermission);
router.get("/profile/my-photo", auth, getMyPhoto); // <-- Added `auth` middleware here

router.patch("/profile/upload", auth, upload.single("avatar"), uploadProfile);
router.patch(
  "/profile/upload/multiple",
  auth,
  upload.array("avatar"),
  uploadProfileMultiple,
);
router.patch(
  "/profile/upload/optimize",
  auth,
  uploadMemory.single("avatar"),
  uploadProfileOptimize,
);

export default router;
