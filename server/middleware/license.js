import License from "../models/license.models.js";
import Subscription from "../models/subscription.models.js";

// Middleware to check if user has valid license
export const requireValidLicense = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;

    // Super admins bypass license checks
    if (req.user.role === "superadmin") {
      return next();
    }

    const license = await License.findValidLicense(tenantId);

    if (!license) {
      return res.status(403).json({
        success: false,
        error: "Valid license required",
        code: "LICENSE_REQUIRED",
      });
    }

    if (!license.isValid) {
      return res.status(403).json({
        success: false,
        error: "License is not valid or has expired",
        code: "LICENSE_INVALID",
        license: {
          status: license.status,
          valid_through: license.valid_through,
          days_until_expiration: license.daysUntilExpiration,
        },
      });
    }

    req.license = license;
    next();
  } catch (error) {
    console.error("Error checking license:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify license",
    });
  }
};

// Middleware to check license limits
export const checkLicenseLimits = (action) => {
  return async (req, res, next) => {
    try {
      const tenantId = req.user.tenant_id;

      // Super admins bypass limit checks
      if (req.user.role === "superadmin") {
        return next();
      }

      const license = await License.findValidLicense(tenantId);

      if (!license) {
        // If no license, check against free tier limits
        const freeLimits = {
          max_assets: 100,
          max_users: 5,
          max_scans_per_month: 1000,
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
            limits: freeLimits,
          });
        }

        return next();
      }

      // Check license limits
      const currentUsage = {
        current_assets: license.usage.current_assets,
        current_users: license.usage.current_users,
        scans_this_month: license.usage.scans_this_month,
      };

      if (!license.canPerformAction(action, currentUsage)) {
        return res.status(403).json({
          success: false,
          error: "License limit exceeded",
          code: "LICENSE_LIMIT_EXCEEDED",
          action,
          currentUsage,
          limits: license.features,
          license: {
            license_type: license.license_type,
            status: license.status,
            valid_through: license.valid_through,
          },
        });
      }

      req.license = license;
      next();
    } catch (error) {
      console.error("Error checking license limits:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify license limits",
      });
    }
  };
};

// Middleware to check if user can access feature based on license
export const requireLicenseFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const tenantId = req.user.tenant_id;

      // Super admins have access to all features
      if (req.user.role === "superadmin") {
        return next();
      }

      const license = await License.findValidLicense(tenantId);

      // If no license, check free tier features
      if (!license) {
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
          dedicated_support: false,
        };

        if (!freeFeatures[feature]) {
          return res.status(403).json({
            success: false,
            error: "Feature not available in free tier",
            code: "FEATURE_NOT_AVAILABLE",
            feature,
          });
        }

        return next();
      }

      // Check license features
      if (!license.features[feature]) {
        return res.status(403).json({
          success: false,
          error: "Feature not available in current license",
          code: "FEATURE_NOT_AVAILABLE",
          feature,
          license: {
            license_type: license.license_type,
            status: license.status,
            valid_through: license.valid_through,
          },
        });
      }

      req.license = license;
      next();
    } catch (error) {
      console.error("Error checking license feature access:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify license feature access",
      });
    }
  };
};

// Middleware to update license usage after action
export const updateLicenseUsageAfterAction = (action) => {
  return async (req, res, next) => {
    try {
      // Store original res.json to intercept the response
      const originalJson = res.json;

      res.json = function (data) {
        // Only update usage if the operation was successful
        if (data.success) {
          setImmediate(async () => {
            try {
              const tenantId = req.user.tenant_id;

              const license = await License.findValidLicense(tenantId);

              if (license) {
                await license.updateUsage(action);
              }
            } catch (error) {
              console.error("Error updating license usage:", error);
            }
          });
        }

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Error setting up license usage update:", error);
      next();
    }
  };
};

// Middleware to check license expiration status
export const checkLicenseExpiration = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;

    // Super admins bypass expiration checks
    if (req.user.role === "superadmin") {
      return next();
    }

    const license = await License.findValidLicense(tenantId);

    if (license && license.isExpiringSoon) {
      // Add expiration warning to response headers
      res.setHeader(
        "X-License-Expiration-Warning",
        JSON.stringify({
          days_until_expiration: license.daysUntilExpiration,
          valid_through: license.valid_through,
          auto_renew: license.auto_renew,
        })
      );
    }

    next();
  } catch (error) {
    console.error("Error checking license expiration:", error);
    next(); // Continue even if expiration check fails
  }
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
      scans_this_month: 0,
    };
  } catch (error) {
    console.error("Error getting current usage:", error);
    return {
      current_assets: 0,
      current_users: 1,
      scans_this_month: 0,
    };
  }
};

// Middleware to sync license with subscription
export const syncLicenseWithSubscription = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;

    // Check if there's a subscription that should create/update a license
    const subscription = await Subscription.findOne({
      tenant_id: tenantId,
      status: { $in: ["active", "trialing"] },
    });

    if (subscription) {
      let license = await License.findOne({ tenant_id: tenantId });

      if (!license) {
        // Create license from subscription
        const user = req.user;
        license = new License({
          tenant_id: tenantId,
          organization_name:
            user.organization_name || `${user.firstName} ${user.lastName}`,
          license_type: subscription.plan_type,
          valid_from: subscription.start_date,
          valid_through:
            subscription.end_date ||
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          features: subscription.features,
          issued_to: `${user.firstName} ${user.lastName}`,
          contact_email: user.email,
          status: subscription.status === "active" ? "active" : "active", // Trial licenses are also active
          usage: subscription.usage,
        });

        await license.save();
      } else {
        // Update existing license with subscription data
        license.license_type = subscription.plan_type;
        license.features = subscription.features;
        license.status = subscription.status === "active" ? "active" : "active";
        license.usage = subscription.usage;

        // Regenerate signature
        license.digital_signature = license.generateSignature();
        await license.save();
      }

      req.license = license;
    }

    next();
  } catch (error) {
    console.error("Error syncing license with subscription:", error);
    next(); // Continue even if sync fails
  }
};

