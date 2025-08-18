"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Brain,
  Zap,
  BarChart3,
  Calendar,
  Cpu,
  MemoryStick,
  HardDrive,
} from "lucide-react";
import { telemetryAPI } from "../lib/api";

const MLPredictionsPanel = ({ macAddress }) => {
  const [telemetryData, setTelemetryData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (macAddress) {
      fetchTelemetryData();
    }
  }, [macAddress]);

  const fetchTelemetryData = async () => {
    try {
      setLoading(true);
      const response = await telemetryAPI.getTelemetry(macAddress);
      setTelemetryData(response.data.data);

      // Also check if Python ML service is available
      try {
        const mlHealthResponse = await fetch("http://localhost:5000/health");
        if (mlHealthResponse.ok) {
          console.log("✅ Python ML service is available");
        }
      } catch (mlError) {
        console.log(
          "⚠️ Python ML service not available, using basic predictions"
        );
      }
    } catch (error) {
      console.log("No telemetry data available");
      setTelemetryData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeframe = (value, unit) => {
    if (!value || value <= 0) return "Not predicted";

    const rounded = Math.round(value);
    if (rounded === 1) {
      return `${rounded} ${unit.slice(0, -1)}`; // Remove 's' for singular
    }
    return `${rounded} ${unit}`;
  };

  const getPredictionColor = (
    value,
    thresholds = { good: 30, warning: 7, critical: 3 }
  ) => {
    if (!value || value <= 0) return "text-gray-500";
    if (value > thresholds.good) return "text-green-600";
    if (value > thresholds.warning) return "text-yellow-600";
    if (value > thresholds.critical) return "text-orange-600";
    return "text-red-600";
  };

  const getRiskColor = (risk) => {
    if (risk >= 0.8) return "text-red-600";
    if (risk >= 0.6) return "text-orange-600";
    if (risk >= 0.4) return "text-yellow-600";
    if (risk >= 0.2) return "text-blue-600";
    return "text-green-600";
  };

  const getProbabilityColor = (prob) => {
    if (prob >= 0.8) return "text-red-600 bg-red-50";
    if (prob >= 0.6) return "text-orange-600 bg-orange-50";
    if (prob >= 0.4) return "text-yellow-600 bg-yellow-50";
    if (prob >= 0.2) return "text-blue-600 bg-blue-50";
    return "text-green-600 bg-green-50";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading ML predictions...</span>
        </div>
      </div>
    );
  }

  if (!telemetryData || !telemetryData.health_analysis?.predictions) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No ML Predictions Available
          </h3>
          <p className="text-gray-500 mb-4">
            Run telemetry scanners multiple times to generate predictive
            insights
          </p>
          <button
            onClick={fetchTelemetryData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  const predictions = telemetryData.health_analysis.predictions;
  const currentData = telemetryData.current_data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Brain className="h-6 w-6 mr-2 text-indigo-600" />
              ML Predictive Analytics
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Advanced machine learning insights and forecasting
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Last Analysis</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date(
                telemetryData.health_analysis.timestamp
              ).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Storage Predictions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <HardDrive className="h-5 w-5 mr-2 text-purple-600" />
          Storage Forecasting
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Storage Full
              </span>
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div
              className={`text-2xl font-bold ${getPredictionColor(
                predictions.storage_full_in_days
              )}`}
            >
              {formatTimeframe(predictions.storage_full_in_days, "days")}
            </div>
            {predictions.storage_confidence && (
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(predictions.storage_confidence * 100)}% confidence
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Growth Rate
              </span>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {predictions.storage_growth_acceleration !== undefined
                ? `${
                    predictions.storage_growth_acceleration > 0 ? "+" : ""
                  }${predictions.storage_growth_acceleration.toFixed(1)}%`
                : "N/A"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Growth acceleration
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Current Usage
              </span>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {currentData?.storage_percent || 0}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Live measurement</div>
          </div>
        </div>
      </div>

      {/* Memory Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MemoryStick className="h-5 w-5 mr-2 text-green-600" />
          Memory Intelligence
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            className={`rounded-lg p-4 ${getProbabilityColor(
              predictions.memory_leak_probability || 0
            )}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Leak Probability</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">
              {predictions.memory_leak_probability
                ? `${Math.round(predictions.memory_leak_probability * 100)}%`
                : "0%"}
            </div>
            <div className="text-xs opacity-70 mt-1">ML Detection</div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Pressure ETA
              </span>
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div
              className={`text-2xl font-bold ${getPredictionColor(
                predictions.memory_pressure_in_hours,
                { good: 48, warning: 12, critical: 6 }
              )}`}
            >
              {formatTimeframe(predictions.memory_pressure_in_hours, "hours")}
            </div>
            <div className="text-xs text-gray-500 mt-1">Until 90% usage</div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Pressure Risk
              </span>
              <Target className="h-4 w-4 text-red-600" />
            </div>
            <div
              className={`text-2xl font-bold ${getRiskColor(
                predictions.memory_pressure_risk || 0
              )}`}
            >
              {predictions.memory_pressure_risk
                ? `${Math.round(predictions.memory_pressure_risk * 100)}%`
                : "0%"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Risk assessment</div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Volatility
              </span>
              <Activity className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {predictions.memory_volatility
                ? `${predictions.memory_volatility.toFixed(1)}%`
                : "N/A"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Usage variance</div>
          </div>
        </div>
      </div>

      {/* CPU Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Cpu className="h-5 w-5 mr-2 text-blue-600" />
          CPU Performance Analysis
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`rounded-lg p-4 ${getProbabilityColor(
              predictions.cpu_spike_probability || 0
            )}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Spike Probability</span>
              <Zap className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">
              {predictions.cpu_spike_probability
                ? `${Math.round(predictions.cpu_spike_probability * 100)}%`
                : "0%"}
            </div>
            <div className="text-xs opacity-70 mt-1">Pattern analysis</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Baseline Shift
              </span>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <div
              className={`text-2xl font-bold ${
                predictions.cpu_baseline_shift > 0
                  ? "text-orange-600"
                  : predictions.cpu_baseline_shift < 0
                  ? "text-green-600"
                  : "text-gray-600"
              }`}
            >
              {predictions.cpu_baseline_shift !== undefined
                ? `${
                    predictions.cpu_baseline_shift > 0 ? "+" : ""
                  }${predictions.cpu_baseline_shift.toFixed(1)}%`
                : "N/A"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Usage baseline change
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Perf. Risk
              </span>
              <Activity className="h-4 w-4 text-green-600" />
            </div>
            <div
              className={`text-2xl font-bold ${getRiskColor(
                predictions.performance_degradation_risk || 0
              )}`}
            >
              {predictions.performance_degradation_risk
                ? `${Math.round(
                    predictions.performance_degradation_risk * 100
                  )}%`
                : "0%"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Degradation risk</div>
          </div>
        </div>
      </div>

      {/* Health Trajectory */}
      {(predictions.health_trend_7_days !== undefined ||
        predictions.health_trend_30_days !== undefined) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
            Health Trajectory Forecast
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  7-Day Trend
                </span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div
                className={`text-2xl font-bold ${
                  predictions.health_trend_7_days > 0
                    ? "text-green-600"
                    : predictions.health_trend_7_days < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {predictions.health_trend_7_days !== undefined
                  ? `${
                      predictions.health_trend_7_days > 0 ? "+" : ""
                    }${predictions.health_trend_7_days.toFixed(1)}`
                  : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Short-term forecast
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  30-Day Trend
                </span>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div
                className={`text-2xl font-bold ${
                  predictions.health_trend_30_days > 0
                    ? "text-green-600"
                    : predictions.health_trend_30_days < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {predictions.health_trend_30_days !== undefined
                  ? `${
                      predictions.health_trend_30_days > 0 ? "+" : ""
                    }${predictions.health_trend_30_days.toFixed(1)}`
                  : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Long-term forecast
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Critical ETA
                </span>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div
                className={`text-2xl font-bold ${getPredictionColor(
                  predictions.critical_threshold_days
                )}`}
              >
                {formatTimeframe(predictions.critical_threshold_days, "days")}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Until health &lt; 50
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Exhaustion Timeline */}
      {predictions.resource_exhaustion_timeline &&
        Object.keys(predictions.resource_exhaustion_timeline).length > 0 && (
          <div className="bg-red-50 rounded-lg border border-red-200 p-6">
            <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Critical Resource Timeline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predictions.resource_exhaustion_timeline.cpu_critical_hours && (
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      CPU Critical
                    </span>
                    <Cpu className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatTimeframe(
                      predictions.resource_exhaustion_timeline
                        .cpu_critical_hours,
                      "hours"
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Until 95% usage
                  </div>
                </div>
              )}

              {predictions.resource_exhaustion_timeline
                .memory_critical_hours && (
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Memory Critical
                    </span>
                    <MemoryStick className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatTimeframe(
                      predictions.resource_exhaustion_timeline
                        .memory_critical_hours,
                      "hours"
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Until 95% usage
                  </div>
                </div>
              )}

              {predictions.resource_exhaustion_timeline
                .storage_critical_days && (
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Storage Critical
                    </span>
                    <HardDrive className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatTimeframe(
                      predictions.resource_exhaustion_timeline
                        .storage_critical_days,
                      "days"
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Until 98% usage
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default MLPredictionsPanel;
