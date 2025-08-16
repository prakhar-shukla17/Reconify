import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  assignAsset,
  removeAsset,
} from "../controllers/auth.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

// Admin only routes
router.get("/users", verifyToken, requireAdmin, getAllUsers);
router.post("/assign-asset", verifyToken, requireAdmin, assignAsset);
router.post("/remove-asset", verifyToken, requireAdmin, removeAsset);

export default router;
