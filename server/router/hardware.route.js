import express from "express";
import multer from "multer";
import {
  getAll,
  getById,
  createHardware,
  updateAssetInfo,
  getExpiringWarranties,
  getWarrantyStats,
  updateComponentWarranty,
  createManualAsset,
  getManualEntries,
  getUnassignedAssets,
  importCsvAssets,
  getDashboardStats,
} from "../controllers/hardware.controller.js";
import {
  verifyToken,
  canAccessAsset,
  requireAdmin,
} from "../middleware/auth.js";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
});

const router = express.Router();

// GET route to fetch all hardware data (protected)
router.get("/", verifyToken, getAll);

// GET route to fetch dashboard statistics (protected)
router.get("/stats", verifyToken, getDashboardStats);

// Admin routes must come before the :id route to avoid conflicts
// GET route to fetch assets with expiring warranties (protected)
router.get("/admin/expiring-warranties", verifyToken, getExpiringWarranties);

// GET route to fetch warranty statistics (protected)
router.get("/admin/warranty-stats", verifyToken, getWarrantyStats);

// POST route to save hardware data (public - for scanners)
router.post("/", createHardware);

// PUT route to update hardware data (public - for scanners)
router.put("/:id", createHardware);

// POST route to create manual asset entry (admin only)
router.post("/manual", verifyToken, requireAdmin, createManualAsset);

// GET route to fetch manual entries (admin only)
router.get(
  "/admin/manual-entries",
  verifyToken,
  requireAdmin,
  getManualEntries
);

// GET route to fetch unassigned assets (admin only)
router.get("/admin/unassigned", verifyToken, requireAdmin, getUnassignedAssets);

// POST route to save hardware data (public - for scanners)
router.post("/", createHardware);

// POST route to create manual asset entry (admin only)
router.post("/manual", verifyToken, requireAdmin, createManualAsset);

// POST route to import CSV assets (admin only)
router.post(
  "/import/csv",
  verifyToken,
  requireAdmin,
  upload.single("csvFile"),
  importCsvAssets
);

// GET route to fetch specific hardware by ID (protected) - must come last
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

export default router;
