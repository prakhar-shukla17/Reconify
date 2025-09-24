import License from "../models/license.models.js";
import User from "../models/user.models.js";
import Subscription from "../models/subscription.models.js";
import { generateTenantId } from "../utils/tenantUtils.js";
import crypto from "crypto";

// Create a new license
export const createLicense = async (req, res) => {
  try {
    const {
      organization_name,
      organization_domain,
      organization_address,
      license_type,
      valid_from,
      valid_through,
      features,
      restrictions,
      issued_to,
      contact_email,
      contact_phone,
      auto_renew,
      renewal_notice_days,
    } = req.body;

    // Generate tenant ID from organization name
    const tenant_id = generateTenantId(organization_name);

    // Check if license already exists for this tenant
    const existingLicense = await License.findOne({ tenant_id });
    if (existingLicense) {
      return res.status(400).json({
        success: false,
        error: "License already exists for this organization",
      });
    }

    // Create new license
    const license = new License({
      tenant_id,
      organization_name,
      organization_domain,
      organization_address,
      license_type,
      valid_from: valid_from ? new Date(valid_from) : new Date(),
      valid_through: new Date(valid_through),
      features: features || {},
      restrictions: restrictions || {},
      issued_to,
      contact_email,
      contact_phone,
      auto_renew: auto_renew || false,
      renewal_notice_days: renewal_notice_days || 30,
      usage: {
        current_assets: 0,
        current_users: 1,
        scans_this_month: 0,
        last_usage_update: new Date(),
      },
    });

    await license.save();

    res.json({
      success: true,
      license: {
        id: license._id,
        tenant_id: license.tenant_id,
        license_number: license.license_number,
        organization_name: license.organization_name,
        license_type: license.license_type,
        valid_from: license.valid_from,
        valid_through: license.valid_through,
        status: license.status,
        features: license.features,
        restrictions: license.restrictions,
        digital_signature: license.digital_signature,
        issued_by: license.issued_by,
        issued_to: license.issued_to,
        contact_email: license.contact_email,
        isValid: license.isValid,
        isExpired: license.isExpired,
        daysUntilExpiration: license.daysUntilExpiration,
      },
    });
  } catch (error) {
    console.error("Error creating license:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create license",
    });
  }
};

// Get license by tenant ID
export const getLicenseByTenant = async (req, res) => {
  try {
    const { tenant_id } = req.params;

    const license = await License.findOne({ tenant_id });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "License not found",
      });
    }

    res.json({
      success: true,
      license: {
        id: license._id,
        tenant_id: license.tenant_id,
        license_number: license.license_number,
        organization_name: license.organization_name,
        organization_domain: license.organization_domain,
        organization_address: license.organization_address,
        license_type: license.license_type,
        valid_from: license.valid_from,
        valid_through: license.valid_through,
        status: license.status,
        features: license.features,
        restrictions: license.restrictions,
        digital_signature: license.digital_signature,
        signature_algorithm: license.signature_algorithm,
        issued_by: license.issued_by,
        issued_to: license.issued_to,
        contact_email: license.contact_email,
        contact_phone: license.contact_phone,
        auto_renew: license.auto_renew,
        renewal_notice_days: license.renewal_notice_days,
        usage: license.usage,
        isValid: license.isValid,
        isExpired: license.isExpired,
        isExpiringSoon: license.isExpiringSoon,
        daysUntilExpiration: license.daysUntilExpiration,
        created_at: license.createdAt,
        updated_at: license.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching license:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch license",
    });
  }
};

// Get current user's license
export const getCurrentLicense = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const license = await License.findOne({ tenant_id: tenantId });

    if (!license) {
      return res.json({
        success: true,
        license: null,
        status: "no_license",
      });
    }

    res.json({
      success: true,
      license: {
        id: license._id,
        tenant_id: license.tenant_id,
        license_number: license.license_number,
        organization_name: license.organization_name,
        license_type: license.license_type,
        valid_from: license.valid_from,
        valid_through: license.valid_through,
        status: license.status,
        features: license.features,
        usage: license.usage,
        isValid: license.isValid,
        isExpired: license.isExpired,
        isExpiringSoon: license.isExpiringSoon,
        daysUntilExpiration: license.daysUntilExpiration,
      },
    });
  } catch (error) {
    console.error("Error fetching current license:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch current license",
    });
  }
};

