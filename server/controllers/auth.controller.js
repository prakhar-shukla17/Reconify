import User from "../models/user.models.js";
import { generateToken } from "../middleware/auth.js";
import { generateTenantId } from "../utils/tenantUtils.js";

// Register new user
export const register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      department,
      role,
      company,
    } = req.body;

    // Check if user already exists within the same tenant
    const existingUser = await checkUserExistsInTenant(email, req.user?.tenant_id);

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email already exists",
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

    // Store plain password for email (before hashing)
    const plainPassword = password;

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      department,
      role: assignedRole,
      tenant_id: tenantId,
    });

    await user.save();

    // Send credentials email if user was created by admin (in background)
    if (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) {
      setImmediate(async () => {
        try {
          const { sendUserCredentials } = await import("../utils/emailService.js");
          await sendUserCredentials({
            ...user.toObject(),
            plainPassword: plainPassword
          });
          console.log("User credentials email sent successfully");
        } catch (emailError) {
          console.error("Failed to send credentials email:", emailError);
          // Don't fail user creation if email fails
        }
      });
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

// Helper function to check if user exists within tenant
const checkUserExistsInTenant = async (email, tenantId) => {
  if (tenantId) {
    // Check within specific tenant
    return await User.findOne({
      email: email,
      tenant_id: tenantId,
    });
  } else {
    // For public registration, we need to check if email exists in any tenant
    // This prevents conflicts when generating new tenant_id
    return await User.findOne({
      email: email,
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      email: email,
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
      message: `${newAssignments} asset(s) assigned successfully to ${user.role} ${user.firstName} ${user.lastName}`,
      user: {
        id: user._id,
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
      message: `${removedCount} asset(s) removed successfully from ${user.role} ${user.firstName} ${user.lastName}`,
      user: {
        id: user._id,
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
        fullName: user.fullName,
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
      "firstName lastName role assignedAssets department"
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
      email,
      password,
      firstName,
      lastName,
      department,
      role,
      company,
    } = req.body;

    // Check if user already exists within the same tenant
    const existingUser = await checkUserExistsInTenant(email, req.user.tenant_id);

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email already exists",
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

    // Store plain password for email (before hashing)
    const plainPassword = password;

    // Create new user
    const user = new User({
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

    // Send credentials email to the new user (in background)
    setImmediate(async () => {
      try {
        const { sendUserCredentials } = await import("../utils/emailService.js");
        await sendUserCredentials({
          ...user.toObject(),
          plainPassword: plainPassword
        });
        console.log("User credentials email sent successfully");
      } catch (emailError) {
        console.error("Failed to send credentials email:", emailError);
        // Don't fail user creation if email fails
      }
    });

    // Return user data (excluding password)
    const userResponse = {
      id: user._id,
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

// Send email to users
export const sendEmailToUsers = async (req, res) => {
  try {
    const { subject, message, recipients, includeCredentials } = req.body;

    // Validate required fields
    if (!subject || !message || !recipients || recipients.length === 0) {
      return res.status(400).json({
        error: "Subject, message, and recipients are required",
      });
    }

    // Get users based on recipient selection
    let usersToEmail = [];
    
    if (recipients === "all") {
      usersToEmail = await User.find({ tenant_id: req.user.tenant_id });
    } else if (recipients === "active") {
      usersToEmail = await User.find({ 
        tenant_id: req.user.tenant_id, 
        isActive: true 
      });
    } else if (Array.isArray(recipients)) {
      // Custom recipient list (array of email addresses)
      usersToEmail = await User.find({
        email: { $in: recipients },
        tenant_id: req.user.tenant_id
      });
    }

    if (usersToEmail.length === 0) {
      return res.status(400).json({
        error: "No valid recipients found",
      });
    }

    // Send emails to each user in background
    const { sendUserCredentials, sendCustomEmail } = await import("../utils/emailService.js");
    
    // Start sending emails in background and return immediately
    setImmediate(async () => {
      const emailResults = [];
      
      for (const user of usersToEmail) {
        try {
          let emailResult;
          
          if (includeCredentials) {
            // Send email with credentials (for password resets, etc.)
            emailResult = await sendUserCredentials({
              ...user.toObject(),
              plainPassword: "Please contact your administrator for password reset"
            });
          } else {
            // Send custom email
            emailResult = await sendCustomEmail({
              to: user.email,
              subject: subject,
              message: message,
              userName: `${user.firstName} ${user.lastName}`
            });
          }

          emailResults.push({
            user: user.email,
            success: emailResult.success,
            messageId: emailResult.messageId,
            error: emailResult.error
          });
        } catch (error) {
          emailResults.push({
            user: user.email,
            success: false,
            error: error.message
          });
        }
      }

      // Log results after all emails are sent
      const successfulEmails = emailResults.filter(r => r.success).length;
      const failedEmails = emailResults.filter(r => !r.success).length;
      
      console.log(`Bulk email completed: ${successfulEmails} successful, ${failedEmails} failed`);
      console.log('Email results:', emailResults);
    });

    // Return immediately - emails are being sent in background
    res.json({
      success: true,
      message: `Bulk email process started for ${usersToEmail.length} users. Emails are being sent in the background.`,
      results: {
        total: usersToEmail.length,
        status: "Processing in background"
      }
    });

  } catch (error) {
    console.error('Send email to users error:', error);
    res.status(500).json({ error: "Failed to send emails to users" });
  }
};

// Send warranty alert email to specific user
export const sendWarrantyAlertEmail = async (req, res) => {
  try {
    const { alertId, userId, alertData } = req.body;

    // Validate required fields
    if (!alertId || !userId || !alertData) {
      return res.status(400).json({
        error: "Alert ID, user ID, and alert data are required",
      });
    }

    // Check if user exists and belongs to the same tenant
    const user = await User.findOne({
      _id: userId,
      tenant_id: req.user.tenant_id
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // Send warranty alert email in background
    const { sendWarrantyAlertEmail } = await import("../utils/emailService.js");
    
    setImmediate(async () => {
      try {
        const emailResult = await sendWarrantyAlertEmail(alertData, user);
        
        if (emailResult.success) {
          console.log(`Warranty alert email sent successfully to ${user.email} for alert ${alertId}`);
        } else {
          console.error(`Failed to send warranty alert email to ${user.email}:`, emailResult.error);
        }
      } catch (error) {
        console.error(`Error sending warranty alert email to ${user.email}:`, error);
      }
    });

    // Return immediately - email is being sent in background
    res.json({
      success: true,
      message: `Warranty alert email is being sent to ${user.email}`,
      results: {
        user: user.email,
        alertId: alertId,
        status: "Processing in background"
      }
    });

  } catch (error) {
    console.error('Send warranty alert email error:', error);
    res.status(500).json({ error: "Failed to send warranty alert email" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    console.log("=== deleteUser called ===");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    console.log("Request user:", req.user);
    
    const { userId } = req.params;

    // Check if user exists and belongs to the same tenant
    const user = await User.findOne({
      _id: userId,
      tenant_id: req.user.tenant_id
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // Prevent deletion of superadmin accounts (unless by another superadmin)
    if (user.role === "superadmin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        error: "Only superadmins can delete superadmin accounts"
      });
    }

    // Prevent deletion of own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: "Cannot delete your own account"
      });
    }

    // Check if user has assigned assets
    if (user.assignedAssets && user.assignedAssets.length > 0) {
      return res.status(400).json({
        error: "Cannot delete user with assigned assets. Please remove all asset assignments first."
      });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    console.log("=== updateUser called ===");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    console.log("Request user:", req.user);
    
    const { userId } = req.params;
    const updateData = req.body;

    // Check if user exists and belongs to the same tenant
    const user = await User.findOne({
      _id: userId,
      tenant_id: req.user.tenant_id
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // Prevent updating superadmin accounts (unless by another superadmin)
    if (user.role === "superadmin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        error: "Only superadmins can modify superadmin accounts"
      });
    }

    // Prevent role escalation (regular admins can't create other admins)
    if (req.user.role === "admin" && updateData.role === "admin") {
      return res.status(403).json({
        error: "Regular admins cannot create or modify admin accounts"
      });
    }

    // Fields that can be updated
    const allowedFields = ['firstName', 'lastName', 'email', 'department', 'role', 'isActive'];
    const filteredUpdateData = {};

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    });

    // Check if email is being updated and if it already exists
    if (updateData.email && updateData.email !== user.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json({
          error: "Invalid email format"
        });
      }

      const existingUserWithEmail = await User.findOne({
        email: updateData.email,
        tenant_id: req.user.tenant_id,
        _id: { $ne: userId } // Exclude current user from check
      });

      if (existingUserWithEmail) {
        return res.status(400).json({
          error: "Email address is already in use by another user"
        });
      }
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      filteredUpdateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        department: updatedUser.department,
        isActive: updatedUser.isActive
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: "Failed to update user" });
  }
};
