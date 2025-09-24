import express from "express";
import {
  createLicense,
  getLicenseByTenant,
  getCurrentLicense,
  updateLicense,
  renewLicense,
  suspendLicense,
  revokeLicense,
  verifyLicense,
  getLicenseUsage,
  updateLicenseUsage,
  getExpiringLicenses,
  getLicenseStats,
  generateLicenseCertificate,
} from "../controllers/license.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Public routes (no auth required)
router.post("/verify", verifyLicense);

// Protected routes (auth required)
router.use(verifyToken);

// License management
router.post("/", createLicense);
router.get("/current", getCurrentLicense);
router.get("/tenant/:tenant_id", getLicenseByTenant);
router.put("/:license_id", updateLicense);
router.put("/:license_id/renew", renewLicense);
router.put("/:license_id/suspend", suspendLicense);
router.put("/:license_id/revoke", revokeLicense);

// Usage management
router.get("/usage", getLicenseUsage);
router.post("/usage", updateLicenseUsage);

// Certificate generation
router.get("/:license_id/certificate", generateLicenseCertificate);

// Admin routes (for superadmin)
router.get("/expiring", getExpiringLicenses);
router.get("/stats", getLicenseStats);

export default router;

