import express from "express";
import {
  getAll,
  getById,
  createHardware,
} from "../controllers/hardware.controller.js";
import { verifyToken, canAccessAsset } from "../middleware/auth.js";

const router = express.Router();

// GET route to fetch all hardware data (protected)
router.get("/", verifyToken, getAll);

// GET route to fetch specific hardware by ID (protected)
router.get("/:id", verifyToken, canAccessAsset, getById);

// POST route to save hardware data (public - for scanners)
router.post("/", createHardware);

export default router;
