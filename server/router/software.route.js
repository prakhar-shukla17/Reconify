import express from "express";
import {
  getAll,
  getById,
  createOrUpdateSoftware,
  getSoftwareStatistics,
  searchSoftware,
  getSoftwareByVendor,
  getOutdatedSoftware,
  deleteSoftware,
} from "../controllers/software.controller.js";
import {
  verifyToken,
  requireAdmin,
  canAccessAsset,
} from "../middleware/auth.js";

const router = express.Router();

// Public route for scanners to submit software data
router.post("/", createOrUpdateSoftware);

// Protected routes - require authentication
router.get("/", verifyToken, getAll);
router.get("/:id", verifyToken, canAccessAsset, getById);

// Admin-only routes
router.get(
  "/admin/statistics",
  verifyToken,
  requireAdmin,
  getSoftwareStatistics
);
router.get("/admin/search", verifyToken, requireAdmin, searchSoftware);
router.get(
  "/admin/vendor/:vendor",
  verifyToken,
  requireAdmin,
  getSoftwareByVendor
);
router.get("/admin/outdated", verifyToken, requireAdmin, getOutdatedSoftware);
router.delete("/:id", verifyToken, requireAdmin, deleteSoftware);

export default router;

