import mongoose from "mongoose";

// Define sub-schemas for nested objects
const BiosSchema = new mongoose.Schema(
  {
    manufacturer: { type: String, default: "Unknown" },
    version: { type: String, default: "Unknown" },
    release_date: { type: String, default: "Unknown" },
  },
  { _id: false }
);

const MemorySlotSchema = new mongoose.Schema(
  {
    capacity: { type: String, default: "Unknown" },
    speed: { type: String, default: "Unknown" },
    type: { type: mongoose.Schema.Types.Mixed, default: "Unknown" },
    form_factor: { type: mongoose.Schema.Types.Mixed, default: "Unknown" },
    manufacturer: { type: String, default: "Unknown" },
    // Component warranty information
    component_info: {
      purchase_date: { type: Date, default: null },
      warranty_expiry: { type: Date, default: null },
      serial_number: { type: String, default: "Unknown" },
      model_number: { type: String, default: "Unknown" },
      vendor: { type: String, default: "Unknown" },
      cost: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
    },
  },
  { _id: false }
);

const StorageDriveSchema = new mongoose.Schema(
  {
    model: { type: String, default: "Unknown" },
    size: { type: String, default: "Unknown" },
    media_type: { type: String, default: "Unknown" },
    interface: { type: String, default: "Unknown" },
    // Component warranty information
    component_info: {
      purchase_date: { type: Date, default: null },
      warranty_expiry: { type: Date, default: null },
      serial_number: { type: String, default: "Unknown" },
      model_number: { type: String, default: "Unknown" },
      vendor: { type: String, default: "Unknown" },
      cost: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
    },
  },
  { _id: false }
);

const PartitionSchema = new mongoose.Schema(
  {
    device: { type: String, required: true },
    mountpoint: { type: String, required: true },
    filesystem: { type: String, default: "Unknown" },
    total: { type: String, default: "0 GB" },
    used: { type: String, default: "0 GB" },
    free: { type: String, default: "0 GB" },
    percentage: { type: String, default: "0%" },
  },
  { _id: false }
);

const GpuSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Unknown" },
    memory: { type: String, default: "Unknown" },
    driver_version: { type: String, default: "Unknown" },
    processor: { type: String, default: "Unknown" },
    memory_total: { type: String },
    memory_used: { type: String },
    memory_free: { type: String },
    temperature: { type: String },
    load: { type: String },
    uuid: { type: String },
    type: { type: String },
    vendor: { type: String },
    // Component warranty information
    component_info: {
      purchase_date: { type: Date, default: null },
      warranty_expiry: { type: Date, default: null },
      serial_number: { type: String, default: "Unknown" },
      model_number: { type: String, default: "Unknown" },
      vendor: { type: String, default: "Unknown" },
      cost: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
    },
  },
  { _id: false }
);

const BatterySchema = new mongoose.Schema(
  {
    percent: { type: String, default: "0%" },
    power_plugged: { type: Boolean, default: false },
    time_left: { type: String, default: "Unknown" },
  },
  { _id: false }
);

const TemperatureEntrySchema = new mongoose.Schema(
  {
    label: { type: String, default: "Unknown" },
    current: { type: String, default: "N/A" },
    high: { type: String, default: "N/A" },
    critical: { type: String, default: "N/A" },
  },
  { _id: false }
);

