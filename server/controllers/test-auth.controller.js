import jwt from "jsonwebtoken";
import User from "../models/user.models.js";
import Subscription from "../models/subscription.models.js";

// Get JWT secret dynamically to ensure environment variables are loaded
const getJWTSecret = () => process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Create a test user and token for development
export const createTestUser = async (req, res) => {
  try {
    // Check if test user already exists
    let testUser = await User.findOne({ email: "test@example.com" });

    if (!testUser) {
      // Create test user
      testUser = new User({
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        password: "password123", // This will be hashed
        role: "admin",
        tenant_id: "test-tenant-123",
        organization_name: "Test Organization",
        subscription_status: "free",
      });

      await testUser.save();
    }

    // Create JWT token with longer expiration for testing
    const token = jwt.sign(
      {
        userId: testUser._id,
        email: testUser.email,
        role: testUser.role,
        tenant_id: testUser.tenant_id,
        organization_name: testUser.organization_name,
      },
      getJWTSecret(),
      { expiresIn: "24h" } // 24 hours for testing
    );

    res.json({
      success: true,
      message: "Test user created and token generated",
      user: {
        id: testUser._id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
        tenant_id: testUser.tenant_id,
        organization_name: testUser.organization_name,
      },
      token: token,
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create test user",
    });
  }
};

// Refresh token for existing user
export const refreshToken = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Create new JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        organization_name: user.organization_name,
      },
      getJWTSecret(),
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      token: token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant_id: user.tenant_id,
        organization_name: user.organization_name,
      },
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh token",
    });
  }
};

// Auto-refresh token (no email required, uses test user)
export const autoRefreshToken = async (req, res) => {
  try {
    // Find or create test user
    let testUser = await User.findOne({ email: "test@example.com" });

    if (!testUser) {
      // Create test user if it doesn't exist
      testUser = new User({
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        password: "password123",
        role: "admin",
        tenant_id: "test-tenant-123",
        organization_name: "Test Organization",
        subscription_status: "free",
      });
      await testUser.save();
    }

    // Create new JWT token  
    const jwtSecret = getJWTSecret();
    console.log("JWT_SECRET being used for token creation:", jwtSecret);
    
    const token = jwt.sign(
      {
        userId: testUser._id,
        email: testUser.email,
        role: testUser.role,
        tenant_id: testUser.tenant_id,
        organization_name: testUser.organization_name,
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Token auto-refreshed successfully",
      token: token,
      user: {
        id: testUser._id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
        tenant_id: testUser.tenant_id,
        organization_name: testUser.organization_name,
      },
    });
  } catch (error) {
    console.error("Error auto-refreshing token:", error);
    res.status(500).json({
      success: false,
      error: "Failed to auto-refresh token",
    });
  }
};

// Clear test user subscriptions for testing
export const clearTestSubscriptions = async (req, res) => {
  try {
    console.log("🔧 DEBUG - Clearing test subscriptions...");
    
    // Clear all subscriptions for test users
    const result = await Subscription.deleteMany({
      tenant_id: "test-tenant-123"
    });
    
    console.log("🔧 DEBUG - Cleared test subscriptions:", result.deletedCount);
    
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} test subscriptions`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("🔧 DEBUG - Error clearing test subscriptions:", error);
    console.error("🔧 DEBUG - Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to clear test subscriptions"
    });
  }
};
