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
  ChevronDown,
  ChevronUp,
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
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [selectedComponentType, setSelectedComponentType] = useState(null);

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

  // Calculate component-specific alert counts
  const getComponentAlertCounts = () => {
    const counts = {
      cpu: 0,
      gpu: 0,
      memory: 0,
      storage: 0,
      asset: 0,
    };

    if (Array.isArray(alerts)) {
      alerts.forEach(alert => {
        if (alert && alert.type === "asset_warranty") {
          counts.asset++;
        } else if (alert && alert.component && alert.component.type && counts.hasOwnProperty(alert.component.type)) {
          counts[alert.component.type]++;
        }
      });
    }

    // Ensure all counts are valid numbers
    Object.keys(counts).forEach(key => {
      if (Number.isNaN(counts[key]) || counts[key] === undefined || counts[key] === null) {
        counts[key] = 0;
      }
    });

    return counts;
  };

  // Get alerts by component type
  const getAlertsByComponentType = (componentType) => {
    if (componentType === "asset") {
      return alerts.filter(alert => alert.type === "asset_warranty");
    }
    return alerts.filter(alert => 
      alert.component?.type === componentType
    );
  };

  const openComponentModal = (componentType) => {
    setSelectedComponentType(componentType);
    setShowComponentModal(true);
  };

  const closeComponentModal = () => {
    setShowComponentModal(false);
    setSelectedComponentType(null);
  };

  const getComponentName = (componentType) => {
    switch (componentType) {
      case "cpu": return "CPU";
      case "gpu": return "GPU";
      case "memory": return "Memory";
      case "storage": return "Storage";
      case "asset": return "Asset";
      default: return "Unknown";
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.severity === filter;
  });

  const ComponentAlertTile = ({ componentType, count }) => {
    const ComponentIcon = getComponentIcon(componentType);
    
    // Ensure count is a valid number
    const safeCount = Number.isNaN(count) || count === undefined || count === null ? 0 : count;
    
    const getTileColor = () => {
      if (safeCount === 0) return "bg-gray-50 border-gray-200";
      if (safeCount <= 2) return "bg-yellow-50 border-yellow-200";
      if (safeCount <= 5) return "bg-orange-50 border-orange-200";
      return "bg-red-50 border-red-200";
    };

    const getTextColor = () => {
      if (safeCount === 0) return "text-gray-600";
      if (safeCount <= 2) return "text-yellow-700";
      if (safeCount <= 5) return "text-orange-700";
      return "text-red-700";
    };

    return (
      <div className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${getTileColor()}`}>
        <button
          onClick={() => openComponentModal(componentType)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ComponentIcon className={`h-6 w-6 ${getTextColor()}`} />
              <div>
                <h4 className={`font-semibold ${getTextColor()}`}>
                  {getComponentName(componentType)} Alerts
                </h4>
                <p className="text-sm text-gray-600">
                  {safeCount} alert{safeCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-bold ${getTextColor()}`}>
                {safeCount}
              </span>
            </div>
          </div>
        </button>
      </div>
    );
  };

  const ComponentModal = () => {
    if (!showComponentModal || !selectedComponentType) return null;

    const componentAlerts = getAlertsByComponentType(selectedComponentType);
    const ComponentIcon = getComponentIcon(selectedComponentType);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <ComponentIcon className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {getComponentName(selectedComponentType)} Warranty Alerts
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {componentAlerts.length} PC{componentAlerts.length !== 1 ? 's' : ''} with expiring warranties
                  </p>
                </div>
              </div>
              <button
                onClick={closeComponentModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-4">
            {componentAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No {getComponentName(selectedComponentType)} Warranty Alerts
                </h4>
                <p className="text-gray-500">
                  All {getComponentName(selectedComponentType).toLowerCase()} warranties are valid
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {componentAlerts.map((alert) => (
                  <div key={alert.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Monitor className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900 text-lg">
                            {alert.hostname || "Unknown Device"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            MAC: {alert.macAddress}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">Component</span>
                        </div>
                        <p className="text-gray-900">
                          {alert.component?.name || "Asset"}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-gray-700">Expires</span>
                        </div>
                        <p className="text-gray-900">
                          {new Date(alert.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-gray-700">Time Remaining</span>
                        </div>
                        <p className={`font-medium ${
                          alert.daysUntilExpiry <= 7 ? 'text-red-600' :
                          alert.daysUntilExpiry <= 14 ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          {alert.daysUntilExpiry === 0 ? 'Today' : `${alert.daysUntilExpiry} days`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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

  const componentCounts = getComponentAlertCounts();

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
            {(alerts && alerts.length > 0) && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {alerts.length || 0}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Alert Days Filter */}
            <select
              value={alertDays}
              onChange={(e) => setAlertDays(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Component Alert Statistics */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Component Alert Statistics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <ComponentAlertTile
              componentType="cpu"
              count={componentCounts.cpu || 0}
            />
            <ComponentAlertTile
              componentType="gpu"
              count={componentCounts.gpu || 0}
            />
            <ComponentAlertTile
              componentType="memory"
              count={componentCounts.memory || 0}
            />
            <ComponentAlertTile
              componentType="storage"
              count={componentCounts.storage || 0}
            />
          </div>
        </div>


      </div>

      {/* Alerts List */}
      <div className="p-6">
        {(!filteredAlerts || filteredAlerts.length === 0) ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Warranty Alerts
            </h4>
            <p className="text-gray-500">
              {filter === "all"
                ? `All warranties are valid for the next ${alertDays || 30} days`
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

      {/* Component Modal */}
      <ComponentModal />
    </div>
  );
};

export default AlertsPanel;
