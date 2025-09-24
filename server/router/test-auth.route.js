import express from "express";
import {
  createTestUser,
  refreshToken,
  autoRefreshToken,
} from "../controllers/test-auth.controller.js";

const router = express.Router();

// Test routes (no auth required)
router.post("/create-test-user", createTestUser);
router.post("/refresh-token", refreshToken);
router.post("/auto-refresh", autoRefreshToken);

export default router;
