import express from "express";
import {
  receiveTelemetry,
  getTelemetry,
  getHealthSummary,
} from "../controllers/telemetry.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public route for receiving telemetry data from scanners
router.post("/", receiveTelemetry);

// Protected routes
router.get("/health-summary", verifyToken, requireAdmin, getHealthSummary);
router.get("/:mac_address", verifyToken, getTelemetry);

export default router;

