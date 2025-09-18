import React, { useState } from "react";
import {
  Download,
  Users,
  Monitor,
  Shield,
  Activity,
  Settings,
} from "lucide-react";
import ScannerDownloadModal from "./ScannerDownloadModal";

const AdminDashboard = () => {
  const [showScannerModal, setShowScannerModal] = useState(false);

  const adminFeatures = [
    {
      id: "scanner-download",
      title: "Download Scanner",
      description: "Download ITAM scanner packages for your organization",
      icon: Download,
      action: () => setShowScannerModal(true),
      color: "bg-blue-500",
      textColor: "text-blue-500",
    },
    {
      id: "user-management",
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      action: () => (window.location.href = "/admin/users"),
      color: "bg-green-500",
      textColor: "text-green-500",
    },
    {
      id: "asset-management",
      title: "Asset Management",
      description: "View and manage all IT assets",
      icon: Monitor,
      action: () => (window.location.href = "/admin/assets"),
      color: "bg-purple-500",
      textColor: "text-purple-500",
    },
    {
      id: "security",
      title: "Security Settings",
      description: "Configure security and access controls",
      icon: Shield,
      action: () => (window.location.href = "/admin/security"),
      color: "bg-red-500",
      textColor: "text-red-500",
    },
    {
      id: "monitoring",
      title: "System Monitoring",
      description: "Monitor system health and performance",
      icon: Activity,
      action: () => (window.location.href = "/admin/monitoring"),
      color: "bg-orange-500",
      textColor: "text-orange-500",
    },
    {
      id: "settings",
      title: "System Settings",
      description: "Configure system-wide settings",
      icon: Settings,
      action: () => (window.location.href = "/admin/settings"),
      color: "bg-gray-500",
      textColor: "text-gray-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your IT Asset Management system and organization settings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Monitor className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Assets
                </p>
                <p className="text-2xl font-semibold text-gray-900">156</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Scanners Active
                </p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Security Score
                </p>
                <p className="text-2xl font-semibold text-gray-900">92%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => (
            <div
              key={feature.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={feature.action}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{feature.description}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
                  Access feature
                  <svg
                    className="ml-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scanner Download Section */}
        <div className="mt-12 bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Deploy ITAM Scanner Executable
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Download a standalone executable scanner for your organization.
              No Python installation required - runs automatically in the background
              with embedded authentication and configuration.
            </p>
            <button
              onClick={() => setShowScannerModal(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Scanner Executable
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-green-100 mb-3">
                <Monitor className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Windows
              </h3>
              <p className="text-sm text-gray-600">
                Batch files and Windows service installation
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 mb-3">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Linux</h3>
              <p className="text-sm text-gray-600">
                Shell scripts and systemd service files
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 mb-3">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">macOS</h3>
              <p className="text-sm text-gray-600">
                Shell scripts and launchd plist files
              </p>
            </div>
          </div>
        </div>

        {/* Scanner Download Modal */}
        <ScannerDownloadModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
