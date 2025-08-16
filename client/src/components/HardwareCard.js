"use client";

import {
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Battery,
} from "lucide-react";

const HardwareCard = ({ hardware, onClick }) => {
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

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border"
      onClick={() => onClick && onClick(hardware)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Monitor className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
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
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* CPU */}
        <div className="flex items-center space-x-2">
          <Cpu className="h-4 w-4 text-gray-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">CPU</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {hardware.cpu?.name?.split(" ").slice(-2).join(" ") || "Unknown"}
            </p>
            <p className="text-xs text-gray-500">
              {hardware.cpu?.physical_cores || 0} cores
            </p>
          </div>
        </div>

        {/* Memory */}
        <div className="flex items-center space-x-2">
          <MemoryStick className="h-4 w-4 text-gray-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Memory</p>
            <p className="text-sm font-medium text-gray-900">
              {hardware.memory?.total || "0 GB"}
            </p>
            <p
              className={`text-xs ${getStatusColor(
                hardware.memory?.percentage
              )}`}
            >
              {hardware.memory?.percentage || "0%"} used
            </p>
          </div>
        </div>

        {/* Storage */}
        <div className="flex items-center space-x-2">
          <HardDrive className="h-4 w-4 text-gray-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Storage</p>
            <p className="text-sm font-medium text-gray-900">
              {hardware.storage?.total_capacity || "0 GB"}
            </p>
            <p className="text-xs text-gray-500">
              {hardware.storage?.drives?.length || 0} drives
            </p>
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
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-xs text-gray-500">
          Last updated: {new Date(hardware.updatedAt).toLocaleDateString()}
        </div>
        <div className="flex items-center space-x-1">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Online</span>
        </div>
      </div>
    </div>
  );
};

export default HardwareCard;
