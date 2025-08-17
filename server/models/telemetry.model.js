import mongoose from 'mongoose';

const SystemTelemetrySchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  mac_address: { type: String, required: true }, // Store MAC addresses, including IPv6
  cpu_percent: { type: Number, required: true }, // CPU usage at the time of data fetch
  ram_percent: { type: Number, required: true }, // RAM usage percentage
  storage_percent: { type: Number, required: true } // Storage usage percentage
});

// Create a Unique index on MAC address + timestamp if needed
// e.g., to prevent duplicate entries for same system and time
// SystemTelemetrySchema.index({ mac_address: 1, timestamp: 1 }, { unique: true });

const SystemTelemetry = mongoose.model('SystemTelemetry', SystemTelemetrySchema);

export default SystemTelemetry;
