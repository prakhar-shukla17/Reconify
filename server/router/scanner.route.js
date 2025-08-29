import express from "express";
import {
  downloadScanner,
  getAvailablePlatforms,
} from "../controllers/scanner.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get available platforms for scanner download
router.get("/platforms", verifyToken, getAvailablePlatforms);

// Download scanner package for specific platform
router.get("/download", verifyToken, downloadScanner);

export default router;
