import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  assignAsset,
  removeAsset,
  bulkAssignAssets,
  getAssignmentStatistics,
  getUnassignedAssets,
  createUser,
  sendEmailToUsers,
} from "../controllers/auth.controller.js";
import { testEmailConfig } from "../utils/emailService.js";
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
router.post("/create-user", verifyToken, requireAdmin, createUser);
router.post("/assign-asset", verifyToken, requireAdmin, assignAsset);
router.post("/remove-asset", verifyToken, requireAdmin, removeAsset);
router.post("/bulk-assign", verifyToken, requireAdmin, bulkAssignAssets);
router.get(
  "/assignment-stats",
  verifyToken,
  requireAdmin,
  getAssignmentStatistics
);
router.get(
  "/unassigned-assets",
  verifyToken,
  requireAdmin,
  getUnassignedAssets
);

// Test email configuration (admin only)
router.get("/test-email", verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await testEmailConfig();
    if (result.success) {
      res.json({ success: true, message: "Email configuration is working correctly" });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send email to users (admin only)
router.post("/send-email", verifyToken, requireAdmin, sendEmailToUsers);

export default router;
