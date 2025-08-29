import express from "express";
import {
  downloadScanner,
  getAvailablePlatforms,
  testEndpoint,
} from "../controllers/scanner.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Test endpoint (no auth required)
router.get("/test", testEndpoint);

// Get available platforms for scanner download
router.get("/platforms", verifyToken, getAvailablePlatforms);

// Download scanner package for specific platform (handles auth manually)
router.get("/download", downloadScanner);

export default router;
