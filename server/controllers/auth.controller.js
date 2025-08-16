import User from "../models/user.models.js";
import { generateToken } from "../middleware/auth.js";

// Register new user
export const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, department, role } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      department,
      role: role || "user", // Default to user, only admin can create admin accounts
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      department: user.department,
      role: user.role,
      assignedAssets: user.assignedAssets,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      department: user.department,
      role: user.role,
      assignedAssets: user.assignedAssets,
      createdAt: user.createdAt,
    };

    res.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const userResponse = {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      fullName: req.user.fullName,
      department: req.user.department,
      role: req.user.role,
      assignedAssets: req.user.assignedAssets,
      createdAt: req.user.createdAt,
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, department } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, department },
      { new: true, runValidators: true }
    ).select("-password");

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      department: user.department,
      role: user.role,
      assignedAssets: user.assignedAssets,
      createdAt: user.createdAt,
    };

    res.json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Admin: Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    const usersResponse = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      department: user.department,
      role: user.role,
      assignedAssets: user.assignedAssets,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));

    res.json({ users: usersResponse });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
};

// Admin: Assign asset to user
export const assignAsset = async (req, res) => {
  try {
    const { userId, macAddress } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.assignedAssets.includes(macAddress)) {
      user.assignedAssets.push(macAddress);
      await user.save();
    }

    res.json({
      message: "Asset assigned successfully",
      user: {
        id: user._id,
        username: user.username,
        assignedAssets: user.assignedAssets,
      },
    });
  } catch (error) {
    console.error("Assign asset error:", error);
    res.status(500).json({ error: "Failed to assign asset" });
  }
};

// Admin: Remove asset from user
export const removeAsset = async (req, res) => {
  try {
    const { userId, macAddress } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.assignedAssets = user.assignedAssets.filter(
      (asset) => asset !== macAddress
    );
    await user.save();

    res.json({
      message: "Asset removed successfully",
      user: {
        id: user._id,
        username: user.username,
        assignedAssets: user.assignedAssets,
      },
    });
  } catch (error) {
    console.error("Remove asset error:", error);
    res.status(500).json({ error: "Failed to remove asset" });
  }
};
