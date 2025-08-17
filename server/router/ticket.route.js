import express from "express";
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  addComment,
  getTicketStatistics,
  getUserAssets,
  updateTicketStatus,
  assignTicket,
  getAdminUsers,
  closeTicket,
} from "../controllers/ticket.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes (with authentication)
router.get("/user-assets", verifyToken, getUserAssets);
router.post("/", verifyToken, createTicket);
router.get("/", verifyToken, getAllTickets);
router.get("/:id", verifyToken, getTicketById);
router.post("/:id/comments", verifyToken, addComment);

// Admin only routes
router.put("/:id", verifyToken, requireAdmin, updateTicket);
router.patch("/:id/status", verifyToken, requireAdmin, updateTicketStatus);
router.patch("/:id/assign", verifyToken, requireAdmin, assignTicket);
router.post("/:id/close", verifyToken, requireAdmin, closeTicket);
router.get("/admin/statistics", verifyToken, requireAdmin, getTicketStatistics);
router.get("/admin/users", verifyToken, requireAdmin, getAdminUsers);

export default router;
