import mongoose from 'mongoose';

// Define sub-schemas for nested objects
const BiosSchema = new mongoose.Schema({
  manufacturer: { type: String, default: 'Unknown' },
  version: { type: String, default: 'Unknown' },
  release_date: { type: String, default: 'Unknown' }
}, { _id: false });

const MemorySlotSchema = new mongoose.Schema({
  capacity: { type: String, default: 'Unknown' },
  speed: { type: String, default: 'Unknown' },
  type: { type: mongoose.Schema.Types.Mixed, default: 'Unknown' },
  form_factor: { type: mongoose.Schema.Types.Mixed, default: 'Unknown' },
  manufacturer: { type: String, default: 'Unknown' }
}, { _id: false });

const StorageDriveSchema = new mongoose.Schema({
  model: { type: String, default: 'Unknown' },
  size: { type: String, default: 'Unknown' },
  media_type: { type: String, default: 'Unknown' },
  interface: { type: String, default: 'Unknown' }
}, { _id: false });

const PartitionSchema = new mongoose.Schema({
  device: { type: String, required: true },
  mountpoint: { type: String, required: true },
  filesystem: { type: String, default: 'Unknown' },
  total: { type: String, default: '0 GB' },
  used: { type: String, default: '0 GB' },
  free: { type: String, default: '0 GB' },
  percentage: { type: String, default: '0%' }
}, { _id: false });

const GpuSchema = new mongoose.Schema({
  name: { type: String, default: 'Unknown' },
  memory: { type: String, default: 'Unknown' },
  driver_version: { type: String, default: 'Unknown' },
  processor: { type: String, default: 'Unknown' },
  memory_total: { type: String },
  memory_used: { type: String },
  memory_free: { type: String },
  temperature: { type: String },
  load: { type: String },
  uuid: { type: String },
  type: { type: String },
  vendor: { type: String }
}, { _id: false });

const BatterySchema = new mongoose.Schema({
  percent: { type: String, default: '0%' },
  power_plugged: { type: Boolean, default: false },
  time_left: { type: String, default: 'Unknown' }
}, { _id: false });

const TemperatureEntrySchema = new mongoose.Schema({
  label: { type: String, default: 'Unknown' },
  current: { type: String, default: 'N/A' },
  high: { type: String, default: 'N/A' },
  critical: { type: String, default: 'N/A' }
}, { _id: false });

// Main Hardware Schema
const HardwareSchema = new mongoose.Schema({
  // System Information
  _id: String,
  system: {
    platform: { type: String, required: true },
    platform_release: { type: String, default: 'Unknown' },
    platform_version: { type: String, default: 'Unknown' },
    architecture: { type: String, default: 'Unknown' },
    hostname: { type: String, required: true },
    processor: { type: String, default: 'Unknown' },
    python_version: { type: String },
    boot_time: { type: String },
    uptime: { type: String },
    mac_address: { type: String, required: true }
  },
  
  // CPU Information
  cpu: {
    name: { type: String, required: true },
    physical_cores: { type: Number, default: 0 },
    logical_cores: { type: Number, default: 0 },
    max_frequency: { type: String, default: 'Unknown' },
    min_frequency: { type: String, default: 'Unknown' },
    current_frequency: { type: String, default: 'Unknown' },
    architecture: { type: String, default: 'Unknown' },
    cache_info: { type: mongoose.Schema.Types.Mixed, default: {} },
    features: { type: [String], default: [] },
    manufacturer: { type: String, default: 'Unknown' },
    family: { type: mongoose.Schema.Types.Mixed },
    model: { type: mongoose.Schema.Types.Mixed },
    stepping: { type: mongoose.Schema.Types.Mixed },
    max_clock_speed: { type: String, default: 'Unknown' },
    l2_cache: { type: String, default: 'Unknown' },
    l3_cache: { type: String, default: 'Unknown' },
    vendor: { type: String },
    cache_size: { type: String }
  },
  
  // Memory Information
  memory: {
    total: { type: String, default: '0 GB' },
    available: { type: String, default: '0 GB' },
    used: { type: String, default: '0 GB' },
    percentage: { type: String, default: '0%' },
    slots: { type: [MemorySlotSchema], default: [] },
    type: { type: String },
    speed: { type: String },
    total_physical: { type: String, default: '0 GB' },
    slot_count: { type: Number, default: 0 },
    swap_total: { type: String }
  },
  
  // Storage Information
  storage: {
    drives: { type: [StorageDriveSchema], default: [] },
    total_capacity: { type: String, default: '0 GB' },
    partitions: { type: [PartitionSchema], default: [] }
  },
  
  // Network Information
  network: {
    interfaces: { type: mongoose.Schema.Types.Mixed, default: [] }
  },
  
  // Graphics Information
  graphics: {
    gpus: { type: [GpuSchema], default: [] }
  },
  
  // Motherboard Information
  motherboard: {
    manufacturer: { type: String, default: 'Unknown' },
    model: { type: String, default: 'Unknown' },
    version: { type: String, default: 'Unknown' },
    serial_number: { type: String, default: 'Unknown' },
    bios: { type: BiosSchema, default: {} },
    boot_rom: { type: String }
  },
  
  // Power and Thermal Information
  power_thermal: {
    battery: { type: BatterySchema },
    temperatures: { type: mongoose.Schema.Types.Mixed, default: {} }
  }
}, {
  _id: false,
  timestamps: true, // Automatically add createdAt and updatedAt
  collection: 'hardware_data'
});

// Create indexes for better query performance
HardwareSchema.index({ 'system.hostname': 1 });
HardwareSchema.index({ 'system.mac_address': 1 });
HardwareSchema.index({ 'cpu.name': 1 });
HardwareSchema.index({ createdAt: -1 });

// Create the model
const Hardware = mongoose.model('Hardware', HardwareSchema);

export default Hardware;