// Update license
export const updateLicense = async (req, res) => {
  try {
    const { license_id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.tenant_id;
    delete updateData.license_number;
    delete updateData.digital_signature;
    delete updateData.created_at;
    delete updateData.updated_at;

    const license = await License.findByIdAndUpdate(license_id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "License not found",
      });
    }

    // Regenerate signature after update
    license.digital_signature = license.generateSignature();
    await license.save();

    res.json({
      success: true,
      license: {
        id: license._id,
        tenant_id: license.tenant_id,
        license_number: license.license_number,
        organization_name: license.organization_name,
        license_type: license.license_type,
        valid_from: license.valid_from,
        valid_through: license.valid_through,
        status: license.status,
        features: license.features,
        restrictions: license.restrictions,
        digital_signature: license.digital_signature,
        isValid: license.isValid,
        isExpired: license.isExpired,
        daysUntilExpiration: license.daysUntilExpiration,
      },
    });
  } catch (error) {
    console.error("Error updating license:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update license",
    });
  }
};

// Renew license
export const renewLicense = async (req, res) => {
  try {
    const { license_id } = req.params;
    const { valid_through, auto_renew } = req.body;

    const license = await License.findById(license_id);

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "License not found",
      });
    }

    // Update validity period
    license.valid_through = new Date(valid_through);
    license.status = "active";
    license.auto_renew = auto_renew || license.auto_renew;

    // Regenerate signature
    license.digital_signature = license.generateSignature();
    await license.save();

    res.json({
      success: true,
      message: "License renewed successfully",
      license: {
        id: license._id,
        tenant_id: license.tenant_id,
        license_number: license.license_number,
        valid_through: license.valid_through,
        status: license.status,
        auto_renew: license.auto_renew,
        isValid: license.isValid,
        daysUntilExpiration: license.daysUntilExpiration,
      },
    });
  } catch (error) {
    console.error("Error renewing license:", error);
    res.status(500).json({
      success: false,
      error: "Failed to renew license",
    });
  }
};

// Suspend license
export const suspendLicense = async (req, res) => {
  try {
    const { license_id } = req.params;
    const { reason } = req.body;

    const license = await License.findById(license_id);

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "License not found",
      });
    }

    license.status = "suspended";
    license.metadata.suspension_reason = reason;
    license.metadata.suspended_at = new Date();

    await license.save();

    res.json({
      success: true,
      message: "License suspended successfully",
      license: {
        id: license._id,
        tenant_id: license.tenant_id,
        license_number: license.license_number,
        status: license.status,
        suspension_reason: reason,
      },
    });
  } catch (error) {
    console.error("Error suspending license:", error);
    res.status(500).json({
      success: false,
      error: "Failed to suspend license",
    });
  }
};

// Revoke license
export const revokeLicense = async (req, res) => {
  try {
    const { license_id } = req.params;
    const { reason } = req.body;

    const license = await License.findById(license_id);

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "License not found",
      });
    }

    license.status = "revoked";
    license.metadata.revocation_reason = reason;
    license.metadata.revoked_at = new Date();

    await license.save();

    res.json({
      success: true,
      message: "License revoked successfully",
      license: {
        id: license._id,
        tenant_id: license.tenant_id,
        license_number: license.license_number,
        status: license.status,
        revocation_reason: reason,
      },
    });
  } catch (error) {
    console.error("Error revoking license:", error);
    res.status(500).json({
      success: false,
      error: "Failed to revoke license",
    });
  }
};

