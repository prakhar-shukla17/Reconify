import Telemetry from "../models/telemetry.models.js";
import Hardware from "../models/hardware.models.js";

// ML Analysis Functions
class HealthAnalyzer {
  static calculateHealthScore(current, historical = []) {
    let score = 100;

    // CPU health (30% weight)
    if (current.cpu_percent > 90) score -= 25;
    else if (current.cpu_percent > 80) score -= 15;
    else if (current.cpu_percent > 70) score -= 8;

    // Memory health (30% weight)
    if (current.ram_percent > 95) score -= 25;
    else if (current.ram_percent > 85) score -= 15;
    else if (current.ram_percent > 75) score -= 8;

    // Storage health (25% weight)
    if (current.storage_percent > 95) score -= 20;
    else if (current.storage_percent > 90) score -= 12;
    else if (current.storage_percent > 85) score -= 6;

    // Temperature health (15% weight)
    if (current.temperature) {
      if (current.temperature > 85) score -= 15;
      else if (current.temperature > 75) score -= 8;
      else if (current.temperature > 65) score -= 3;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  static getHealthStatus(score) {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 50) return "warning";
    return "critical";
  }

  static detectAnomalies(current, historical = []) {
    const anomalies = [];

    // CPU spike detection
    if (current.cpu_percent > 95) {
      anomalies.push({
        type: "cpu_spike",
        severity: "high",
        description: `CPU usage critically high at ${current.cpu_percent}%`,
        confidence: 0.9,
      });
    }

    // Storage full warning
    if (current.storage_percent > 90) {
      const severity = current.storage_percent > 95 ? "critical" : "high";
      anomalies.push({
        type: "storage_full",
        severity,
        description: `Storage critically low - ${current.storage_percent}% used`,
        confidence: 0.95,
      });
    }

    // Temperature alert
    if (current.temperature && current.temperature > 80) {
      const severity = current.temperature > 90 ? "critical" : "medium";
      anomalies.push({
        type: "temperature_high",
        severity,
        description: `High temperature detected: ${current.temperature}°C`,
        confidence: 0.8,
      });
    }

    return anomalies;
  }

  static async generatePredictions(current, historical = [], macAddress) {
    // Call Python ML service for advanced predictions
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mac_address: macAddress,
          current_data: current,
          historical_data: historical,
        }),
      });

      if (response.ok) {
        const predictions = await response.json();
        return predictions;
      } else {
        return this.generateBasicPredictions(current, historical);
      }
    } catch (error) {
      return this.generateBasicPredictions(current, historical);
    }
  }

  static generateBasicPredictions(current, historical = []) {
    const predictions = {};

    // Basic storage prediction
    if (historical.length >= 5) {
      const storageData = historical.slice(-7).map((d) => d.storage_percent);
      const slope = this.calculateSlope(storageData);

      if (slope > 0.1) {
        const daysToFull = Math.round((100 - current.storage_percent) / slope);
        predictions.storage_full_in_days = Math.max(0, daysToFull);
      }
    }

    // Basic memory pressure risk
    if (current.ram_percent > 70) {
      predictions.memory_pressure_risk = Math.min(
        1,
        (current.ram_percent - 70) / 30
      );
    }

    // Basic performance degradation risk
    const perfScore =
      100 -
      (current.cpu_percent * 0.4 +
        current.ram_percent * 0.4 +
        current.storage_percent * 0.2);
    predictions.performance_degradation_risk = Math.max(
      0,
      (70 - perfScore) / 70
    );

    return predictions;
  }

  static generateRecommendations(current, anomalies, predictions) {
    const recommendations = [];

    // CPU-based recommendations
    if (current.cpu_percent > 80) {
      recommendations.push(
        "Consider closing unnecessary applications to reduce CPU load"
      );
    }

    if (predictions.cpu_spike_probability > 0.7) {
      recommendations.push(
        "High CPU spike probability detected - monitor running processes closely"
      );
    }

    if (predictions.cpu_baseline_shift > 10) {
      recommendations.push(
        "CPU baseline has shifted up - investigate new processes or malware"
      );
    }

    // Memory-based recommendations with ML insights
    if (current.ram_percent > 85) {
      recommendations.push(
        "Memory usage is high - restart applications or add more RAM"
      );
    }

    if (predictions.memory_leak_probability > 0.6) {
      recommendations.push(
        `High memory leak probability (${Math.round(
          predictions.memory_leak_probability * 100
        )}%) - investigate long-running processes`
      );
    }

    if (
      predictions.memory_pressure_in_hours &&
      predictions.memory_pressure_in_hours < 24
    ) {
      recommendations.push(
        `Memory pressure expected in ${Math.round(
          predictions.memory_pressure_in_hours
        )} hours - take preventive action`
      );
    }

    if (predictions.memory_volatility > 15) {
      recommendations.push(
        "High memory volatility detected - system may be unstable"
      );
    }

    // Storage-based recommendations with ML predictions
    if (current.storage_percent > 90) {
      recommendations.push(
        "Storage is critically low - clean up files or expand storage"
      );
    }

    if (
      predictions.storage_full_in_days &&
      predictions.storage_full_in_days < 30
    ) {
      const confidence = predictions.storage_confidence
        ? ` (${Math.round(predictions.storage_confidence * 100)}% confidence)`
        : "";
      recommendations.push(
        `Storage predicted to be full in ${predictions.storage_full_in_days} days${confidence} - plan storage expansion`
      );
    }

    if (predictions.storage_growth_acceleration > 1) {
      recommendations.push(
        "Storage growth is accelerating - identify and control rapidly growing data"
      );
    }

    // Performance degradation recommendations
    if (predictions.performance_degradation_risk > 0.7) {
      recommendations.push(
        "High performance degradation risk - consider system optimization"
      );
    }

    if (predictions.performance_trend < -2) {
      recommendations.push(
        "Performance is declining - investigate system bottlenecks"
      );
    }

    // Health trajectory recommendations
    if (predictions.health_trend_7_days < -5) {
      recommendations.push(
        "System health declining rapidly - immediate attention required"
      );
    }

    if (
      predictions.critical_threshold_days &&
      predictions.critical_threshold_days < 7
    ) {
      recommendations.push(
        `System may reach critical state in ${Math.round(
          predictions.critical_threshold_days
        )} days - take immediate action`
      );
    }

    // Resource exhaustion timeline recommendations
    const timeline = predictions.resource_exhaustion_timeline || {};

    if (timeline.cpu_critical_hours && timeline.cpu_critical_hours < 12) {
      recommendations.push(
        `CPU may reach critical levels in ${Math.round(
          timeline.cpu_critical_hours
        )} hours - reduce CPU load immediately`
      );
    }

    if (timeline.memory_critical_hours && timeline.memory_critical_hours < 12) {
      recommendations.push(
        `Memory may reach critical levels in ${Math.round(
          timeline.memory_critical_hours
        )} hours - free memory immediately`
      );
    }

    if (timeline.storage_critical_days && timeline.storage_critical_days < 3) {
      recommendations.push(
        `Storage may reach critical levels in ${Math.round(
          timeline.storage_critical_days
        )} days - clean storage immediately`
      );
    }

    // Temperature recommendations
    if (current.temperature && current.temperature > 75) {
      recommendations.push("System temperature is high - check cooling system");
    }

    // Anomaly-based recommendations
    anomalies.forEach((anomaly) => {
      switch (anomaly.type) {
        case "cpu_spike":
          recommendations.push(
            "CPU spike detected - investigate high CPU processes"
          );
          break;
        case "memory_leak":
          recommendations.push(
            "Potential memory leak - restart affected applications"
          );
          break;
        case "storage_full":
          recommendations.push(
            "Storage critically full - immediate cleanup required"
          );
          break;
        case "temperature_high":
          recommendations.push(
            "High temperature - check system cooling and dust levels"
          );
          break;
        case "unusual_activity":
          recommendations.push(
            "Unusual system activity - investigate for malware or runaway processes"
          );
          break;
      }
    });

    // Preventive recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        "System is running optimally - continue regular monitoring"
      );
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  static calculateSlope(data) {
    if (data.length < 2) return 0;

    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
}

