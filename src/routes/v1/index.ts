import express from "express";
import { auth } from "../../middlewares/auth";
import { authorise } from "../../middlewares/authorise";
import authRoutes from "./auth";
import adminRoutes from "../admin";
import { maintenance } from "../../middlewares/maintenance";
import userRoutes from "../api";
// import healthRoutes from "./health"

const router = express.Router();

router.use("/api/v1/auth", authRoutes);
router.use(
  "/api/v1/admins",
  maintenance,
  auth,
  authorise(true, "ADMIN"),
  adminRoutes,
);
router.use("/api/v1/users", maintenance, userRoutes);

// router.use("/api/v1/auth", authRoutes);
// router.use("/api/v1/admins", auth, authorise(true, "ADMIN"), adminRoutes);
// router.use("/api/v1/user", userRoutes);

export default router;
