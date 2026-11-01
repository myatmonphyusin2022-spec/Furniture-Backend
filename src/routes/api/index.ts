import express from "express";
import {
  changeLanguage,
  uploadProfile,
  testPermission,
  getMyPhoto,
  uploadProfileMultiple,
  uploadProfileOptimize,
} from "../../controllers/api/profileController"; // Folder တစ်ဆင့်ပဲ တက်ရန်
import { auth } from "../../middlewares/auth"; // Folder တစ်ဆင့်ပဲ တက်ရန်
import upload, { uploadMemory } from "../../middlewares/uploadFiles"; // Folder တစ်ဆင့်ပဲ တက်ရန်
import { getPost, getPostsByPagination } from "../../controllers/api/postController";

const router = express.Router();

router.post("/change-language", changeLanguage);
router.get("/test-permission", auth, testPermission);
router.get("/profile/my-photo", auth, getMyPhoto);

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
router.get("/posts",auth,getPostsByPagination);
router.get("/posts/:id",auth,getPost);

export default router;
