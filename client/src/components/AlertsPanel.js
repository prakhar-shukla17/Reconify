"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  BellRing,
  Calendar,
  Monitor,
  Cpu,
  MemoryStick,
  HardDrive,
  Eye,
  X,
  Filter,
  Zap,
} from "lucide-react";
import { alertsAPI } from "../lib/api";

const AlertsPanel = ({ className = "" }) => {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, critical, high, medium, low
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [alertDays, setAlertDays] = useState(30);

  useEffect(() => {
    fetchAlerts();
  }, [alertDays]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertsAPI.getWarrantyAlerts(alertDays);
      setAlerts(response.data.alerts);
      setSummary(response.data.summary);
      setError(null);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to fetch warranty alerts");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case "critical":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          badgeColor: "bg-red-100 text-red-800",
        };
      case "high":
        return {
          icon: AlertTriangle,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          badgeColor: "bg-orange-100 text-orange-800",
        };
      case "medium":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          badgeColor: "bg-yellow-100 text-yellow-800",
        };
      default:
        return {
          icon: CheckCircle,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          badgeColor: "bg-blue-100 text-blue-800",
        };
    }
  };

  const getComponentIcon = (componentType) => {
    switch (componentType) {
      case "cpu":
        return Cpu;
      case "memory":
        return MemoryStick;
      case "storage":
        return HardDrive;
      case "gpu":
        return Zap;
      default:
        return Monitor;
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.severity === filter;
  });

  const AlertCard = ({ alert }) => {
    const severityConfig = getSeverityConfig(alert.severity);
    const SeverityIcon = severityConfig.icon;
    const ComponentIcon = alert.component
      ? getComponentIcon(alert.component.type)
      : Monitor;
    const isExpanded = expandedAlert === alert.id;

    return (
      <div
        className={`${severityConfig.bgColor} ${severityConfig.borderColor} border rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              <SeverityIcon className={`h-5 w-5 ${severityConfig.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {alert.title}
                </h4>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${severityConfig.badgeColor}`}
                >
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{alert.message}</p>

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Monitor className="h-3 w-3" />
                  <span>{alert.hostname || "Unknown Device"}</span>
                </div>
                {alert.component && (
                  <div className="flex items-center space-x-1">
                    <ComponentIcon className="h-3 w-3" />
                    <span>{alert.component.name}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(alert.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${severityConfig.color}`}>
              {alert.daysUntilExpiry === 0
                ? "Today"
                : `${alert.daysUntilExpiry}d`}
            </span>
            <button
              onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Asset ID:</span>
                <span className="ml-2 text-gray-600">{alert.macAddress}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Alert Type:</span>
                <span className="ml-2 text-gray-600">
                  {alert.type === "asset_warranty"
                    ? "Asset Warranty"
                    : "Component Warranty"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Expiry Date:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(alert.expiryDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Days Remaining:
                </span>
                <span className={`ml-2 font-medium ${severityConfig.color}`}>
                  {alert.daysUntilExpiry}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center h-32 text-red-600">
          <XCircle className="h-8 w-8 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {alerts.length > 0 ? (
              <BellRing className="h-5 w-5 text-red-600" />
            ) : (
              <Bell className="h-5 w-5 text-gray-400" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              Warranty Alerts
            </h3>
            {alerts.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {alerts.length}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Alert Days Filter */}
            <select
              value={alertDays}
              onChange={(e) => setAlertDays(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 90 days</option>
            </select>

            {/* Severity Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        {summary.total > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {summary.critical}
              </div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                {summary.high}
              </div>
              <div className="text-xs text-gray-500">High</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">
                {summary.medium}
              </div>
              <div className="text-xs text-gray-500">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {summary.low}
              </div>
              <div className="text-xs text-gray-500">Low</div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="p-6">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Warranty Alerts
            </h4>
            <p className="text-gray-500">
              {filter === "all"
                ? `All warranties are valid for the next ${alertDays} days`
                : `No ${filter} severity alerts found`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
