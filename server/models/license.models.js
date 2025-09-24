import mongoose from "mongoose";
import crypto from "crypto";

const LicenseSchema = new mongoose.Schema(
  {
    // Tenant ID as the primary license identifier
    tenant_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Organization information
    organization_name: {
      type: String,
      required: true,
    },
    organization_domain: {
      type: String,
    },
    organization_address: {
      street: String,
      city: String,
      state: String,
      postal_code: String,
      country: String,
    },

    // License details
    license_number: {
      type: String,
      required: true,
      unique: true,
    }, // This will be the tenant_id
    license_type: {
      type: String,
      enum: ["trial", "basic", "professional", "enterprise", "custom"],
      required: true,
    },

    // Validity period
    issued_date: {
      type: Date,
      default: Date.now,
    },
    valid_from: {
      type: Date,
      required: true,
    },
    valid_through: {
      type: Date,
      required: true,
    },

    // License status
    status: {
      type: String,
      enum: ["active", "expired", "suspended", "revoked"],
      default: "active",
    },

    // License features and limits
    features: {
      max_assets: { type: Number, default: 100 },
      max_users: { type: Number, default: 5 },
      max_scans_per_month: { type: Number, default: 1000 },
      api_access: { type: Boolean, default: false },
      priority_support: { type: Boolean, default: false },
      custom_branding: { type: Boolean, default: false },
      advanced_analytics: { type: Boolean, default: false },
      data_export: { type: Boolean, default: true },
      patch_management: { type: Boolean, default: false },
      compliance_reporting: { type: Boolean, default: false },
      sso_integration: { type: Boolean, default: false },
      custom_integrations: { type: Boolean, default: false },
      white_label: { type: Boolean, default: false },
      dedicated_support: { type: Boolean, default: false },
    },

    // License restrictions
    restrictions: {
      allowed_domains: [{ type: String }],
      allowed_ips: [{ type: String }],
      max_concurrent_users: { type: Number },
      geographic_restrictions: [{ type: String }],
    },

    // Digital signature and verification
    digital_signature: {
      type: String,
      required: true,
    },
    signature_algorithm: {
      type: String,
      default: "SHA256",
    },

    // License metadata
    issued_by: {
      type: String,
      default: "ITAM Platform",
    },
    issued_to: {
      type: String,
      required: true,
    },
    contact_email: {
      type: String,
      required: true,
    },
    contact_phone: {
      type: String,
    },

    // Renewal information
    auto_renew: {
      type: Boolean,
      default: false,
    },
    renewal_notice_days: {
      type: Number,
      default: 30,
    },

    // Usage tracking
    usage: {
      current_assets: { type: Number, default: 0 },
      current_users: { type: Number, default: 1 },
      scans_this_month: { type: Number, default: 0 },
      last_usage_update: { type: Date, default: Date.now },
    },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
LicenseSchema.index({ tenant_id: 1, status: 1 });
LicenseSchema.index({ license_number: 1 });
LicenseSchema.index({ valid_through: 1 });
LicenseSchema.index({ organization_name: 1 });

// Virtual for checking if license is valid
LicenseSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.status === "active" &&
    this.valid_from <= now &&
    this.valid_through >= now
  );
});

// Virtual for checking if license is expired
LicenseSchema.virtual("isExpired").get(function () {
  return this.valid_through < new Date();
});

// Virtual for checking if license is expiring soon
LicenseSchema.virtual("isExpiringSoon").get(function () {
  const now = new Date();
  const expirationDate = new Date(this.valid_through);
  const daysUntilExpiration = Math.ceil(
    (expirationDate - now) / (1000 * 60 * 60 * 24)
  );
  return (
    daysUntilExpiration <= this.renewal_notice_days && daysUntilExpiration > 0
  );
});

// Virtual for days until expiration
LicenseSchema.virtual("daysUntilExpiration").get(function () {
  const now = new Date();
  const expirationDate = new Date(this.valid_through);
  return Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
});

// Method to generate digital signature
LicenseSchema.methods.generateSignature = function () {
  const licenseData = {
    tenant_id: this.tenant_id,
    organization_name: this.organization_name,
    license_number: this.license_number,
    license_type: this.license_type,
    valid_from: this.valid_from,
    valid_through: this.valid_through,
    features: this.features,
    issued_by: this.issued_by,
    issued_to: this.issued_to,
  };

  const dataString = JSON.stringify(
    licenseData,
    Object.keys(licenseData).sort()
  );
  const secretKey = process.env.LICENSE_SECRET_KEY || "default-secret-key";

  return crypto
    .createHmac("sha256", secretKey)
    .update(dataString)
    .digest("hex");
};

// Method to verify digital signature
LicenseSchema.methods.verifySignature = function () {
  const expectedSignature = this.generateSignature();
  return this.digital_signature === expectedSignature;
};

// Method to check if user can perform action based on license limits
LicenseSchema.methods.canPerformAction = function (action, currentCount = 0) {
  if (!this.isValid) {
    return false;
  }

  const limits = this.features;

  switch (action) {
    case "add_asset":
      return currentCount < limits.max_assets;
    case "add_user":
      return currentCount < limits.max_users;
    case "perform_scan":
      return this.usage.scans_this_month < limits.max_scans_per_month;
    case "use_api":
      return limits.api_access;
    default:
      return true;
  }
};

// Method to update usage
LicenseSchema.methods.updateUsage = function (action) {
  switch (action) {
    case "asset_added":
      this.usage.current_assets += 1;
      break;
    case "asset_removed":
      this.usage.current_assets = Math.max(0, this.usage.current_assets - 1);
      break;
    case "user_added":
      this.usage.current_users += 1;
      break;
    case "user_removed":
      this.usage.current_users = Math.max(1, this.usage.current_users - 1);
      break;
    case "scan_performed":
      this.usage.scans_this_month += 1;
      break;
  }

  this.usage.last_usage_update = new Date();
  return this.save();
};

// Static method to generate license number from tenant ID
LicenseSchema.statics.generateLicenseNumber = function (tenantId) {
  return `LIC-${tenantId.toUpperCase()}`;
};

// Static method to find valid license for tenant
LicenseSchema.statics.findValidLicense = function (tenantId) {
  return this.findOne({
    tenant_id: tenantId,
    status: "active",
    valid_from: { $lte: new Date() },
    valid_through: { $gte: new Date() },
  });
};

// Static method to get expiring licenses
LicenseSchema.statics.getExpiringLicenses = function (days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    status: "active",
    valid_through: { $lte: futureDate, $gte: new Date() },
  });
};

// Static method to get license statistics
LicenseSchema.statics.getLicenseStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

// Pre-save middleware to generate license number and signature
LicenseSchema.pre("save", function (next) {
  if (this.isNew) {
    // Generate license number from tenant ID
    this.license_number = this.constructor.generateLicenseNumber(
      this.tenant_id
    );

    // Generate digital signature
    this.digital_signature = this.generateSignature();
  }

  next();
});

export default mongoose.model("License", LicenseSchema);

