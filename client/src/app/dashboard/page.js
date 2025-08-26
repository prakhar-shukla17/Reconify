"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import AlertsWidget from "../../components/AlertsWidget";
import AlertsPanel from "../../components/AlertsPanel";
import { hardwareAPI, softwareAPI, ticketsAPI, authAPI } from "../../lib/api";
import toast from "react-hot-toast";

import {
  Monitor,
  HardDrive,
  Cpu,
  Package,
  Settings,
  Play,
  Bell,
  Ticket,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Shield,
  FileText,
} from "lucide-react";

// Export utility functions
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    toast.error("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success(`${filename} exported successfully!`);
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [assignmentStats, setAssignmentStats] = useState(null);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    closed: 0,
  });
  const [softwareStats, setSoftwareStats] = useState({
    total: 0,
    totalPackages: 0,
    services: 0,
    startupPrograms: 0,
  });

  // Export functions for banking compliance
  const handleHardwareExport = async (type) => {
    try {
      setExportLoading(true);
      const response = await hardwareAPI.getAll({ page: 1, limit: 10000 });
      const hardwareData = response.data.data || [];

      let exportData = [];

      switch (type) {
        case "compliance":
          exportData = hardwareData.map((item) => ({
            "Asset ID": item._id || "N/A",
            "Device Name": item.system?.hostname || "N/A",
            "Asset Tag": item.asset_tag || "N/A",
            "Device Type": item.system?.platform || "N/A",
            Model: item.system?.model || "N/A",
            "Serial Number": item.system?.serial_number || "N/A",
            "MAC Address": item.system?.mac_address || "N/A",
            "IP Address": item.network?.ip_address || "N/A",
            Location: item.location || "N/A",
            Department: item.department || "N/A",
            "Assigned To": item.assigned_to || "Unassigned",
            Status: item.status || "N/A",
            "Purchase Date": item.purchase_date || "N/A",
            "Warranty Expiry": item.warranty_expiry || "N/A",
            "Last Updated": item.updatedAt
              ? new Date(item.updatedAt).toLocaleDateString()
              : "N/A",
            "Security Level": item.security_level || "Standard",
            "Encryption Status": item.encryption_status || "Unknown",
            "Compliance Status": item.compliance_status || "Pending",
          }));
          break;

        case "security":
          exportData = hardwareData.map((item) => ({
            "Asset ID": item._id || "N/A",
            "Device Name": item.system?.hostname || "N/A",
            "OS Version": item.system?.platform_release || "N/A",
            "Security Patches": item.security?.patches || "Unknown",
            "Antivirus Status": item.security?.antivirus_status || "Unknown",
            "Firewall Status": item.security?.firewall_status || "Unknown",
            Encryption: item.security?.encryption || "Unknown",
            "Access Control": item.security?.access_control || "Unknown",
            "Last Security Scan": item.security?.last_scan || "N/A",
            Vulnerabilities: item.security?.vulnerabilities || "0",
            "Compliance Score": item.security?.compliance_score || "N/A",
          }));
          break;

        default:
          exportData = hardwareData.map((item) => ({
            "Asset ID": item._id || "N/A",
            "Device Name": item.system?.hostname || "N/A",
            Type: item.system?.platform || "N/A",
            Model: item.system?.model || "N/A",
            "Serial Number": item.system?.serial_number || "N/A",
            Status: item.status || "N/A",
            Location: item.location || "N/A",
            "Assigned To": item.assigned_to || "Unassigned",
          }));
      }

      exportToCSV(exportData, `${type}_Hardware_Report`);
    } catch (error) {
      console.error("Hardware export error:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleSoftwareExport = async (type) => {
    try {
      setExportLoading(true);
      const response = await softwareAPI.getAll({ page: 1, limit: 10000 });
      const softwareData = response.data.data || [];

      let exportData = [];

      switch (type) {
        case "compliance":
          exportData = softwareData.map((item) => ({
            "System ID": item._id || "N/A",
            Hostname: item.system?.hostname || "N/A",
            OS: item.system?.platform || "N/A",
            "OS Version": item.system?.platform_release || "N/A",
            "Total Software": item.scan_metadata?.total_software_count || "0",
            "Licensed Software": item.licensed_software?.length || "0",
            "Unlicensed Software": item.unlicensed_software?.length || "0",
            "Last Scan": item.scan_metadata?.last_updated
              ? new Date(item.scan_metadata.last_updated).toLocaleDateString()
              : "N/A",
            "Compliance Status": item.compliance_status || "Pending",
            "License Expiry": item.license_expiry || "N/A",
            Vendor: item.vendor || "N/A",
          }));
          break;

        case "security":
          exportData = softwareData.map((item) => ({
            "System ID": item._id || "N/A",
            Hostname: item.system?.hostname || "N/A",
            OS: item.system?.platform || "N/A",
            "Security Updates": item.security?.updates || "Unknown",
            "Vulnerable Software": item.security?.vulnerable_software || "0",
            "Patch Status": item.security?.patch_status || "Unknown",
            "Last Security Update": item.security?.last_update || "N/A",
            "Security Score": item.security?.score || "N/A",
          }));
          break;

        default:
          exportData = softwareData.map((item) => ({
            "System ID": item._id || "N/A",
            Hostname: item.system?.hostname || "N/A",
            OS: item.system?.platform || "N/A",
            "Total Packages": item.scan_metadata?.total_software_count || "0",
            Services: item.services?.length || "0",
            "Startup Programs": item.startup_programs?.length || "0",
          }));
      }

      exportToCSV(exportData, `${type}_Software_Report`);
    } catch (error) {
      console.error("Software export error:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // Handle redirect to admin alerts
  const handleViewAllAlerts = () => {
    if (user?.role === "admin") {
      router.push("/admin?tab=alerts");
    } else {
      toast.error("Access denied. Admin privileges required.");
    }
  };

  // Handle redirect to admin hardware
  const handleViewHardware = () => {
    if (user?.role === "admin") {
      router.push("/admin?tab=assets");
    } else {
      toast.error("Access denied. Admin privileges required.");
    }
  };

  // Handle redirect to admin software
  const handleViewSoftware = () => {
    if (user?.role === "admin") {
      router.push("/admin?tab=assets");
    } else {
      toast.error("Access denied. Admin privileges required.");
    }
  };

  // Handle redirect to admin tickets
  const handleViewTickets = () => {
    if (user?.role === "admin") {
      router.push("/admin?tab=tickets");
    } else {
      toast.error("Access denied. Admin privileges required.");
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const response = await hardwareAPI.getStats();
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchAssignmentStats = async () => {
    try {
      const response = await authAPI.getAssignmentStatistics();
      setAssignmentStats(response.data.statistics);
    } catch (error) {
      console.error("Error fetching assignment stats:", error);
    }
  };

  const fetchTicketStats = async () => {
    try {
      const response = await ticketsAPI.getAll();
      const ticketsData = response.data.data || [];

      setTicketStats({
        total: ticketsData.length,
        open: ticketsData.filter((t) => t.status === "Open").length,
        resolved: ticketsData.filter((t) => t.status === "Resolved").length,
        closed: ticketsData.filter(
          (t) => t.status === "Closed" || t.status === "Rejected"
        ).length,
      });
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
    }
  };

  const fetchSoftwareStats = async () => {
    try {
      const response = await softwareAPI.getAll({ page: 1, limit: 1000 });
      const softwareData = response.data.data || [];

      setSoftwareStats({
        total: softwareData.length,
        totalPackages: softwareData.reduce(
          (sum, s) => sum + (s.scan_metadata?.total_software_count || 0),
          0
        ),
        services: softwareData.reduce(
          (sum, s) => sum + (s.services?.length || 0),
          0
        ),
        startupPrograms: softwareData.reduce(
          (sum, s) => sum + (s.startup_programs?.length || 0),
          0
        ),
      });
    } catch (error) {
      console.error("Error fetching software stats:", error);
    }
  };

  useEffect(() => {
    // Only fetch data when user is loaded and not in auth loading state
    if (!authLoading && user) {
      const fetchAllStats = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchDashboardStats(),
            fetchAssignmentStats(),
            fetchTicketStats(),
            fetchSoftwareStats(),
          ]);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          toast.error("Failed to load dashboard data");
        } finally {
          setLoading(false);
        }
      };

      fetchAllStats();
    }
  }, [authLoading, user]);

  // Show loading state while auth is loading or dashboard data is loading
  if (authLoading || loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {authLoading ? "Loading user..." : "Loading dashboard..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Don't render if user is not loaded
  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    User not loaded. Please refresh the page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Redirect regular users to My Assets page
  if (user?.role !== "admin") {
    router.push("/my-assets");
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                IT Asset Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Overview of all IT assets and system status
              </p>
            </div>

            {/* Stats Cards - Hardware */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Hardware Assets
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div
                  onClick={handleViewHardware}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardStats?.totalAssets || 0}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Total Assets
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    All registered devices
                  </p>
                </div>

                <div
                  onClick={handleViewHardware}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardStats?.activeAssets || 0}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Active Assets
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Currently active devices
                  </p>
                </div>

                <div
                  onClick={handleViewHardware}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {assignmentStats?.totalAssignedAssets || 0}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Assigned Assets
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Currently assigned to users
                  </p>
                </div>

                <div
                  onClick={handleViewHardware}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardStats?.expiringWarranties || 0}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Expiring Warranties
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Warranties expiring soon
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards - Software */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Software Inventory
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div
                  onClick={handleViewSoftware}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Monitor className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {softwareStats.total}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Total Systems
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Scanned systems</p>
                </div>

                <div
                  onClick={handleViewSoftware}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {softwareStats.totalPackages}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Software Packages
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Installed software</p>
                </div>

                <div
                  onClick={handleViewSoftware}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {softwareStats.services}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Services
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">System services</p>
                </div>

                <div
                  onClick={handleViewSoftware}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {softwareStats.startupPrograms}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Startup Programs
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Auto-start programs</p>
                </div>
              </div>
            </div>

            {/* Stats Cards - Tickets */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Support Tickets
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div
                  onClick={handleViewTickets}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Ticket className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {ticketStats.total}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Total Tickets
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">All support requests</p>
                </div>

                <div
                  onClick={handleViewTickets}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {ticketStats.open}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">Open</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Awaiting response</p>
                </div>

                <div
                  onClick={handleViewTickets}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {ticketStats.resolved}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Resolved
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Successfully completed
                  </p>
                </div>

                <div
                  onClick={handleViewTickets}
                  className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <XCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {ticketStats.closed}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Closed
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Archived tickets</p>
                </div>
              </div>
            </div>

            {/* Warranty Alerts Widget */}
            <div className="mb-8">
              <AlertsWidget onViewAll={handleViewAllAlerts} />
            </div>

            {/* Export Options Panel */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Download className="h-5 w-5 text-blue-600 mr-2" />
                  Export Options
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hardware Exports */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                      <Monitor className="h-4 w-4 text-blue-600 mr-2" />
                      Hardware Assets
                    </h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleHardwareExport("compliance")}
                        disabled={exportLoading}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              🛡️ Compliance Report
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Full asset details for regulatory compliance
                            </div>
                          </div>
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                      </button>

                      <button
                        onClick={() => handleHardwareExport("security")}
                        disabled={exportLoading}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              🔒 Security Assessment
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Security status and vulnerability analysis
                            </div>
                          </div>
                          <Shield className="h-4 w-4 text-green-600" />
                        </div>
                      </button>

                      <button
                        onClick={() => handleHardwareExport("inventory")}
                        disabled={exportLoading}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-purple-50 rounded-lg transition-colors border border-gray-200 hover:border-purple-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              📋 Basic Inventory
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Essential asset information
                            </div>
                          </div>
                          <Download className="h-4 w-4 text-purple-600" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Software Exports */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                      <Package className="h-4 w-4 text-green-600 mr-2" />
                      Software Inventory
                    </h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleSoftwareExport("compliance")}
                        disabled={exportLoading}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              📊 License Compliance
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Software licensing and compliance status
                            </div>
                          </div>
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                      </button>

                      <button
                        onClick={() => handleSoftwareExport("security")}
                        disabled={exportLoading}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              🔍 Security Analysis
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Security updates and vulnerability status
                            </div>
                          </div>
                          <Shield className="h-4 w-4 text-green-600" />
                        </div>
                      </button>

                      <button
                        onClick={() => handleSoftwareExport("inventory")}
                        disabled={exportLoading}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-purple-50 rounded-lg transition-colors border border-gray-200 hover:border-purple-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              📦 Software Catalog
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Installed software inventory
                            </div>
                          </div>
                          <Download className="h-4 w-4 text-purple-600" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {exportLoading && (
                  <div className="mt-6 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Preparing export...</p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    All exports include comprehensive data required for banking
                    compliance, regulatory audits, and security assessments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
