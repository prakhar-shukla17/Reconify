import express from "express";
import {
  createSuperAdmin,
  promoteToAdmin,
  demoteFromAdmin,
  deactivateUser,
  reactivateUser,
  resetUserPassword,
  getSystemStatistics,
  bulkUserOperations,
} from "../controllers/superadmin.controller.js";
import { verifyToken, requireSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

// All routes require super admin privileges
router.use(verifyToken, requireSuperAdmin);

// Super Admin: Create super admin account
router.post("/create-superadmin", createSuperAdmin);

// Super Admin: Promote user to admin
router.patch("/promote/:userId", promoteToAdmin);

// Super Admin: Demote admin to user
router.patch("/demote/:userId", demoteFromAdmin);

// Super Admin: Deactivate user account
router.patch("/deactivate/:userId", deactivateUser);

// Super Admin: Reactivate user account
router.patch("/reactivate/:userId", reactivateUser);

// Super Admin: Reset user password
router.post("/reset-password", resetUserPassword);

// Super Admin: Get system statistics
router.get("/statistics", getSystemStatistics);

// Super Admin: Bulk user operations
router.post("/bulk-operations", bulkUserOperations);

export default router;



