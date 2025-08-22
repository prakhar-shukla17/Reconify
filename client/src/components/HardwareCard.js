"use client";

import { useState, useEffect } from "react";
import {
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Battery,
  Eye,
  ExternalLink,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Thermometer,
  Zap,
} from "lucide-react";
import { telemetryAPI } from "../lib/api";

const HardwareCard = ({ hardware, onClick }) => {
  const [telemetryData, setTelemetryData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hardware.system?.mac_address) {
      fetchTelemetry();
    }
  }, [hardware.system?.mac_address]);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const response = await telemetryAPI.getTelemetry(
        hardware.system.mac_address
      );
      setTelemetryData(response.data.data);
    } catch (error) {
      // Telemetry data might not exist yet, that's okay
      console.log(
        "No telemetry data available for",
        hardware.system?.mac_address
      );
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (percentage) => {
    const percent = parseFloat(percentage);
    if (percent >= 80) return "text-red-600";
    if (percent >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Helper function to get warranty status
  const getWarrantyStatus = (warrantyExpiry) => {
    if (!warrantyExpiry) {
      return {
        status: "unknown",
        icon: Clock,
        color: "text-gray-500",
        text: "No warranty info",
      };
    }

    const today = new Date();
    const expiry = new Date(warrantyExpiry);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        status: "expired",
        icon: AlertTriangle,
        color: "text-red-600",
        text: "Warranty expired",
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring_soon",
        icon: AlertTriangle,
        color: "text-yellow-600",
        text: `${daysUntilExpiry}d left`,
      };
    } else {
      return {
        status: "active",
        icon: CheckCircle,
        color: "text-green-600",
        text: "Under warranty",
      };
    }
  };

  const warrantyInfo = getWarrantyStatus(hardware.asset_info?.warranty_expiry);

  // Helper function to get health status info
  const getHealthStatusInfo = (healthStatus, healthScore) => {
    if (!healthStatus) {
      return {
        status: "unknown",
        icon: Activity,
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        text: "No data",
      };
    }

    switch (healthStatus) {
      case "excellent":
        return {
          status: "excellent",
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          text: `Excellent (${healthScore})`,
        };
      case "good":
        return {
          status: "good",
          icon: CheckCircle,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          text: `Good (${healthScore})`,
        };
      case "warning":
        return {
          status: "warning",
          icon: AlertTriangle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          text: `Warning (${healthScore})`,
        };
      case "critical":
        return {
          status: "critical",
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          text: `Critical (${healthScore})`,
        };
      default:
        return {
          status: "unknown",
          icon: Activity,
          color: "text-gray-500",
          bgColor: "bg-gray-100",
          text: "Unknown",
        };
    }
  };

  const healthInfo = getHealthStatusInfo(
    telemetryData?.health_analysis?.health_status,
    telemetryData?.health_analysis?.overall_health_score
  );

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border h-80 flex flex-col"
      onClick={() => onClick && onClick(hardware)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Monitor className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {hardware.system?.hostname || "Unknown Device"}
            </h3>
            <p className="text-sm text-gray-500">
              {hardware.system?.platform} {hardware.system?.platform_release}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">MAC Address</p>
          <p className="text-sm font-mono text-gray-700">
            {hardware.system?.mac_address || "Unknown"}
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
        {/* CPU - Real-time if available */}
        <div className="flex items-center space-x-2">
          <Cpu className="h-4 w-4 text-gray-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">CPU</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {hardware.cpu?.name?.split(" ").slice(-2).join(" ") || "Unknown"}
            </p>
            {telemetryData?.current_data?.cpu_percent !== undefined ? (
              <p
                className={`text-xs ${getStatusColor(
                  telemetryData.current_data.cpu_percent
                )}`}
              >
                {telemetryData.current_data.cpu_percent}% used
                <Activity className="inline h-3 w-3 ml-1" />
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {hardware.cpu?.physical_cores || 0} cores
              </p>
            )}
          </div>
        </div>

        {/* Memory - Real-time if available */}
        <div className="flex items-center space-x-2">
          <MemoryStick className="h-4 w-4 text-gray-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Memory</p>
            <p className="text-sm font-medium text-gray-900">
              {hardware.memory?.total || "0 GB"}
            </p>
            {telemetryData?.current_data?.ram_percent !== undefined ? (
              <p
                className={`text-xs ${getStatusColor(
                  telemetryData.current_data.ram_percent
                )}`}
              >
                {telemetryData.current_data.ram_percent}% used
                <Activity className="inline h-3 w-3 ml-1" />
              </p>
            ) : (
              <p
                className={`text-xs ${getStatusColor(
                  hardware.memory?.percentage
                )}`}
              >
                {hardware.memory?.percentage || "0%"} used
              </p>
            )}
          </div>
        </div>

        {/* Storage - Real-time if available */}
        <div className="flex items-center space-x-2">
          <HardDrive className="h-4 w-4 text-gray-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Storage</p>
            <p className="text-sm font-medium text-gray-900">
              {hardware.storage?.total_capacity || "0 GB"}
            </p>
            {telemetryData?.current_data?.storage_percent !== undefined ? (
              <p
                className={`text-xs ${getStatusColor(
                  telemetryData.current_data.storage_percent
                )}`}
              >
                {telemetryData.current_data.storage_percent}% used
                <Activity className="inline h-3 w-3 ml-1" />
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {hardware.storage?.drives?.length || 0} drives
              </p>
            )}
          </div>
        </div>

        {/* Network/Battery */}
        <div className="flex items-center space-x-2">
          {hardware.power_thermal?.battery ? (
            <>
              <Battery className="h-4 w-4 text-gray-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Battery</p>
                <p className="text-sm font-medium text-gray-900">
                  {hardware.power_thermal.battery.percent || "0%"}
                </p>
                <p className="text-xs text-gray-500">
                  {hardware.power_thermal.battery.power_plugged
                    ? "Plugged"
                    : "Unplugged"}
                </p>
              </div>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-gray-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Network</p>
                <p className="text-sm font-medium text-gray-900">
                  {hardware.network?.interfaces?.length || 0} interfaces
                </p>
                <p className="text-xs text-gray-500">Connected</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t mt-auto">
        <div className="flex flex-col space-y-1">
          <div className="text-xs text-gray-500">
            Last updated: {new Date(hardware.updatedAt).toLocaleDateString()}
          </div>
          {/* Health Status */}
          <div className="flex items-center space-x-1">
            <healthInfo.icon className={`h-3 w-3 ${healthInfo.color}`} />
            <span className={`text-xs ${healthInfo.color}`}>
              {healthInfo.text}
            </span>
          </div>
          {/* Warranty Status */}
          <div className="flex items-center space-x-1">
            <warrantyInfo.icon className={`h-3 w-3 ${warrantyInfo.color}`} />
            <span className={`text-xs ${warrantyInfo.color}`}>
              {warrantyInfo.text}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Online</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick && onClick(hardware);
            }}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Eye className="h-3 w-3" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HardwareCard;
