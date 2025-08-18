"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  Play,
  Square,
  Settings,
  BarChart3,
  Brain,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

const MLServiceControlPanel = ({ isOpen, onClose }) => {
  const [serviceStatus, setServiceStatus] = useState("checking");
  const [serviceInfo, setServiceInfo] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkServiceStatus();
      fetchModelInfo();
    }
  }, [isOpen]);

  const checkServiceStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/health");
      if (response.ok) {
        const data = await response.json();
        setServiceStatus("online");
        setServiceInfo(data);
      } else {
        setServiceStatus("offline");
        setServiceInfo(null);
      }
    } catch (error) {
      setServiceStatus("offline");
      setServiceInfo(null);
    }
  };

  const fetchModelInfo = async () => {
    try {
      const response = await fetch("http://localhost:5000/model_info");
      if (response.ok) {
        const data = await response.json();
        setModelInfo(data);
      }
    } catch (error) {
      console.log("Could not fetch model info");
    }
  };

  const testMLService = async () => {
    setLoading(true);
    try {
      const testData = {
        mac_address: "test-asset",
        current_data: {
          cpu_percent: 75.5,
          ram_percent: 82.3,
          storage_percent: 67.8,
          temperature: 68.2,
        },
        historical_data: [
          {
            cpu_percent: 70.1,
            ram_percent: 78.5,
            storage_percent: 65.2,
            temperature: 65.5,
          },
          {
            cpu_percent: 72.3,
            ram_percent: 80.1,
            storage_percent: 66.1,
            temperature: 67.1,
          },
          {
            cpu_percent: 74.8,
            ram_percent: 81.7,
            storage_percent: 67.5,
            temperature: 68.8,
          },
        ],
      };

      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        const predictions = await response.json();
        setTestResult({ success: true, data: predictions });
        toast.success("ML service test successful!");
      } else {
        const error = await response.json();
        setTestResult({ success: false, error: error.error });
        toast.error("ML service test failed");
      }
    } catch (error) {
      setTestResult({ success: false, error: error.message });
      toast.error("Failed to connect to ML service");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (serviceStatus) {
      case "online":
        return (
          <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4 mr-1" />
            Online
          </div>
        );
      case "offline":
        return (
          <div className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Offline
          </div>
        );
      default:
        return (
          <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            Checking
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Server className="h-6 w-6 mr-2 text-indigo-600" />
                ML Service Control Panel
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Monitor and manage the Python ML analysis service
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge()}
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
          <div className="space-y-6">
            {/* Service Status */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Service Status
              </h4>

              {serviceInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{serviceInfo.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium">{serviceInfo.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Analyzer:</span>
                      <span className="font-medium">
                        {serviceInfo.analyzer_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dependencies:</span>
                      <span className="font-medium text-green-600">
                        {serviceInfo.dependencies || "Python Built-in"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <Wifi className="h-16 w-16 text-green-600 mx-auto mb-2" />
                      <p className="text-green-600 font-medium">
                        Service Running
                      </p>
                      <p className="text-sm text-gray-500">localhost:5000</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <WifiOff className="h-16 w-16 text-red-600 mx-auto mb-2" />
                    <p className="text-red-600 font-medium">Service Offline</p>
                    <p className="text-sm text-gray-500">
                      Cannot connect to localhost:5000
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Model Information */}
            {modelInfo && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-600" />
                  ML Models & Features
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">
                      Analysis Models
                    </h5>
                    <div className="space-y-2">
                      {Object.entries(modelInfo.models || {}).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-600 capitalize">
                              {key.replace("_", " ")}:
                            </span>
                            <span className="font-medium text-gray-900">
                              {value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">
                      Capabilities
                    </h5>
                    <div className="space-y-1">
                      {(modelInfo.features || []).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Control Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-gray-600" />
                Control Actions
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={checkServiceStatus}
                  className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Refresh Status
                </button>

                <button
                  onClick={testMLService}
                  disabled={loading || serviceStatus !== "online"}
                  className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-5 w-5 mr-2" />
                  )}
                  Test ML Service
                </button>

                <button
                  onClick={() =>
                    window.open("http://localhost:5000/model_info", "_blank")
                  }
                  disabled={serviceStatus !== "online"}
                  className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  View API Docs
                </button>
              </div>
            </div>

            {/* Test Results */}
            {testResult && (
              <div
                className={`border rounded-lg p-6 ${
                  testResult.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  )}
                  Test Results
                </h4>

                {testResult.success ? (
                  <div className="space-y-3">
                    <p className="text-green-800">
                      ✅ ML service responded successfully!
                    </p>
                    <div className="bg-white rounded-lg p-4 text-sm">
                      <h5 className="font-medium mb-2">Sample Predictions:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {testResult.data.storage_full_in_days && (
                          <div className="flex justify-between">
                            <span>Storage Full:</span>
                            <span className="font-medium">
                              {testResult.data.storage_full_in_days} days
                            </span>
                          </div>
                        )}
                        {testResult.data.memory_leak_probability && (
                          <div className="flex justify-between">
                            <span>Memory Leak Risk:</span>
                            <span className="font-medium">
                              {Math.round(
                                testResult.data.memory_leak_probability * 100
                              )}
                              %
                            </span>
                          </div>
                        )}
                        {testResult.data.cpu_spike_probability && (
                          <div className="flex justify-between">
                            <span>CPU Spike Risk:</span>
                            <span className="font-medium">
                              {Math.round(
                                testResult.data.cpu_spike_probability * 100
                              )}
                              %
                            </span>
                          </div>
                        )}
                        {testResult.data.performance_degradation_risk && (
                          <div className="flex justify-between">
                            <span>Performance Risk:</span>
                            <span className="font-medium">
                              {Math.round(
                                testResult.data.performance_degradation_risk *
                                  100
                              )}
                              %
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-800">
                    <p>❌ Test failed: {testResult.error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Start Guide */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-amber-600" />
                Quick Start Guide
              </h4>

              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Start ML Service</p>
                    <p className="text-gray-600">
                      Run:{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        python ml_service/standalone_ml_service.py
                      </code>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Verify Connection</p>
                    <p className="text-gray-600">
                      Service should be accessible at{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        http://localhost:5000
                      </code>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Generate Telemetry Data</p>
                    <p className="text-gray-600">
                      Run scanners to collect data for ML analysis
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="font-medium">View Predictions</p>
                    <p className="text-gray-600">
                      Check asset details and ML analytics dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLServiceControlPanel;