// Main Hardware Schema
const HardwareSchema = new mongoose.Schema(
  {
    // System Information
    _id: String,
    system: {
      platform: { type: String, required: true },
      platform_release: { type: String, default: "Unknown" },
      platform_version: { type: String, default: "Unknown" },
      architecture: { type: String, default: "Unknown" },
      hostname: { type: String, required: true },
      processor: { type: String, default: "Unknown" },
      python_version: { type: String },
      boot_time: { type: String },
      uptime: { type: String },
      mac_address: { type: String, required: true },
    },

    // Asset Management Information
    asset_info: {
      purchase_date: { type: Date, default: null },
      warranty_expiry: { type: Date, default: null },
      vendor: { type: String, default: "Unknown" },
      model: { type: String, default: "Unknown" },
      serial_number: { type: String, default: "Unknown" },
      asset_tag: { type: String, default: "Unknown" },
      location: { type: String, default: "Unknown" },
      department: { type: String, default: "Unknown" },
      cost: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
      // Manual entry specific fields
      entry_type: { type: String, enum: ["scanner", "manual"], default: "scanner" },
      category: { type: String, default: "Unknown" },
      created_manually_at: { type: Date, default: null },
      created_manually_by: { type: String, default: null },
      status: { type: String, default: "Active" },
    },

    // CPU Information
    cpu: {
      name: { type: String, required: true },
      physical_cores: { type: Number, default: 0 },
      logical_cores: { type: Number, default: 0 },
      max_frequency: { type: String, default: "Unknown" },
      min_frequency: { type: String, default: "Unknown" },
      current_frequency: { type: String, default: "Unknown" },
      architecture: { type: String, default: "Unknown" },
      cache_info: { type: mongoose.Schema.Types.Mixed, default: {} },
      features: { type: [String], default: [] },
      manufacturer: { type: String, default: "Unknown" },
      family: { type: mongoose.Schema.Types.Mixed },
      model: { type: mongoose.Schema.Types.Mixed },
      stepping: { type: mongoose.Schema.Types.Mixed },
      max_clock_speed: { type: String, default: "Unknown" },
      l2_cache: { type: String, default: "Unknown" },
      l3_cache: { type: String, default: "Unknown" },
      vendor: { type: String },
      cache_size: { type: String },
      // Component warranty information
      component_info: {
        purchase_date: { type: Date, default: null },
        warranty_expiry: { type: Date, default: null },
        serial_number: { type: String, default: "Unknown" },
        model_number: { type: String, default: "Unknown" },
        vendor: { type: String, default: "Unknown" },
        cost: { type: Number, default: 0 },
        currency: { type: String, default: "USD" },
      },
    },

    // Memory Information
    memory: {
      total: { type: String, default: "0 GB" },
      available: { type: String, default: "0 GB" },
      used: { type: String, default: "0 GB" },
      percentage: { type: String, default: "0%" },
      slots: { type: [MemorySlotSchema], default: [] },
      type: { type: String },
      speed: { type: String },
      total_physical: { type: String, default: "0 GB" },
      slot_count: { type: Number, default: 0 },
      swap_total: { type: String },
    },

    // Storage Information
    storage: {
      drives: { type: [StorageDriveSchema], default: [] },
      total_capacity: { type: String, default: "0 GB" },
      partitions: { type: [PartitionSchema], default: [] },
    },

    // Network Information
    network: {
      interfaces: { type: mongoose.Schema.Types.Mixed, default: [] },
    },

    // Graphics Information
    graphics: {
      gpus: { type: [GpuSchema], default: [] },
    },

    // Motherboard Information
    motherboard: {
      manufacturer: { type: String, default: "Unknown" },
      model: { type: String, default: "Unknown" },
      version: { type: String, default: "Unknown" },
      serial_number: { type: String, default: "Unknown" },
      bios: { type: BiosSchema, default: {} },
      boot_rom: { type: String },
    },

    // Power and Thermal Information
    power_thermal: {
      battery: { type: BatterySchema },
      temperatures: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
  },
  {
    _id: false,
    timestamps: true, // Automatically add createdAt and updatedAt
    collection: "hardware_data",
  }
);

// Create indexes for better query performance
HardwareSchema.index({ "system.hostname": 1 });
HardwareSchema.index({ "system.mac_address": 1 });
HardwareSchema.index({ "cpu.name": 1 });
HardwareSchema.index({ createdAt: -1 });
HardwareSchema.index({ "asset_info.purchase_date": -1 });
HardwareSchema.index({ "asset_info.warranty_expiry": 1 });
HardwareSchema.index({ "asset_info.vendor": 1 });
HardwareSchema.index({ "asset_info.department": 1 });

// Virtual field for warranty status
HardwareSchema.virtual("warranty_status").get(function () {
  if (!this.asset_info?.warranty_expiry) {
    return "unknown";
  }

  const today = new Date();
  const warrantyExpiry = new Date(this.asset_info.warranty_expiry);
  const daysUntilExpiry = Math.ceil(
    (warrantyExpiry - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return "expired";
  } else if (daysUntilExpiry <= 30) {
    return "expiring_soon";
  } else {
    return "active";
  }
});

// Virtual field for asset age
HardwareSchema.virtual("asset_age").get(function () {
  if (!this.asset_info?.purchase_date) {
    return "unknown";
  }

  const today = new Date();
  const purchaseDate = new Date(this.asset_info.purchase_date);
  const ageInDays = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
  const ageInYears = Math.floor(ageInDays / 365);
  const remainingDays = ageInDays % 365;
  const ageInMonths = Math.floor(remainingDays / 30);

  if (ageInYears > 0) {
    return `${ageInYears} year${ageInYears > 1 ? "s" : ""}${
      ageInMonths > 0
        ? ` ${ageInMonths} month${ageInMonths > 1 ? "s" : ""}`
        : ""
    }`;
  } else if (ageInMonths > 0) {
    return `${ageInMonths} month${ageInMonths > 1 ? "s" : ""}`;
  } else {
    return `${ageInDays} day${ageInDays > 1 ? "s" : ""}`;
  }
});

// Method to get warranty days remaining
HardwareSchema.methods.getWarrantyDaysRemaining = function () {
  if (!this.asset_info?.warranty_expiry) {
    return null;
  }

  const today = new Date();
  const warrantyExpiry = new Date(this.asset_info.warranty_expiry);
  return Math.ceil((warrantyExpiry - today) / (1000 * 60 * 60 * 24));
};

// Static method to find assets with expiring warranties
HardwareSchema.statics.findExpiringWarranties = function (days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    "asset_info.warranty_expiry": {
      $gte: new Date(),
      $lte: futureDate,
    },
  });
};

// Ensure virtual fields are serialized
HardwareSchema.set("toJSON", { virtuals: true });
HardwareSchema.set("toObject", { virtuals: true });

// Create the model
const Hardware = mongoose.model("Hardware", HardwareSchema);

export default Hardware;
