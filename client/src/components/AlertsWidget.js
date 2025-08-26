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
} from "lucide-react";
import { alertsAPI } from "../lib/api";

const AlertsWidget = ({ onViewAll }) => {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

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
      <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {summary.total > 0 ? (
              <BellRing className="h-6 w-6 text-red-600" />
            ) : (
              <Bell className="h-6 w-6 text-gray-400" />
            )}
            <h4 className="text-xl font-semibold text-gray-900">Warranty Alerts</h4>
            {summary.total > 0 && (
              <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                {summary.total}
              </span>
            )}
          </div>

          {summary.total > 0 && (
            <button
              onClick={onViewAll}
              className="text-blue-600 hover:text-blue-800 text-base font-medium flex items-center space-x-2 hover:scale-105 transition-all duration-300"
            >
              <span>View All</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {summary.total === 0 ? (
          <div className="text-center py-6">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-base text-gray-600 font-medium">
              All warranties are up to date
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="text-lg font-bold text-red-600">
                  {summary.critical}
                </div>
                <div className="text-sm text-red-500 font-medium">Critical</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="text-lg font-bold text-orange-600">
                  {summary.high}
                </div>
                <div className="text-sm text-orange-500 font-medium">High</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                <div className="text-lg font-bold text-yellow-600">
                  {summary.medium}
                </div>
                <div className="text-sm text-yellow-500 font-medium">Medium</div>
              </div>
            </div>

            {/* Top Alerts */}
            <div className="space-y-3">
              {alerts.map((alert) => {
                const severityConfig = getSeverityConfig(alert.severity);
                const SeverityIcon = severityConfig.icon;

                return (
                  <div
                    key={alert.id}
                    className={`${severityConfig.bgColor} rounded-2xl p-4 border border-gray-200 hover:shadow-md transition-all duration-300`}
                  >
                    <div className="flex items-start space-x-3">
                      <SeverityIcon
                        className={`h-5 w-5 ${severityConfig.color} mt-0.5 flex-shrink-0`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 truncate">
                          {alert.hostname || "Unknown Device"}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {alert.component ? alert.component.name : "Asset"}{" "}
                          expires in {alert.daysUntilExpiry} days
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold ${severityConfig.color}`}
                      >
                        {alert.daysUntilExpiry}d
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {summary.total > 3 && (
              <button
                onClick={onViewAll}
                className="w-full text-center py-3 text-base text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-2xl hover:bg-blue-50 hover:shadow-md transition-all duration-300"
              >
                View {summary.total - 3} more alerts
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsWidget;
