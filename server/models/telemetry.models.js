import mongoose from "mongoose";

const TelemetryDataSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  cpu_percent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  ram_percent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  storage_percent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  temperature: {
    type: Number,
    min: 0,
    max: 150, // Celsius
  },
  network_io: {
    bytes_sent: { type: Number, default: 0 },
    bytes_recv: { type: Number, default: 0 },
  },
  disk_io: {
    read_bytes: { type: Number, default: 0 },
    write_bytes: { type: Number, default: 0 },
  },
});

const HealthAnalysisSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  overall_health_score: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  health_status: {
    type: String,
    enum: ["excellent", "good", "warning", "critical"],
    required: true,
  },
  anomalies_detected: [
    {
      type: {
        type: String,
        enum: [
          "cpu_spike",
          "memory_leak",
          "storage_full",
          "temperature_high",
          "unusual_activity",
        ],
      },
      severity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
      description: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
    },
  ],
  predictions: {
    storage_full_in_days: Number,
    memory_pressure_risk: Number,
    performance_degradation_risk: Number,
  },
  recommendations: [String],
});

const TelemetrySchema = new mongoose.Schema(
  {
    mac_address: {
      type: String,
      required: true,
      index: true,
      ref: "Hardware",
    },
    current_data: TelemetryDataSchema,
    historical_data: [TelemetryDataSchema],
    health_analysis: HealthAnalysisSchema,
    alerts: [
      {
        type: {
          type: String,
          enum: [
            "storage_warning",
            "cpu_overload",
            "memory_pressure",
            "temperature_alert",
            "anomaly_detected",
          ],
        },
        severity: {
          type: String,
          enum: ["info", "warning", "critical"],
        },
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        acknowledged: {
          type: Boolean,
          default: false,
        },
      },
    ],
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
TelemetrySchema.index({ mac_address: 1, last_updated: -1 });
TelemetrySchema.index({ "health_analysis.health_status": 1 });
TelemetrySchema.index({ "alerts.severity": 1, "alerts.acknowledged": 1 });

// Static method to clean old historical data (keep last 30 days)
TelemetrySchema.statics.cleanOldData = async function (daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  await this.updateMany(
    {},
    {
      $pull: {
        historical_data: {
          timestamp: { $lt: cutoffDate },
        },
      },
    }
  );
};

// Instance method to add new telemetry data
TelemetrySchema.methods.addTelemetryData = function (newData) {
  // Move current data to historical
  if (this.current_data) {
    this.historical_data.push(this.current_data);
  }

  // Set new current data
  this.current_data = newData;
  this.last_updated = new Date();

  // Keep only last 100 historical entries per asset
  if (this.historical_data.length > 100) {
    this.historical_data = this.historical_data.slice(-100);
  }
};

// Instance method to calculate health trends
TelemetrySchema.methods.getHealthTrends = function (hours = 24) {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);

  const recentData = this.historical_data.filter(
    (data) => data.timestamp >= cutoffTime
  );

  if (recentData.length < 2) {
    return null;
  }

  const avgCpu =
    recentData.reduce((sum, d) => sum + d.cpu_percent, 0) / recentData.length;
  const avgRam =
    recentData.reduce((sum, d) => sum + d.ram_percent, 0) / recentData.length;
  const avgStorage =
    recentData.reduce((sum, d) => sum + d.storage_percent, 0) /
    recentData.length;

  return {
    avg_cpu_percent: Math.round(avgCpu * 10) / 10,
    avg_ram_percent: Math.round(avgRam * 10) / 10,
    avg_storage_percent: Math.round(avgStorage * 10) / 10,
    data_points: recentData.length,
    time_range_hours: hours,
  };
};

const Telemetry = mongoose.model("Telemetry", TelemetrySchema);

export default Telemetry;