// API Controllers
export const receiveTelemetry = async (req, res) => {
  try {
    const {
      mac_address,
      cpu_percent,
      ram_percent,
      storage_percent,
      temperature,
    } = req.body;

    if (
      !mac_address ||
      cpu_percent === undefined ||
      ram_percent === undefined ||
      storage_percent === undefined
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: mac_address, cpu_percent, ram_percent, storage_percent",
      });
    }

    // Find or create telemetry record
    let telemetry = await Telemetry.findOne({ mac_address });
    if (!telemetry) {
      telemetry = new Telemetry({ 
        mac_address,
        tenant_id: req.user?.tenant_id || "default"
      });
    }

    // Prepare new telemetry data
    const newTelemetryData = {
      timestamp: new Date(),
      cpu_percent: parseFloat(cpu_percent),
      ram_percent: parseFloat(ram_percent),
      storage_percent: parseFloat(storage_percent),
      temperature: temperature ? parseFloat(temperature) : undefined,
    };

    // Add telemetry data
    telemetry.addTelemetryData(newTelemetryData);

    // Perform ML analysis
    const historical = telemetry.historical_data || [];
    const healthScore = HealthAnalyzer.calculateHealthScore(
      newTelemetryData,
      historical
    );
    const healthStatus = HealthAnalyzer.getHealthStatus(healthScore);
    const anomalies = HealthAnalyzer.detectAnomalies(
      newTelemetryData,
      historical
    );
    const predictions = await HealthAnalyzer.generatePredictions(
      newTelemetryData,
      historical,
      mac_address
    );
    const recommendations = HealthAnalyzer.generateRecommendations(
      newTelemetryData,
      anomalies,
      predictions
    );

    // Update health analysis
    telemetry.health_analysis = {
      timestamp: new Date(),
      overall_health_score: healthScore,
      health_status: healthStatus,
      anomalies_detected: anomalies,
      predictions,
      recommendations,
    };

    // Generate alerts
    const newAlerts = [];

    if (newTelemetryData.storage_percent > 90) {
      newAlerts.push({
        type: "storage_warning",
        severity:
          newTelemetryData.storage_percent > 95 ? "critical" : "warning",
        message: `Storage usage at ${newTelemetryData.storage_percent}%`,
      });
    }

    if (newTelemetryData.cpu_percent > 90) {
      newAlerts.push({
        type: "cpu_overload",
        severity: "warning",
        message: `CPU usage at ${newTelemetryData.cpu_percent}%`,
      });
    }

    // Add new alerts
    telemetry.alerts = [...newAlerts, ...telemetry.alerts.slice(0, 10)];

    await telemetry.save();

    res.json({
      success: true,
      message: "Telemetry data received and analyzed",
      health_score: healthScore,
      health_status: healthStatus,
      alerts: newAlerts.length,
      anomalies: anomalies.length,
    });
  } catch (error) {
    console.error("Receive telemetry error:", error);
    res.status(500).json({ error: "Failed to process telemetry data" });
  }
};

