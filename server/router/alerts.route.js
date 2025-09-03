import express from "express";
import {
  getWarrantyAlerts,
  getAlertStatistics,
  testWarrantyAlerts,
} from "../controllers/alerts.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get warranty alerts for current user (or all if admin)
router.get("/warranty", verifyToken, getWarrantyAlerts);

// Test warranty alerts for a specific asset (admin only)
router.get("/test-warranty", verifyToken, requireAdmin, testWarrantyAlerts);

// Get alert statistics (admin only)
router.get("/statistics", verifyToken, requireAdmin, getAlertStatistics);

export default router;
