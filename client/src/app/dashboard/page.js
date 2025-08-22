"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import HardwareCard from "../../components/HardwareCard";
import HardwareDetails from "../../components/HardwareDetails";
import AlertsWidget from "../../components/AlertsWidget";
import AlertsPanel from "../../components/AlertsPanel";
import CreateTicketModal from "../../components/CreateTicketModal";
import TicketCard from "../../components/TicketCard";
import MLServiceControlPanel from "../../components/MLServiceControlPanel";
import { hardwareAPI, softwareAPI, ticketsAPI } from "../../lib/api";
import toast from "react-hot-toast";
import {
  Monitor,
  HardDrive,
  Cpu,
  MemoryStick,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Package,
  Settings,
  Play,
  Bell,
  Ticket,
  Plus,
  AlertCircle,
  Brain,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [hardware, setHardware] = useState([]);
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHardware, setSelectedHardware] = useState(null);
  const [selectedSoftware, setSelectedSoftware] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("hardware");
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showMLControlPanel, setShowMLControlPanel] = useState(false);

  useEffect(() => {
    if (activeTab === "hardware") {
      fetchHardware();
    } else if (activeTab === "software") {
      fetchSoftware();
    } else if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [activeTab]);

  const fetchHardware = async () => {
    try {
      setLoading(true);
      const response = await hardwareAPI.getAll();
      setHardware(response.data.data || []);
    } catch (error) {
      console.error("Error fetching hardware:", error);
      toast.error("Failed to load hardware data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSoftware = async () => {
    try {
      setLoading(true);
      const response = await softwareAPI.getAll();
      setSoftware(response.data.data || []);
    } catch (error) {
      console.error("Error fetching software:", error);
      toast.error("Failed to load software data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getAll();
      const ticketsData = response.data.data || [];
      
      // Sort tickets: active tickets first, closed tickets last
      const sortedTickets = ticketsData.sort((a, b) => {
        const aIsClosed = a.status === "Closed" || a.status === "Rejected";
        const bIsClosed = b.status === "Closed" || b.status === "Rejected";
        
        if (aIsClosed && !bIsClosed) return 1;  // a goes after b
        if (!aIsClosed && bIsClosed) return -1; // a goes before b
        return 0; // keep original order for same status type
      });
      
      setTickets(sortedTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const filteredHardware = hardware.filter((item) => {
    const matchesSearch =
      item.system?.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.system?.mac_address
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.cpu?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      (filterType === "desktop" &&
        item.system?.platform?.toLowerCase().includes("windows")) ||
      (filterType === "laptop" && item.power_thermal?.battery) ||
      (filterType === "server" &&
        item.system?.platform?.toLowerCase().includes("linux"));

    return matchesSearch && matchesFilter;
  });

  const filteredSoftware = software.filter((item) => {
    const matchesSearch =
      item.system?.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.system?.mac_address
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getSystemStats = () => {
    if (activeTab === "hardware") {
      const stats = {
        total: hardware.length,
        desktop: hardware.filter((h) =>
          h.system?.platform?.toLowerCase().includes("windows")
        ).length,
        laptop: hardware.filter((h) => h.power_thermal?.battery).length,
        server: hardware.filter((h) =>
          h.system?.platform?.toLowerCase().includes("linux")
        ).length,
      };
      return stats;
    } else if (activeTab === "tickets") {
      const stats = {
        total: tickets.length,
        open: tickets.filter((t) => t.status === "Open").length,
        resolved: tickets.filter((t) => t.status === "Resolved").length,
        closed: tickets.filter((t) => t.status === "Closed").length,
      };
      return stats;
    } else {
      const stats = {
        total: software.length,
        totalPackages: software.reduce(
          (sum, s) => sum + (s.scan_metadata?.total_software_count || 0),
          0
        ),
        services: software.reduce(
          (sum, s) => sum + (s.services?.length || 0),
          0
        ),
        startupPrograms: software.reduce(
          (sum, s) => sum + (s.startup_programs?.length || 0),
          0
        ),
      };
      return stats;
    }
  };

  const stats = getSystemStats();

  if (selectedHardware) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSelectedHardware(null)}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </button>
              <HardwareDetails hardware={selectedHardware} />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (selectedSoftware) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSelectedSoftware(null)}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </button>

              {/* Software Details */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {selectedSoftware.system?.hostname || "Unknown System"}
                      </h1>
                      <p className="text-green-600 font-medium">
                        {selectedSoftware.system?.platform} Software Inventory
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">MAC Address</p>
                      <p className="font-mono text-gray-900">
                        {selectedSoftware.system?.mac_address || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-gray-50 border-b">
                  <div className="text-center">
                    <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedSoftware.installed_software?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Installed Packages</p>
                  </div>
                  <div className="text-center">
                    <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedSoftware.services?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">System Services</p>
                  </div>
                  <div className="text-center">
                    <Play className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedSoftware.startup_programs?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Startup Programs</p>
                  </div>
                  <div className="text-center">
                    <Monitor className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedSoftware.scan_metadata?.total_software_count ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Total Items</p>
                  </div>
                </div>

                {/* Installed Software List */}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                    Installed Software (
                    {selectedSoftware.installed_software?.length || 0})
                  </h2>

                  {selectedSoftware.installed_software?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Software Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Version
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Vendor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Install Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Size
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedSoftware.installed_software.map(
                            (software, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Package className="h-4 w-4 text-blue-500 mr-2" />
                                    <div className="text-sm font-medium text-gray-900">
                                      {software.name}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {software.version || "Unknown"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {software.vendor || "Unknown"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {software.install_date || "Unknown"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {software.size || "Unknown"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No installed software found
                      </p>
                    </div>
                  )}

                  {/* System Services Section */}
                  {selectedSoftware.services?.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <Settings className="h-5 w-5 text-green-600 mr-2" />
                        System Services ({selectedSoftware.services.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedSoftware.services
                          .slice(0, 12)
                          .map((service, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 rounded-lg p-4 border"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {service.name}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    service.state
                                      ?.toLowerCase()
                                      .includes("running")
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {service.state || "Unknown"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {service.display_name || "No description"}
                              </p>
                            </div>
                          ))}
                        {selectedSoftware.services.length > 12 && (
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center justify-center">
                            <p className="text-blue-600 font-medium">
                              +{selectedSoftware.services.length - 12} more
                              services
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Startup Programs Section */}
                  {selectedSoftware.startup_programs?.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <Play className="h-5 w-5 text-purple-600 mr-2" />
                        Startup Programs (
                        {selectedSoftware.startup_programs.length})
                      </h2>
                      <div className="space-y-3">
                        {selectedSoftware.startup_programs
                          .slice(0, 10)
                          .map((program, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 rounded-lg p-4 border"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900">
                                    {program.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Location: {program.location || "Unknown"}
                                  </p>
                                  {program.command && (
                                    <div className="mt-2 p-2 bg-white rounded border">
                                      <p className="text-xs font-mono text-gray-700 break-all">
                                        {program.command}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        {selectedSoftware.startup_programs.length > 10 && (
                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 text-center">
                            <p className="text-purple-600 font-medium">
                              +{selectedSoftware.startup_programs.length - 10}{" "}
                              more startup programs
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Scan Information */}
                  <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-2">
                      Scan Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600">Last Scan:</p>
                        <p className="text-blue-900 font-medium">
                          {new Date(
                            selectedSoftware.scan_metadata?.last_updated ||
                              selectedSoftware.updatedAt
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600">Scanner Version:</p>
                        <p className="text-blue-900 font-medium">
                          {selectedSoftware.scan_metadata?.scanner_version ||
                            "1.0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600">Platform:</p>
                        <p className="text-blue-900 font-medium">
                          {selectedSoftware.system?.platform}{" "}
                          {selectedSoftware.system?.platform_release}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
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
                {user?.role === "admin" ? "All Assets" : "My Assets"}
              </h1>
              <p className="mt-2 text-gray-600">
                {user?.role === "admin"
                  ? "Manage and monitor all IT assets in the organization"
                  : "View and monitor your assigned IT assets"}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <nav className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => setActiveTab("hardware")}
                  className={`px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === "hardware"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4" />
                    <span>Hardware</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("software")}
                  className={`px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === "software"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>Software</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("alerts")}
                  className={`px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === "alerts"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <span>Alerts</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("tickets")}
                  className={`px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === "tickets"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Ticket className="h-4 w-4" />
                    <span>Tickets</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowMLControlPanel(true)}
                  className="px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4" />
                    <span>ML Analytics</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              {activeTab === "tickets" ? (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-md shadow-sm border border-blue-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          Total Tickets
                        </p>
                        <p className="text-xl font-bold text-blue-900">
                          {stats.total}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm">
                        <Ticket className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600">All support requests</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-md shadow-sm border border-red-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-red-700 mb-1">
                          Open
                        </p>
                        <p className="text-xl font-bold text-red-900">
                          {stats.open}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-md flex items-center justify-center shadow-sm">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-xs text-red-600">Awaiting response</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-md shadow-sm border border-green-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-700 mb-1">
                          Resolved
                        </p>
                        <p className="text-xl font-bold text-green-900">
                          {stats.resolved}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center shadow-sm">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-xs text-green-600">Successfully completed</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-md shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Closed
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {stats.closed}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-md flex items-center justify-center shadow-sm">
                        <XCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">Archived tickets</p>
                    </div>
                  </div>
                </>
              ) : activeTab === "hardware" ? (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-md shadow-sm border border-blue-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          Total Assets
                        </p>
                        <p className="text-xl font-bold text-blue-900">
                          {stats.total}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600">All registered devices</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-md shadow-sm border border-green-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-700 mb-1">
                          Desktops
                        </p>
                        <p className="text-xl font-bold text-green-900">
                          {stats.desktop}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center shadow-sm">
                        <Monitor className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-xs text-green-600">Windows workstations</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-md shadow-sm border border-purple-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-purple-700 mb-1">
                          Laptops
                        </p>
                        <p className="text-xl font-bold text-purple-900">
                          {stats.laptop}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center shadow-sm">
                        <Cpu className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <p className="text-xs text-purple-600">Portable devices</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-md shadow-sm border border-red-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-red-700 mb-1">
                          Servers
                        </p>
                        <p className="text-xl font-bold text-red-900">
                          {stats.server}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-md flex items-center justify-center shadow-sm">
                        <HardDrive className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-xs text-red-600">Linux servers</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-md shadow-sm border border-blue-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          Total Systems
                        </p>
                        <p className="text-xl font-bold text-blue-900">
                          {stats.total}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600">Scanned systems</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-md shadow-sm border border-green-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-700 mb-1">
                          Software Packages
                        </p>
                        <p className="text-xl font-bold text-green-900">
                          {stats.totalPackages}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center shadow-sm">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-xs text-green-600">Installed software</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-md shadow-sm border border-purple-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-purple-700 mb-1">
                          Services
                        </p>
                        <p className="text-xl font-bold text-purple-900">
                          {stats.services}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center shadow-sm">
                        <Settings className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <p className="text-xs text-purple-600">System services</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-md shadow-sm border border-red-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-red-700 mb-1">
                          Startup Programs
                        </p>
                        <p className="text-xl font-bold text-red-900">
                          {stats.startupPrograms}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-md flex items-center justify-center shadow-sm">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-xs text-red-600">Auto-start programs</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Alerts Widget - Only show on hardware/software tabs */}
            {activeTab !== "alerts" && (
              <div className="mb-8">
                <AlertsWidget onViewAll={() => setActiveTab("alerts")} />
              </div>
            )}

            {/* Search and Filter Bar */}
            <div className="bg-white rounded border border-gray-200 p-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by hostname, MAC address, or CPU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 bg-white"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="pl-7 pr-5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="desktop">Desktops</option>
                      <option value="laptop">Laptops</option>
                      <option value="server">Servers</option>
                    </select>
                  </div>

                  <button
                    onClick={fetchHardware}
                    disabled={loading}
                    className="flex items-center px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-1 focus:ring-gray-400 disabled:opacity-50 text-sm"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 mr-1 ${
                        loading ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : activeTab === "alerts" ? (
              <AlertsPanel />
            ) : activeTab === "tickets" ? (
              <div>
                {/* Create Ticket Button */}
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Your Support Tickets
                  </h2>
                  <button
                    onClick={() => setShowCreateTicketModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </button>
                </div>

                {/* Tickets List */}
                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No support tickets found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      You haven't created any support tickets yet.
                    </p>
                    <button
                      onClick={() => setShowCreateTicketModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Ticket
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {tickets.map((ticket) => (
                      <TicketCard
                        key={ticket._id}
                        ticket={ticket}
                        onClick={(ticket) => {
                          // Only allow opening tickets that are not closed or rejected
                          if (ticket.status !== "Closed" && ticket.status !== "Rejected") {
                            setSelectedTicket(ticket);
                          }
                        }}
                        isAdmin={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "hardware" ? (
              filteredHardware.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hardware assets found
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || filterType !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : user?.role === "admin"
                      ? "No assets have been registered yet."
                      : "No assets have been assigned to you yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHardware.map((item) => (
                    <HardwareCard
                      key={item._id}
                      hardware={item}
                      onClick={setSelectedHardware}
                    />
                  ))}
                </div>
              )
            ) : filteredSoftware.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No software data found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search criteria."
                    : "No software inventory data available yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSoftware.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border cursor-pointer"
                    onClick={() => setSelectedSoftware(item)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.system?.hostname || "Unknown System"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {item.system?.platform} Software
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">MAC Address</p>
                        <p className="text-sm font-mono text-gray-700">
                          {item.system?.mac_address || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Installed</p>
                          <p className="text-sm font-medium text-gray-900">
                            {item.installed_software?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500">packages</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4 text-gray-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Services</p>
                          <p className="text-sm font-medium text-gray-900">
                            {item.services?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500">running</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Play className="h-4 w-4 text-gray-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Startup</p>
                          <p className="text-sm font-medium text-gray-900">
                            {item.startup_programs?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500">programs</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4 text-gray-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-sm font-medium text-gray-900">
                            {item.scan_metadata?.total_software_count || 0}
                          </p>
                          <p className="text-xs text-gray-500">items</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-xs text-gray-500">
                        Last scan:{" "}
                        {new Date(
                          item.scan_metadata?.last_updated || item.updatedAt
                        ).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">Scanned</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results Info */}
            {!loading && activeTab !== "alerts" && (
              <div className="mt-8 text-center text-sm text-gray-500">
                {activeTab === "hardware"
                  ? filteredHardware.length > 0 &&
                    `Showing ${filteredHardware.length} of ${hardware.length} hardware assets`
                  : filteredSoftware.length > 0 &&
                    `Showing ${filteredSoftware.length} of ${software.length} software inventories`}
              </div>
            )}
          </div>
        </div>

        {/* Create Ticket Modal */}
        <CreateTicketModal
          isOpen={showCreateTicketModal}
          onClose={() => setShowCreateTicketModal(false)}
          onSuccess={(newTicket) => {
            // Add new ticket and maintain sorting (active tickets first, closed last)
            const updatedTickets = [newTicket, ...tickets];
            const sortedTickets = updatedTickets.sort((a, b) => {
              const aIsClosed = a.status === "Closed" || a.status === "Rejected";
              const bIsClosed = b.status === "Closed" || b.status === "Rejected";
              
              if (aIsClosed && !bIsClosed) return 1;  // a goes after b
              if (!aIsClosed && bIsClosed) return -1; // a goes before b
              return 0; // keep original order for same status type
            });
            
            setTickets(sortedTickets);
            setShowCreateTicketModal(false);
            toast.success("Ticket created successfully!");
          }}
        />

        {/* ML Service Control Panel */}
        <MLServiceControlPanel
          isOpen={showMLControlPanel}
          onClose={() => setShowMLControlPanel(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
