import User from "../models/user.models.js";
import { generateToken } from "../middleware/auth.js";
import { generateTenantId } from "../utils/tenantUtils.js";

// Register new user
export const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      department,
      role,
      company,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Determine the role to assign
    let assignedRole = "user"; // Default role for new registrations

    // If the requesting user is a super admin, they can create any role
    if (req.user && req.user.role === "superadmin") {
      assignedRole = role || "user";
    } else if (req.user && req.user.role === "admin") {
      // Regular admins can only create user accounts
      assignedRole = "user";
    } else {
      // Public registration (no auth) creates admin accounts by default
      assignedRole = "admin";
    }

    // Determine tenant_id based on context
    let tenantId;
    if (req.user) {
      // Admin creating user - inherit admin's tenant_id
      tenantId = req.user.tenant_id;
    } else {
      // Public registration - hash company name to create tenant_id
      tenantId = generateTenantId(company);
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      department,
      role: assignedRole,
      tenant_id: tenantId,
    });

    await user.save();

    // Generate token with user data
    const token = generateToken(user._id, {
      tenant_id: user.tenant_id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      role: user.role,
    });

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

    // Generate token with user data
    const token = generateToken(user._id, {
      tenant_id: user.tenant_id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      role: user.role,
    });

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
    // Add tenant ID filter
    let query = {};
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }

    const users = await User.find(query)
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