// Verify license
export const verifyLicense = async (req, res) => {
  try {
    const { license_number, digital_signature } = req.body;

    const license = await License.findOne({ license_number });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "License not found",
      });
    }

    // Verify digital signature
    const isValidSignature = license.verifySignature();
    const isValidLicense = license.isValid;

    res.json({
      success: true,
      verification: {
        license_found: true,
        valid_signature: isValidSignature,
        valid_license: isValidLicense,
        license_status: license.status,
        organization_name: license.organization_name,
        license_type: license.license_type,
        valid_from: license.valid_from,
        valid_through: license.valid_through,
        days_until_expiration: license.daysUntilExpiration,
        features: license.features,
      },
    });
  } catch (error) {
    console.error("Error verifying license:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify license",
    });
  }
};

// Get license usage
export const getLicenseUsage = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const license = await License.findOne({ tenant_id: tenantId });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "License not found",
      });
    }

    res.json({
      success: true,
      usage: {
        current_assets: license.usage.current_assets,
        current_users: license.usage.current_users,
        scans_this_month: license.usage.scans_this_month,
        last_usage_update: license.usage.last_usage_update,
        limits: {
          max_assets: license.features.max_assets,
          max_users: license.features.max_users,
          max_scans_per_month: license.features.max_scans_per_month,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching license usage:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch license usage",
    });
  }
};

// Update license usage
export const updateLicenseUsage = async (req, res) => {
  try {
    const { action } = req.body;
    const tenantId = req.user.tenant_id;

    const license = await License.findOne({ tenant_id: tenantId });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "License not found",
      });
    }

    // Update usage
    await license.updateUsage(action);

    res.json({
      success: true,
      message: "Usage updated successfully",
      usage: license.usage,
    });
  } catch (error) {
    console.error("Error updating license usage:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update license usage",
    });
  }
};

// Get expiring licenses
export const getExpiringLicenses = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const expiringLicenses = await License.getExpiringLicenses(parseInt(days));

    res.json({
      success: true,
      licenses: expiringLicenses.map((license) => ({
        id: license._id,
        tenant_id: license.tenant_id,
        license_number: license.license_number,
        organization_name: license.organization_name,
        contact_email: license.contact_email,
        valid_through: license.valid_through,
        days_until_expiration: license.daysUntilExpiration,
        auto_renew: license.auto_renew,
      })),
    });
  } catch (error) {
    console.error("Error fetching expiring licenses:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch expiring licenses",
    });
  }
};

// Get license statistics
export const getLicenseStats = async (req, res) => {
  try {
    const stats = await License.getLicenseStats();
    const totalLicenses = await License.countDocuments();
    const activeLicenses = await License.countDocuments({ status: "active" });
    const expiredLicenses = await License.countDocuments({ status: "expired" });

    res.json({
      success: true,
      statistics: {
        total_licenses: totalLicenses,
        active_licenses: activeLicenses,
        expired_licenses: expiredLicenses,
        status_breakdown: stats,
      },
    });
  } catch (error) {
    console.error("Error fetching license statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch license statistics",
    });
  }
};

// Generate license certificate (PDF/JSON)
export const generateLicenseCertificate = async (req, res) => {
  try {
    const { license_id } = req.params;
    const { format = "json" } = req.query;

    const license = await License.findById(license_id);

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "License not found",
      });
    }

    const certificate = {
      license_certificate: {
        license_number: license.license_number,
        organization_name: license.organization_name,
        organization_domain: license.organization_domain,
        license_type: license.license_type,
        valid_from: license.valid_from,
        valid_through: license.valid_through,
        status: license.status,
        features: license.features,
        restrictions: license.restrictions,
        issued_by: license.issued_by,
        issued_to: license.issued_to,
        contact_email: license.contact_email,
        digital_signature: license.digital_signature,
        signature_algorithm: license.signature_algorithm,
        generated_at: new Date().toISOString(),
        certificate_version: "1.0",
      },
    };

    if (format === "json") {
      res.json({
        success: true,
        certificate,
      });
    } else {
      // For PDF format, you would use a library like puppeteer or pdfkit
      // For now, return JSON format
      res.json({
        success: true,
        certificate,
        message: "PDF format not implemented yet. Returning JSON format.",
      });
    }
  } catch (error) {
    console.error("Error generating license certificate:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate license certificate",
    });
  }
};

