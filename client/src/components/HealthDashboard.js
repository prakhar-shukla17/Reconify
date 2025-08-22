"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Cpu,
  MemoryStick,
  HardDrive,
  Thermometer,
  RefreshCw,
} from "lucide-react";
import { telemetryAPI } from "../lib/api";
import toast from "react-hot-toast";

const HealthDashboard = ({ isOpen, onClose }) => {
  const [healthSummary, setHealthSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHealthSummary();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

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

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                System Health Dashboard
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                ML-powered health analysis and monitoring
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchHealthSummary}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && !healthSummary ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : healthSummary ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-900">
                        Total Assets
                      </p>
                      <p className="text-2xl font-semibold text-blue-900">
                        {healthSummary.total_assets}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-900">
                        Health Score
                      </p>
                      <p className="text-2xl font-semibold text-green-900">
                        {healthSummary.health_percentage}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-red-900">
                        Critical Issues
                      </p>
                      <p className="text-2xl font-semibold text-red-900">
                        {healthSummary.critical_issues}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-900">
                        Monitored
                      </p>
                      <p className="text-2xl font-semibold text-purple-900">
                        {healthSummary.total_assets}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Distribution */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Health Status Distribution
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {healthSummary.health_distribution.map((item) => (
                    <div
                      key={item._id || "unknown"}
                      className={`p-4 rounded-lg ${getHealthStatusColor(
                        item._id
                      )}`}
                    >
                      <p className="text-sm font-medium opacity-80">
                        {item._id
                          ? item._id.charAt(0).toUpperCase() + item._id.slice(1)
                          : "Unknown"}
                      </p>
                      <p className="text-2xl font-bold">{item.count}</p>
                      <p className="text-xs opacity-70">
                        Avg:{" "}
                        {item.avg_score ? Math.round(item.avg_score) : "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

                             {/* Enhanced ML Predictions */}
               <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                 <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                   <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                   Advanced ML Predictions
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   <div className="bg-white bg-opacity-70 rounded-lg p-4">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center">
                         <HardDrive className="h-4 w-4 text-purple-600 mr-2" />
                         <span className="text-sm font-medium">Storage Forecast</span>
                       </div>
                       <span className="text-xs text-purple-600 font-semibold">ML</span>
                     </div>
                     <p className="text-xs text-gray-600 mb-2">
                       Multi-algorithm storage prediction using linear regression, 
                       exponential smoothing, and seasonal analysis
                     </p>
                     <div className="text-xs text-gray-500">
                       • Linear + Exponential + Seasonal trends<br/>
                       • Confidence scoring<br/>
                       • Growth acceleration detection
                     </div>
                   </div>

                   <div className="bg-white bg-opacity-70 rounded-lg p-4">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center">
                         <MemoryStick className="h-4 w-4 text-green-600 mr-2" />
                         <span className="text-sm font-medium">Memory Analysis</span>
                       </div>
                       <span className="text-xs text-green-600 font-semibold">AI</span>
                     </div>
                     <p className="text-xs text-gray-600 mb-2">
                       Advanced memory leak detection and pressure prediction
                     </p>
                     <div className="text-xs text-gray-500">
                       • Memory leak probability<br/>
                       • Pressure timeline prediction<br/>
                       • Volatility analysis
                     </div>
                   </div>

                   <div className="bg-white bg-opacity-70 rounded-lg p-4">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center">
                         <Cpu className="h-4 w-4 text-blue-600 mr-2" />
                         <span className="text-sm font-medium">CPU Patterns</span>
                       </div>
                       <span className="text-xs text-blue-600 font-semibold">ML</span>
                     </div>
                     <p className="text-xs text-gray-600 mb-2">
                       CPU spike prediction and baseline shift detection
                     </p>
                     <div className="text-xs text-gray-500">
                       • Spike probability analysis<br/>
                       • Baseline shift detection<br/>
                       • Performance trend analysis
                     </div>
                   </div>

                   <div className="bg-white bg-opacity-70 rounded-lg p-4">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center">
                         <Activity className="h-4 w-4 text-indigo-600 mr-2" />
                         <span className="text-sm font-medium">Health Trajectory</span>
                       </div>
                       <span className="text-xs text-indigo-600 font-semibold">AI</span>
                     </div>
                     <p className="text-xs text-gray-600 mb-2">
                       7-day and 30-day health trend forecasting
                     </p>
                     <div className="text-xs text-gray-500">
                       • Short & long-term trends<br/>
                       • Critical threshold prediction<br/>
                       • Health degradation alerts
                     </div>
                   </div>

                   <div className="bg-white bg-opacity-70 rounded-lg p-4">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center">
                         <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                         <span className="text-sm font-medium">Resource Timeline</span>
                       </div>
                       <span className="text-xs text-red-600 font-semibold">PRED</span>
                     </div>
                     <p className="text-xs text-gray-600 mb-2">
                       Predictive resource exhaustion timeline
                     </p>
                     <div className="text-xs text-gray-500">
                       • CPU critical hours<br/>
                       • Memory critical hours<br/>
                       • Storage critical days
                     </div>
                   </div>

                   <div className="bg-white bg-opacity-70 rounded-lg p-4">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center">
                         <Thermometer className="h-4 w-4 text-orange-600 mr-2" />
                         <span className="text-sm font-medium">Anomaly Detection</span>
                       </div>
                       <span className="text-xs text-orange-600 font-semibold">ML</span>
                     </div>
                     <p className="text-xs text-gray-600 mb-2">
                       Real-time anomaly detection with confidence scoring
                     </p>
                     <div className="text-xs text-gray-500">
                       • Statistical anomaly detection<br/>
                       • Confidence scoring<br/>
                       • Pattern recognition
                     </div>
                   </div>
                 </div>
               </div>

              {/* Recommendations */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  System Recommendations
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Overall system health is good with{" "}
                      {healthSummary.health_percentage}% healthy assets
                    </span>
                  </li>
                  {healthSummary.critical_issues > 0 && (
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {healthSummary.critical_issues} assets require immediate
                        attention
                      </span>
                    </li>
                  )}
                  <li className="flex items-start">
                    <Activity className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Run telemetry scanners regularly for continuous monitoring
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Health Data Available
              </h3>
              <p className="text-gray-500">
                Run telemetry scanners to start collecting health data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthDashboard;