export const getTelemetry = async (req, res) => {
  try {
    const { mac_address } = req.params;

    // Add tenant ID filter
    let query = { mac_address };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }

    const telemetry = await Telemetry.findOne(query);
    if (!telemetry) {
      return res.status(404).json({ error: "Telemetry data not found" });
    }

    res.json({
      success: true,
      data: telemetry,
    });
  } catch (error) {
    console.error("Get telemetry error:", error);
    res.status(500).json({ error: "Failed to retrieve telemetry data" });
  }
};

export const getHealthSummary = async (req, res) => {
  try {
    // Add tenant ID filter
    let matchStage = {};
    if (req.user && req.user.tenant_id) {
      matchStage = { tenant_id: req.user.tenant_id };
    }

    const summary = await Telemetry.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$health_analysis.health_status",
          count: { $sum: 1 },
          avg_score: { $avg: "$health_analysis.overall_health_score" },
        },
      },
    ]);

    const totalAssets = await Telemetry.countDocuments(matchStage);
    const criticalIssues = await Telemetry.countDocuments({
      ...matchStage,
      "health_analysis.health_status": "critical",
    });

    res.json({
      success: true,
      data: {
        health_distribution: summary,
        total_assets: totalAssets,
        critical_issues: criticalIssues,
        health_percentage:
          totalAssets > 0
            ? Math.round((1 - criticalIssues / totalAssets) * 100)
            : 100,
      },
    });
  } catch (error) {
    console.error("Get health summary error:", error);
    res.status(500).json({ error: "Failed to retrieve health summary" });
  }
};

export { HealthAnalyzer };
