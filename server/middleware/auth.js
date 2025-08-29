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
    console.log("=== verifyToken middleware ===");
    console.log("Headers:", req.headers);
    
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log("Token:", token ? `${token.substring(0, 20)}...` : "No token");

    if (!token) {
      console.log("No token provided");
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded token:", decoded);
    
    const user = await User.findById(decoded.userId).select("-password");
    console.log("User found:", user ? { id: user._id, username: user.username, role: user.role } : "No user");

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ error: "Invalid token. User not found." });
    }

    if (!user.isActive) {
      console.log("User account deactivated");
      return res.status(401).json({ error: "Account is deactivated." });
    }

    req.user = user;
    console.log("User set in req.user:", { id: req.user._id, username: req.user.username, role: req.user.role });
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid token." });
  }
};

// Check if user is admin
export const requireAdmin = (req, res, next) => {
  console.log("=== requireAdmin middleware ===");
  console.log("req.user:", req.user);
  console.log("User role:", req.user?.role);
  
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    console.log("Access denied - user is not admin");
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  
  console.log("Admin access granted");
  next();
};

// Check if user is super admin
export const requireSuperAdmin = (req, res, next) => {
  console.log("=== requireSuperAdmin middleware ===");
  console.log("req.user:", req.user);
  console.log("User role:", req.user?.role);
  
  if (req.user.role !== "superadmin") {
    console.log("Access denied - user is not super admin");
    return res
      .status(403)
      .json({ error: "Access denied. Super Admin privileges required." });
  }
  
  console.log("Super Admin access granted");
  next();
};

// Check if user can access specific asset
export const canAccessAsset = (req, res, next) => {
  const { id } = req.params; // MAC address

  // Super admin and admin can access all assets
  if (req.user.role === "superadmin" || req.user.role === "admin") {
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
