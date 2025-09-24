import Subscription from "../models/subscription.models.js";
import User from "../models/user.models.js";

// Middleware to check if user has active subscription
export const requireActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    // Super admins bypass subscription checks
    if (req.user.role === "superadmin") {
      return next();
    }

    const subscription = await Subscription.findOne({
      user_id: userId,
      tenant_id: tenantId,
      status: { $in: ["active", "trialing"] }
    });

    if (!subscription || !subscription.isActive) {
      return res.status(403).json({
        success: false,
        error: "Active subscription required",
        code: "SUBSCRIPTION_REQUIRED"
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify subscription"
    });
  }
};

// Middleware to check subscription limits
export const checkSubscriptionLimits = (action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const tenantId = req.user.tenant_id;

      // Super admins bypass limit checks
      if (req.user.role === "superadmin") {
        return next();
      }

      const subscription = await Subscription.findOne({
        user_id: userId,
        tenant_id: tenantId,
        status: { $in: ["active", "trialing"] }
      });

      if (!subscription) {
        // If no subscription, check against free tier limits
        const freeLimits = {
          max_assets: 100,
          max_users: 5,
          max_scans_per_month: 1000
        };

        // Get current usage from database
        const currentUsage = await getCurrentUsage(tenantId);
        
        if (!checkLimit(action, currentUsage, freeLimits)) {
          return res.status(403).json({
            success: false,
            error: "Free tier limit exceeded",
            code: "LIMIT_EXCEEDED",
            action,
            currentUsage,
            limits: freeLimits
          });
        }

        return next();
      }

      // Check subscription limits
      const currentUsage = {
        current_assets: subscription.usage.current_assets,
        current_users: subscription.usage.current_users,
        scans_this_month: subscription.usage.scans_this_month
      };

      if (!subscription.canPerformAction(action, currentUsage)) {
        return res.status(403).json({
          success: false,
          error: "Subscription limit exceeded",
          code: "SUBSCRIPTION_LIMIT_EXCEEDED",
          action,
          currentUsage,
          limits: subscription.features,
          subscription: {
            plan_type: subscription.plan_type,
            status: subscription.status
          }
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error("Error checking subscription limits:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify subscription limits"
      });
    }
  };
};

// Helper function to check limits
const checkLimit = (action, currentUsage, limits) => {
  switch (action) {
    case "add_asset":
      return currentUsage.current_assets < limits.max_assets;
    case "add_user":
      return currentUsage.current_users < limits.max_users;
    case "perform_scan":
      return currentUsage.scans_this_month < limits.max_scans_per_month;
    default:
      return true;
  }
};

// Helper function to get current usage for tenant
const getCurrentUsage = async (tenantId) => {
  try {
    // This would typically aggregate usage from various collections
    // For now, return placeholder data
    return {
      current_assets: 0,
      current_users: 1,
      scans_this_month: 0
    };
  } catch (error) {
    console.error("Error getting current usage:", error);
    return {
      current_assets: 0,
      current_users: 1,
      scans_this_month: 0
    };
  }
};

// Middleware to check if user can access feature
export const requireFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const tenantId = req.user.tenant_id;

      // Super admins have access to all features
      if (req.user.role === "superadmin") {
        return next();
      }

      const subscription = await Subscription.findOne({
        user_id: userId,
        tenant_id: tenantId,
        status: { $in: ["active", "trialing"] }
      });

      // If no subscription, check free tier features
      if (!subscription) {
        const freeFeatures = {
          api_access: false,
          priority_support: false,
          custom_branding: false,
          advanced_analytics: false,
          data_export: true,
          patch_management: false,
          compliance_reporting: false,
          sso_integration: false,
          custom_integrations: false,
          white_label: false,
          dedicated_support: false
        };

        if (!freeFeatures[feature]) {
          return res.status(403).json({
            success: false,
            error: "Feature not available in free tier",
            code: "FEATURE_NOT_AVAILABLE",
            feature
          });
        }

        return next();
      }

      // Check subscription features
      if (!subscription.features[feature]) {
        return res.status(403).json({
          success: false,
          error: "Feature not available in current plan",
          code: "FEATURE_NOT_AVAILABLE",
          feature,
          subscription: {
            plan_type: subscription.plan_type,
            status: subscription.status
          }
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error("Error checking feature access:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify feature access"
      });
    }
  };
};

// Middleware to update usage after action
export const updateUsageAfterAction = (action) => {
  return async (req, res, next) => {
    try {
      // Store original res.json to intercept the response
      const originalJson = res.json;
      
      res.json = function(data) {
        // Only update usage if the operation was successful
        if (data.success) {
          setImmediate(async () => {
            try {
              const userId = req.user.userId;
              const tenantId = req.user.tenant_id;

              const subscription = await Subscription.findOne({
                user_id: userId,
                tenant_id: tenantId,
                status: { $in: ["active", "trialing"] }
              });

              if (subscription) {
                await subscription.updateUsage(action);
              }
            } catch (error) {
              console.error("Error updating usage:", error);
            }
          });
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Error setting up usage update:", error);
      next();
    }
  };
};

// Middleware to check trial status
export const checkTrialStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    // Super admins bypass trial checks
    if (req.user.role === "superadmin") {
      return next();
    }

    const subscription = await Subscription.findOne({
      user_id: userId,
      tenant_id: tenantId,
      status: "trialing"
    });

    if (subscription && subscription.isTrial) {
      const daysRemaining = Math.ceil(
        (subscription.trial_end_date - new Date()) / (1000 * 60 * 60 * 24)
      );

      // Add trial info to request
      req.trialInfo = {
        isTrial: true,
        daysRemaining,
        trialEndDate: subscription.trial_end_date
      };
    }

    next();
  } catch (error) {
    console.error("Error checking trial status:", error);
    next(); // Continue even if trial check fails
  }
};






