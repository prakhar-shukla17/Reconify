"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
  AlertCircle,
  Target,
  Calendar,
  Thermometer,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";
import { telemetryAPI } from "../lib/api";
import toast from "react-hot-toast";

const MLAnalyticsDashboard = () => {
  const [healthSummary, setHealthSummary] = useState(null);
  const [mlServiceStatus, setMLServiceStatus] = useState("checking");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetPredictions, setAssetPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHealthSummary();
    checkMLServiceStatus();
    const interval = setInterval(checkMLServiceStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthSummary = async () => {
    try {
      setLoading(true);
      const response = await telemetryAPI.getHealthSummary();
      setHealthSummary(response.data.data);
    } catch (error) {
      console.error("Error fetching health summary:", error);
      toast.error("Failed to load health summary");
    } finally {
      setLoading(false);
    }
  };

  const checkMLServiceStatus = async () => {
    try {
      const response = await fetch("http://localhost:3000/health");
      if (response.ok) {
        const data = await response.json();
        setMLServiceStatus("online");
      } else {
        setMLServiceStatus("offline");
      }
    } catch (error) {
      setMLServiceStatus("offline");
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await Promise.all([fetchHealthSummary(), checkMLServiceStatus()]);
    setRefreshing(false);
    toast.success("Analytics refreshed successfully");
  };

  const getServiceStatusInfo = () => {
    switch (mlServiceStatus) {
      case "online":
        return {
          icon: Wifi,
          color: "text-green-600",
          bgColor: "bg-green-50",
          text: "ML Service Online",
          description: "Python ML analysis active",
        };
      case "offline":
        return {
          icon: WifiOff,
          color: "text-red-600",
          bgColor: "bg-red-50",
          text: "ML Service Offline",
          description: "Using basic predictions",
        };
      default:
        return {
          icon: RefreshCw,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          text: "Checking Status",
          description: "Connecting to ML service",
        };
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-100";
      case "good":
        return "text-blue-600 bg-blue-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const serviceStatus = getServiceStatusInfo();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Brain className="h-8 w-8 mr-3 text-indigo-600" />
                ML Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Advanced machine learning insights and predictive analytics for
                IT assets
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* ML Service Status */}
              <div
                className={`flex items-center px-4 py-2 rounded-lg ${serviceStatus.bgColor}`}
              >
                <serviceStatus.icon
                  className={`h-5 w-5 mr-2 ${serviceStatus.color}`}
                />
                <div>
                  <div className={`text-sm font-medium ${serviceStatus.color}`}>
                    {serviceStatus.text}
                  </div>
                  <div className="text-xs text-gray-500">
                    {serviceStatus.description}
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshAnalytics}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {loading && !healthSummary ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-4 text-gray-600">Loading ML analytics...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Server className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Assets
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {healthSummary?.total_assets || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Health Score
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {healthSummary?.health_percentage || 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Critical Issues
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {healthSummary?.critical_issues || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      ML Predictions
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {mlServiceStatus === "online" ? "Active" : "Basic"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ML Capabilities Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Zap className="h-6 w-6 mr-2 text-yellow-600" />
                ML Analysis Capabilities
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Storage Forecasting */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <HardDrive className="h-8 w-8 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      STORAGE
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Storage Forecasting
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Linear regression prediction</li>
                    <li>• Growth acceleration detection</li>
                    <li>• Confidence scoring</li>
                    <li>• Volatility analysis</li>
                  </ul>
                </div>

                {/* Memory Analysis */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <MemoryStick className="h-8 w-8 text-green-600" />
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                      MEMORY
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Memory Intelligence
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Memory leak detection</li>
                    <li>• Pressure timeline prediction</li>
                    <li>• Statistical trend analysis</li>
                    <li>• Risk assessment</li>
                  </ul>
                </div>

                {/* CPU Analysis */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <Cpu className="h-8 w-8 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      CPU
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    CPU Pattern Analysis
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Spike probability prediction</li>
                    <li>• Baseline shift detection</li>
                    <li>• Pattern recognition</li>
                    <li>• Performance analysis</li>
                  </ul>
                </div>

                {/* Health Trajectory */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      HEALTH
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Health Trajectory
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 7-day trend forecasting</li>
                    <li>• 30-day trend analysis</li>
                    <li>• Critical threshold prediction</li>
                    <li>• Performance degradation</li>
                  </ul>
                </div>

                {/* Anomaly Detection */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                      ANOMALY
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Anomaly Detection
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Z-score analysis</li>
                    <li>• Multi-dimensional detection</li>
                    <li>• Confidence scoring</li>
                    <li>• Recent anomaly tracking</li>
                  </ul>
                </div>

                {/* Resource Exhaustion */}
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-6 border border-yellow-200">
                  <div className="flex items-center justify-between mb-4">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                      TIMELINE
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Resource Timeline
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• CPU exhaustion prediction</li>
                    <li>• Memory critical timeline</li>
                    <li>• Storage full estimation</li>
                    <li>• Proactive alerting</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Health Distribution */}
            {healthSummary?.health_distribution && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-indigo-600" />
                  System Health Distribution
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {healthSummary.health_distribution.map((item) => (
                    <div
                      key={item._id || "unknown"}
                      className={`p-6 rounded-lg ${getHealthStatusColor(
                        item._id
                      )}`}
                    >
                      <p className="text-sm font-medium opacity-80">
                        {item._id
                          ? item._id.charAt(0).toUpperCase() + item._id.slice(1)
                          : "Unknown"}
                      </p>
                      <p className="text-3xl font-bold mt-2">{item.count}</p>
                      <p className="text-xs opacity-70 mt-1">
                        Avg Score:{" "}
                        {item.avg_score ? Math.round(item.avg_score) : "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ML Service Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Brain className="h-6 w-6 mr-2 text-purple-600" />
                ML Service Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Service Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`font-medium ${
                          mlServiceStatus === "online"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {mlServiceStatus === "online" ? "Online" : "Offline"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Analyzer Type:</span>
                      <span className="font-medium text-gray-900">
                        {mlServiceStatus === "online"
                          ? "Python Statistical"
                          : "Basic JavaScript"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Dependencies:</span>
                      <span className="font-medium text-gray-900">
                        Python Built-in Only
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Endpoint:</span>
                      <span className="font-medium text-gray-900">
                        localhost:3000
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Performance Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Prediction Speed:</span>
                      <span className="font-medium text-green-600">
                        &lt; 100ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Min Data Points:</span>
                      <span className="font-medium text-gray-900">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Optimal Data Points:
                      </span>
                      <span className="font-medium text-gray-900">15+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Update Frequency:</span>
                      <span className="font-medium text-gray-900">
                        Real-time
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Target className="h-6 w-6 mr-2 text-green-600" />
                Quick Actions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() =>
                    window.open("http://localhost:3000/health", "_blank")
                  }
                  className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Check ML Service Health
                </button>

                <button
                  onClick={() =>
                    window.open("http://localhost:3000/model_info", "_blank")
                  }
                  className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  View Model Information
                </button>

                <button
                  onClick={refreshAnalytics}
                  className="flex items-center justify-center px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Refresh All Analytics
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MLAnalyticsDashboard;
