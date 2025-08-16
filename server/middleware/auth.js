import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Verify JWT token middleware
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "Invalid token. User not found." });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

// Check if user is admin
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  next();
};

// Check if user can access specific asset
export const canAccessAsset = (req, res, next) => {
  const { id } = req.params; // MAC address

  // Admin can access all assets
  if (req.user.role === "admin") {
    return next();
  }

  // User can only access their assigned assets
  if (!req.user.assignedAssets.includes(id)) {
    return res
      .status(403)
      .json({ error: "Access denied. Asset not assigned to you." });
  }

  next();
};
