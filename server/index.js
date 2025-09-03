import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { configDotenv } from "dotenv";
import hardwarerouter from "./router/hardware.route.js";
import authrouter from "./router/auth.route.js";
import softwarerouter from "./router/software.route.js";
import alertsrouter from "./router/alerts.route.js";
import ticketrouter from "./router/ticket.route.js";
import telemetryrouter from "./router/telemetry.route.js";
import superadminrouter from "./router/superadmin.route.js";
import scannerrouter from "./router/scanner.route.js";

const app = express();
configDotenv();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // Allow both ports
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/hardware", hardwarerouter);
app.use("/api/auth", authrouter);
app.use("/api/software", softwarerouter);
app.use("/api/alerts", alertsrouter);
app.use("/api/tickets", ticketrouter);
app.use("/api/telemetry", telemetryrouter);
app.use("/api/superadmin", superadminrouter);
app.use("/api/scanner", scannerrouter);

// 404 handler for undefined routes
app.use("*", (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  res.status(500).json({ error: "Internal server error" });
});
// MongoDB connection URI
const mongoUri = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
