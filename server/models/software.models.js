import mongoose from "mongoose";

// Define sub-schemas for nested objects
const InstalledSoftwareSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    version: { type: String, default: "Unknown" },
    vendor: { type: String, default: "Unknown" },
    install_date: { type: String, default: "Unknown" },
    install_location: { type: String, default: "Unknown" },
    size: { type: String, default: "Unknown" },
    registry_key: { type: String }, // Windows specific
  },
  { _id: false }
);

const SystemServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    display_name: { type: String, default: "Unknown" },
    state: { type: String, default: "Unknown" },
  },
  { _id: false }
);

const StartupProgramSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    command: { type: String, default: "Unknown" },
    location: { type: String, default: "Unknown" },
  },
  { _id: false }
);

const BrowserExtensionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    version: { type: String, default: "Unknown" },
    browser: { type: String, default: "Unknown" },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

// Main Software Schema
const SoftwareSchema = new mongoose.Schema(
  {
    // Tenant ID for multi-tenancy
    tenant_id: { type: String, required: true, index: true },
    
    // Use MAC address as the primary key to link with hardware
    _id: { type: String, required: true }, // MAC address

    // System Information (linked to hardware)
    system: {
      platform: { type: String, required: true },
      platform_release: { type: String, default: "Unknown" },
      platform_version: { type: String, default: "Unknown" },
      architecture: { type: String, default: "Unknown" },
      hostname: { type: String, required: true },
      mac_address: { type: String, required: true },
      scan_timestamp: { type: String, required: true },
      python_version: { type: String, default: "Unknown" },
    },

    // Installed Software Information
    installed_software: {
      type: [InstalledSoftwareSchema],
      default: [],
    },

    // System Software (OS components, drivers, etc.)
    system_software: {
      type: [InstalledSoftwareSchema],
      default: [],
    },

    // Browser Extensions
    browser_extensions: {
      type: [BrowserExtensionSchema],
      default: [],
    },

    // System Services
    services: {
      type: [SystemServiceSchema],
      default: [],
    },

    // Startup Programs
    startup_programs: {
      type: [StartupProgramSchema],
      default: [],
    },

    // Metadata
    scan_metadata: {
      total_software_count: { type: Number, default: 0 },
      scan_duration: { type: String, default: "Unknown" },
      scanner_version: { type: String, default: "1.0" },
      last_updated: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
    collection: "software_inventory",
  }
);

// Indexes for better query performance
SoftwareSchema.index({ "system.hostname": 1 });
SoftwareSchema.index({ "system.mac_address": 1 });
SoftwareSchema.index({ "system.platform": 1 });
SoftwareSchema.index({ "installed_software.name": 1 });
SoftwareSchema.index({ "installed_software.vendor": 1 });
SoftwareSchema.index({ "scan_metadata.last_updated": -1 });

// Pre-save middleware to calculate total software count
SoftwareSchema.pre("save", function (next) {
  this.scan_metadata.total_software_count =
    this.installed_software.length +
    this.system_software.length +
    this.browser_extensions.length;

  this.scan_metadata.last_updated = new Date();
  next();
});

// Virtual for getting software by category
SoftwareSchema.virtual("software_summary").get(function () {
  return {
    installed_software_count: this.installed_software.length,
    system_software_count: this.system_software.length,
    browser_extensions_count: this.browser_extensions.length,
    services_count: this.services.length,
    startup_programs_count: this.startup_programs.length,
    total_count: this.scan_metadata.total_software_count,
  };
});

// Method to get software by vendor
SoftwareSchema.methods.getSoftwareByVendor = function (vendor) {
  return this.installed_software.filter((software) =>
    software.vendor.toLowerCase().includes(vendor.toLowerCase())
  );
};

// Method to get outdated software (placeholder - would need version comparison logic)
SoftwareSchema.methods.getOutdatedSoftware = function () {
  // This would require integration with vulnerability databases
  // For now, return software with "Unknown" versions as potentially outdated
  return this.installed_software.filter(
    (software) =>
      software.version === "Unknown" || software.version.includes("old")
  );
};

// Static method to get software statistics
SoftwareSchema.statics.getSoftwareStatistics = async function () {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: null,
          total_systems: { $sum: 1 },
          avg_software_per_system: {
            $avg: "$scan_metadata.total_software_count",
          },
          total_software_packages: {
            $sum: "$scan_metadata.total_software_count",
          },
        },
      },
    ]);

    const vendorStats = await this.aggregate([
      { $unwind: "$installed_software" },
      {
        $group: {
          _id: "$installed_software.vendor",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const platformStats = await this.aggregate([
      {
        $group: {
          _id: "$system.platform",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      overview: stats[0] || {
        total_systems: 0,
        avg_software_per_system: 0,
        total_software_packages: 0,
      },
      top_vendors: vendorStats,
      platform_distribution: platformStats,
    };
  } catch (error) {
    throw new Error(`Error getting software statistics: ${error.message}`);
  }
};

// Ensure virtual fields are serialized
SoftwareSchema.set("toJSON", { virtuals: true });
SoftwareSchema.set("toObject", { virtuals: true });

const Software = mongoose.model("Software", SoftwareSchema);
export default Software;