// Admin: Assign asset to user or admin
export const assignAsset = async (req, res) => {
  try {
    const { userId, macAddress, macAddresses } = req.body;

    // Validate input
    if (
      !userId ||
      (!macAddress && (!macAddresses || macAddresses.length === 0))
    ) {
      return res.status(400).json({
        error: "User ID and at least one MAC address are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Support both single and multiple asset assignment
    const assetsToAssign = macAddresses || [macAddress];
    let newAssignments = 0;

    for (const asset of assetsToAssign) {
      if (!user.assignedAssets.includes(asset)) {
        user.assignedAssets.push(asset);
        newAssignments++;
      }
    }

    if (newAssignments > 0) {
      await user.save();
    }

    res.json({
      message: `${newAssignments} asset(s) assigned successfully to ${user.role} ${user.username}`,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        assignedAssets: user.assignedAssets,
      },
      newAssignments,
      totalAssets: user.assignedAssets.length,
    });
  } catch (error) {
    console.error("Assign asset error:", error);
    res.status(500).json({ error: "Failed to assign asset" });
  }
};

// Admin: Remove asset from user or admin
export const removeAsset = async (req, res) => {
  try {
    const { userId, macAddress, macAddresses } = req.body;

    // Validate input
    if (
      !userId ||
      (!macAddress && (!macAddresses || macAddresses.length === 0))
    ) {
      return res.status(400).json({
        error: "User ID and at least one MAC address are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const initialAssetCount = user.assignedAssets.length;

    // Support both single and multiple asset removal
    const assetsToRemove = macAddresses || [macAddress];

    user.assignedAssets = user.assignedAssets.filter(
      (asset) => !assetsToRemove.includes(asset)
    );

    const removedCount = initialAssetCount - user.assignedAssets.length;

    if (removedCount > 0) {
      await user.save();
    }

    res.json({
      message: `${removedCount} asset(s) removed successfully from ${user.role} ${user.username}`,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        assignedAssets: user.assignedAssets,
      },
      removedCount,
      totalAssets: user.assignedAssets.length,
    });
  } catch (error) {
    console.error("Remove asset error:", error);
    res.status(500).json({ error: "Failed to remove asset" });
  }
};

// Admin: Bulk assign multiple assets to multiple users
export const bulkAssignAssets = async (req, res) => {
  try {
    const { assignments } = req.body; // Array of { userId, macAddresses }

    if (
      !assignments ||
      !Array.isArray(assignments) ||
      assignments.length === 0
    ) {
      return res.status(400).json({
        error: "Assignments array is required",
      });
    }

    const results = [];
    let totalAssignments = 0;

    for (const assignment of assignments) {
      const { userId, macAddresses } = assignment;

      if (!userId || !macAddresses || macAddresses.length === 0) {
        continue;
      }

      const user = await User.findById(userId);
      if (!user) {
        results.push({
          userId,
          error: "User not found",
          success: false,
        });
        continue;
      }

      let newAssignments = 0;
      for (const macAddress of macAddresses) {
        if (!user.assignedAssets.includes(macAddress)) {
          user.assignedAssets.push(macAddress);
          newAssignments++;
          totalAssignments++;
        }
      }

      if (newAssignments > 0) {
        await user.save();
      }

      results.push({
        userId: user._id,
        username: user.username,
        role: user.role,
        newAssignments,
        totalAssets: user.assignedAssets.length,
        success: true,
      });
    }

    res.json({
      message: `Bulk assignment completed: ${totalAssignments} total assignments`,
      results,
      totalAssignments,
      processedUsers: results.length,
    });
  } catch (error) {
    console.error("Bulk assign assets error:", error);
    res.status(500).json({ error: "Failed to bulk assign assets" });
  }
};

// Admin: Get assignment statistics
export const getAssignmentStatistics = async (req, res) => {
  try {
    const users = await User.find(
      {},
      "username role assignedAssets department"
    );

    const stats = {
      totalUsers: users.length,
      totalAdmins: users.filter((u) => u.role === "admin").length,
      totalRegularUsers: users.filter((u) => u.role === "user").length,
      usersWithAssets: users.filter((u) => u.assignedAssets.length > 0).length,
      usersWithoutAssets: users.filter((u) => u.assignedAssets.length === 0)
        .length,
      totalAssignedAssets: users.reduce(
        (sum, u) => sum + u.assignedAssets.length,
        0
      ),
      averageAssetsPerUser: 0,
      maxAssetsPerUser: Math.max(...users.map((u) => u.assignedAssets.length)),
      usersByAssetCount: {
        0: users.filter((u) => u.assignedAssets.length === 0).length,
        1: users.filter((u) => u.assignedAssets.length === 1).length,
        "2-5": users.filter(
          (u) => u.assignedAssets.length >= 2 && u.assignedAssets.length <= 5
        ).length,
        "6+": users.filter((u) => u.assignedAssets.length > 5).length,
      },
      departmentStats: {},
    };

    // Calculate average
    if (stats.totalUsers > 0) {
      stats.averageAssetsPerUser =
        Math.round((stats.totalAssignedAssets / stats.totalUsers) * 100) / 100;
    }

    // Department statistics
    const departments = [
      ...new Set(users.map((u) => u.department).filter(Boolean)),
    ];
    for (const dept of departments) {
      const deptUsers = users.filter((u) => u.department === dept);
      stats.departmentStats[dept] = {
        users: deptUsers.length,
        totalAssets: deptUsers.reduce(
          (sum, u) => sum + u.assignedAssets.length,
          0
        ),
        averageAssets:
          deptUsers.length > 0
            ? Math.round(
                (deptUsers.reduce(
                  (sum, u) => sum + u.assignedAssets.length,
                  0
                ) /
                  deptUsers.length) *
                  100
              ) / 100
            : 0,
      };
    }

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error("Get assignment statistics error:", error);
    res.status(500).json({ error: "Failed to get assignment statistics" });
  }
};

// Admin: Get unassigned assets
export const getUnassignedAssets = async (req, res) => {
  try {
    // This would require importing Hardware model
    const Hardware = (await import("../models/hardware.models.js")).default;

    const allAssets = await Hardware.find(
      {},
      "_id system.hostname system.mac_address"
    );
    const users = await User.find({}, "assignedAssets");

    const assignedMacAddresses = new Set();
    users.forEach((user) => {
      user.assignedAssets.forEach((mac) => assignedMacAddresses.add(mac));
    });

    const unassignedAssets = allAssets.filter(
      (asset) => !assignedMacAddresses.has(asset._id)
    );

    res.json({
      success: true,
      unassignedAssets: unassignedAssets.map((asset) => ({
        id: asset._id,
        macAddress: asset._id,
        hostname: asset.system?.hostname || "Unknown Device",
      })),
      total: unassignedAssets.length,
    });
  } catch (error) {
    console.error("Get unassigned assets error:", error);
    res.status(500).json({ error: "Failed to get unassigned assets" });
  }
};

// Admin: Create new user
export const createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      department,
      role,
      company,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Determine the role to assign based on admin permissions
    let assignedRole = "user"; // Default role for new registrations

    if (req.user.role === "superadmin") {
      // Super admin can create any role
      assignedRole = role || "user";
    } else if (req.user.role === "admin") {
      // Regular admin can only create user accounts
      assignedRole = "user";
    } else {
      return res.status(403).json({
        error: "Insufficient permissions to create users",
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
      role: assignedRole,
      isActive: true,
      tenant_id: req.user.tenant_id, // Always inherit admin's tenant_id
    });

    await user.save();

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
      isActive: user.isActive,
      tenant_id: user.tenant_id,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};
