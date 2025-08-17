import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import hardwarerouter from "./router/hardware.route.js";
import authrouter from "./router/auth.route.js";
import softwarerouter from "./router/software.route.js";
import alertsrouter from "./router/alerts.route.js";
import ticketrouter from "./router/ticket.route.js";

const app = express();
const PORT = 3000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3001", // Next.js default port
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
// MongoDB connection URI
const mongoUri =
  "mongodb+srv://202111077:202111077@cluster0.rwwnyps.mongodb.net/";

// Connect to MongoDB
mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
