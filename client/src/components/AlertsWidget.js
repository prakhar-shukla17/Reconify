"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Bell,
  BellRing,
  XCircle,
  Clock,
  ChevronRight,
  Shield,
  Mail,
} from "lucide-react";
import { alertsAPI } from "../lib/api";
import AlertEmailModal from "./AlertEmailModal";

const AlertsWidget = ({ onViewAll, users = [] }) => {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertsAPI.getWarrantyAlerts(30); // Next 30 days
      setAlerts(response.data.alerts.slice(0, 3)); // Show only top 3 alerts
      setSummary(response.data.summary);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAlert = (alert) => {
    setSelectedAlert(alert);
    setShowEmailModal(true);
  };

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case "critical":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      case "high":
        return {
          icon: AlertTriangle,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
        };
      case "medium":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        };
      default:
        return {
          icon: Shield,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {summary.total > 0 ? (
              <BellRing className="h-4 w-4 text-red-600" />
            ) : (
              <Bell className="h-4 w-4 text-gray-400" />
            )}
            <h4 className="font-medium text-gray-900">Warranty Alerts</h4>
            {summary.total > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {summary.total}
              </span>
            )}
          </div>

          {summary.total > 0 && (
            <button
              onClick={onViewAll}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {summary.total === 0 ? (
          <div className="text-center py-4">
            <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              All warranties are up to date
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="text-sm font-semibold text-red-600">
                  {summary.critical}
                </div>
                <div className="text-xs text-red-500">Critical</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="text-sm font-semibold text-orange-600">
                  {summary.high}
                </div>
                <div className="text-xs text-orange-500">High</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="text-sm font-semibold text-yellow-600">
                  {summary.medium}
                </div>
                <div className="text-xs text-yellow-500">Medium</div>
              </div>
            </div>

            {/* Top Alerts */}
            <div className="space-y-2">
              {alerts.map((alert) => {
                const severityConfig = getSeverityConfig(alert.severity);
                const SeverityIcon = severityConfig.icon;

                return (
                  <div
                    key={alert.id}
                    className={`${severityConfig.bgColor} rounded-lg p-3 border border-gray-100`}
                  >
                    <div className="flex items-start space-x-2">
                      <SeverityIcon
                        className={`h-4 w-4 ${severityConfig.color} mt-0.5 flex-shrink-0`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {alert.hostname || "Unknown Device"}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {alert.component ? alert.component.name : "Asset"}{" "}
                          expires in {alert.daysUntilExpiry} days
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-medium ${severityConfig.color}`}
                        >
                          {alert.daysUntilExpiry}d
                        </span>
                        <button
                          onClick={() => handleEmailAlert(alert)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Send alert email to users"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {summary.total > 3 && (
              <button
                onClick={onViewAll}
                className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View {summary.total - 3} more alerts
              </button>
            )}
          </div>
        )}
      </div>

      {/* Alert Email Modal */}
      <AlertEmailModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setSelectedAlert(null);
        }}
        alert={selectedAlert}
        users={users}
      />
    </div>
  );
};

export default AlertsWidget;
