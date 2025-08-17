import express from "express";
import {
  getAll,
  getById,
  createHardware,
  updateAssetInfo,
  getExpiringWarranties,
  getWarrantyStats,
  updateComponentWarranty,
} from "../controllers/hardware.controller.js";
import {
  verifyToken,
  canAccessAsset,
  requireAdmin,
} from "../middleware/auth.js";

const router = express.Router();

// GET route to fetch all hardware data (protected)
router.get("/", verifyToken, getAll);

// GET route to fetch specific hardware by ID (protected)
router.get("/:id", verifyToken, canAccessAsset, getById);

// PUT route to update asset information (admin only)
router.put("/:id/asset-info", verifyToken, requireAdmin, updateAssetInfo);

// PUT route to update component warranty information (admin only)
router.put(
  "/:id/component-warranty",
  verifyToken,
  requireAdmin,
  updateComponentWarranty
);

// GET route to fetch assets with expiring warranties (protected)
router.get("/admin/expiring-warranties", verifyToken, getExpiringWarranties);

// GET route to fetch warranty statistics (protected)
router.get("/admin/warranty-stats", verifyToken, getWarrantyStats);

// POST route to save hardware data (public - for scanners)
router.post("/", createHardware);

export default router;
