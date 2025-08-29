import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import { generateTenantId } from "../utils/tenantUtils.js";

// Super Admin: Create super admin account
export const createSuperAdmin = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, department, company } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Create new super admin user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      department,
      role: "superadmin",
      tenant_id: generateTenantId(company),
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
      createdAt: user.createdAt,
    };

    res.status(201).json({
      message: "Super Admin account created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Create super admin error:", error);
    res.status(500).json({ error: "Failed to create super admin account" });
  }
};

// Super Admin: Promote user to admin
export const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "superadmin") {
      return res.status(400).json({ error: "Cannot modify super admin role" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ error: "User is already an admin" });
    }

    user.role = "admin";
    await user.save();

    res.json({
      message: `User ${user.username} promoted to admin successfully`,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Promote to admin error:", error);
    res.status(500).json({ error: "Failed to promote user to admin" });
  }
};

// Super Admin: Demote admin to user
export const demoteFromAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "superadmin") {
      return res.status(400).json({ error: "Cannot modify super admin role" });
    }

    if (user.role === "user") {
      return res.status(400).json({ error: "User is already a regular user" });
    }

    user.role = "user";
    await user.save();

    res.json({
      message: `User ${user.username} demoted to regular user successfully`,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Demote from admin error:", error);
    res.status(500).json({ error: "Failed to demote admin to user" });
  }
};

// Super Admin: Deactivate user account
export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "superadmin") {
      return res.status(400).json({ error: "Cannot deactivate super admin account" });
    }

    user.isActive = false;
    await user.save();

    res.json({
      message: `User ${user.username} deactivated successfully`,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({ error: "Failed to deactivate user" });
  }
};

// Super Admin: Reactivate user account
export const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isActive = true;
    await user.save();

    res.json({
      message: `User ${user.username} reactivated successfully`,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Reactivate user error:", error);
    res.status(500).json({ error: "Failed to reactivate user" });
  }
};

// Super Admin: Reset user password
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.body;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      message: `Password reset successfully for user ${user.username}`,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// Super Admin: Get system statistics
export const getSystemStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalSuperAdmins = await User.countDocuments({ role: "superadmin" });
    const totalRegularUsers = await User.countDocuments({ role: "user" });
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Get department statistics
    const departmentStats = await User.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          admins: {
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] }
          },
          superAdmins: {
            $sum: { $cond: [{ $eq: ["$role", "superadmin"] }, 1, 0] }
          },
          activeUsers: {
            $sum: { $cond: ["$isActive", 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent user activity
    const recentUsers = await User.find({})
      .select("username role department isActive createdAt lastLogin")
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = {
      userCounts: {
        total: totalUsers,
        admins: totalAdmins,
        superAdmins: totalSuperAdmins,
        regularUsers: totalRegularUsers,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      departmentStats,
      roleDistribution,
      recentUsers,
      systemHealth: {
        activeUserPercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        adminToUserRatio: totalRegularUsers > 0 ? Math.round((totalAdmins / totalRegularUsers) * 100) / 100 : 0,
      }
    };

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error("Get system statistics error:", error);
    res.status(500).json({ error: "Failed to get system statistics" });
  }
};

// Super Admin: Bulk user operations
export const bulkUserOperations = async (req, res) => {
  try {
    const { operations } = req.body; // Array of { action, userId, data }

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        error: "Operations array is required",
      });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const operation of operations) {
      const { action, userId, data } = operation;

      try {
        const user = await User.findById(userId);
        if (!user) {
          results.push({
            userId,
            action,
            success: false,
            error: "User not found",
          });
          failureCount++;
          continue;
        }

        // Prevent modification of super admin accounts
        if (user.role === "superadmin" && action !== "reactivate") {
          results.push({
            userId,
            action,
            success: false,
            error: "Cannot modify super admin account",
          });
          failureCount++;
          continue;
        }

        let updateData = {};
        let message = "";

        switch (action) {
          case "promote":
            if (user.role === "admin") {
              throw new Error("User is already an admin");
            }
            updateData = { role: "admin" };
            message = "User promoted to admin";
            break;

          case "demote":
            if (user.role === "user") {
              throw new Error("User is already a regular user");
            }
            updateData = { role: "user" };
            message = "User demoted to regular user";
            break;

          case "deactivate":
            updateData = { isActive: false };
            message = "User deactivated";
            break;

          case "reactivate":
            updateData = { isActive: true };
            message = "User reactivated";
            break;

          case "updateDepartment":
            updateData = { department: data.department };
            message = "User department updated";
            break;

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        await User.findByIdAndUpdate(userId, updateData);
        results.push({
          userId,
          action,
          success: true,
          message,
          user: {
            id: user._id,
            username: user.username,
            fullName: user.fullName,
            role: action === "promote" ? "admin" : action === "demote" ? "user" : user.role,
            isActive: action === "deactivate" ? false : action === "reactivate" ? true : user.isActive,
            department: action === "updateDepartment" ? data.department : user.department,
          },
        });
        successCount++;

      } catch (error) {
        results.push({
          userId,
          action,
          success: false,
          error: error.message,
        });
        failureCount++;
      }
    }

    res.json({
      message: `Bulk operations completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: operations.length,
        successful: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error("Bulk user operations error:", error);
    res.status(500).json({ error: "Failed to perform bulk user operations" });
  }
};



