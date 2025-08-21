"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import HardwareCard from "../../components/HardwareCard";
import HardwareDetails from "../../components/HardwareDetails";
import AlertsWidget from "../../components/AlertsWidget";
import AlertsPanel from "../../components/AlertsPanel";
import EnhancedAssignmentModal from "../../components/EnhancedAssignmentModal";
import ManualAssetModal from "../../components/ManualAssetModal";
import CsvImportModal from "../../components/CsvImportModal";
import TicketCard from "../../components/TicketCard";
import TicketManagementModal from "../../components/TicketManagementModal";
import HealthDashboard from "../../components/HealthDashboard";
import MLAnalyticsDashboard from "../../components/MLAnalyticsDashboard";
import MLServiceControlPanel from "../../components/MLServiceControlPanel";
import { hardwareAPI, authAPI, ticketsAPI } from "../../lib/api";
import toast from "react-hot-toast";
import {
  Users,
  Monitor,
  Settings,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Package,
  Shield,
  X,
  Check,
  Eye,
  Bell,
  Ticket,
  Activity,
  Brain,
  FileText,
} from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("assets");
  const [hardware, setHardware] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHardware, setSelectedHardware] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showEnhancedAssignModal, setShowEnhancedAssignModal] = useState(false);
  const [showManualAssetModal, setShowManualAssetModal] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketManagementModal, setShowTicketManagementModal] =
    useState(false);
  const [showHealthDashboard, setShowHealthDashboard] = useState(false);
  const [showMLDashboard, setShowMLDashboard] = useState(false);
  const [showMLControlPanel, setShowMLControlPanel] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);

  useEffect(() => {
    if (activeTab === "assets") {
      fetchHardware();
      fetchUsers(); // Always fetch users for assignment functionality
    } else if (activeTab === "users") {
      fetchUsers();
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAllUsers();
      console.log("Users API response:", response.data);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getAll();
      setTickets(response.data.data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAsset = async (userId, macAddress) => {
    try {
      console.log("Assigning asset:", { userId, macAddress });
      const response = await authAPI.assignAsset(userId, macAddress);
      console.log("Assignment response:", response.data);
      toast.success("Asset assigned successfully");
      fetchUsers();
      fetchHardware(); // Also refresh hardware to update assignment status
      setShowAssignModal(false);
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(error.response?.data?.error || "Failed to assign asset");
    }
  };

  const handleAssetSelection = (assetId, isSelected) => {
    setSelectedAssets((prev) => {
      if (isSelected) {
        return [...prev, assetId];
      } else {
        return prev.filter((id) => id !== assetId);
      }
    });
  };

  const handleSelectAllAssets = () => {
    const allAssetIds = filteredHardware.map((item) => item._id);
    setSelectedAssets(allAssetIds);
  };

  const handleDeselectAllAssets = () => {
    setSelectedAssets([]);
  };

  const handleEnhancedAssignment = () => {
    if (selectedAssets.length === 0) {
      toast.error("Please select at least one asset");
      return;
    }
    setShowEnhancedAssignModal(true);
  };

  const handleAssignmentComplete = () => {
    setSelectedAssets([]);
    fetchUsers();
    fetchHardware();
  };

  const handleRemoveAsset = async (userId, macAddress) => {
    try {
      await authAPI.removeAsset(userId, macAddress);
      toast.success("Asset removed successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to remove asset");
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
      (filterType === "assigned" &&
        isAssetAssigned(item.system?.mac_address)) ||
      (filterType === "unassigned" &&
        !isAssetAssigned(item.system?.mac_address));

    return matchesSearch && matchesFilter;
  });

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAssetAssigned = (macAddress) => {
    return users.some((user) => user.assignedAssets?.includes(macAddress));
  };

  const getAssignedUser = (macAddress) => {
    return users.find((user) => user.assignedAssets?.includes(macAddress));
  };

  const getSystemStats = () => {
    const totalAssets = hardware.length;
    const assignedAssets = hardware.filter((h) =>
      isAssetAssigned(h.system?.mac_address)
    ).length;
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isActive).length;

    return {
      totalAssets,
      assignedAssets,
      unassignedAssets: totalAssets - assignedAssets,
      totalUsers,
      activeUsers,
    };
  };

  const stats = getSystemStats();

  if (selectedHardware) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSelectedHardware(null)}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin Panel
              </button>
              <HardwareDetails hardware={selectedHardware} />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-gray-600">
                Manage users, assets, and system configuration
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Assets
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalAssets}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Assigned
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.assignedAssets}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Unassigned
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.unassignedAssets}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Users
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalUsers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserPlus className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Active Users
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.activeUsers}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("assets")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "assets"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Monitor className="h-4 w-4 inline mr-2" />
                    Assets Management
                  </button>
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "users"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Users className="h-4 w-4 inline mr-2" />
                    User Management
                  </button>
                  <button
                    onClick={() => setActiveTab("alerts")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "alerts"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Bell className="h-4 w-4 inline mr-2" />
                    Warranty Alerts
                  </button>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "tickets"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Ticket className="h-4 w-4 inline mr-2" />
                    Support Tickets
                  </button>
                  <button
                    onClick={() => setShowHealthDashboard(true)}
                    className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  >
                    <Activity className="h-4 w-4 inline mr-2" />
                    System Health
                  </button>
                  <button
                    onClick={() => setShowMLDashboard(true)}
                    className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-indigo-600 hover:text-indigo-700 hover:border-indigo-300"
                  >
                    <Brain className="h-4 w-4 inline mr-2" />
                    ML Analytics
                  </button>
                </nav>
              </div>

              {/* Search and Filter Bar */}
              {activeTab !== "alerts" && activeTab !== "tickets" && (
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={
                          activeTab === "assets"
                            ? "Search assets..."
                            : "Search users..."
                        }
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      {activeTab === "assets" && (
                        <div className="relative">
                          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                          >
                            <option value="all">All Assets</option>
                            <option value="assigned">Assigned</option>
                            <option value="unassigned">Unassigned</option>
                          </select>
                        </div>
                      )}

                      <button
                        onClick={
                          activeTab === "assets" ? fetchHardware : fetchUsers
                        }
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-2 ${
                            loading ? "animate-spin" : ""
                          }`}
                        />
                        Refresh
                      </button>

                      {activeTab === "assets" && (
                        <>
                          <button
                            onClick={() => setShowCsvImportModal(true)}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Import CSV
                          </button>
                          <button
                            onClick={() => setShowManualAssetModal(true)}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Add Manual Asset
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : activeTab === "alerts" ? (
              <AlertsPanel />
            ) : activeTab === "tickets" ? (
              // Tickets Tab
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Support Tickets Management
                  </h2>
                  <p className="text-gray-600">
                    View and manage all support tickets from users
                  </p>
                </div>

                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No support tickets found
                    </h3>
                    <p className="text-gray-500">
                      No users have created support tickets yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tickets.map((ticket) => (
                      <TicketCard
                        key={ticket._id}
                        ticket={ticket}
                        onClick={(ticket) => {
                          setSelectedTicket(ticket);
                          setShowTicketManagementModal(true);
                        }}
                        isAdmin={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "assets" ? (
              // Assets Tab
              filteredHardware.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No assets found
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || filterType !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "No assets have been registered yet."}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Bulk Actions Bar */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={
                              selectedAssets.length ===
                                filteredHardware.length &&
                              filteredHardware.length > 0
                            }
                            onChange={(e) =>
                              e.target.checked
                                ? handleSelectAllAssets()
                                : handleDeselectAllAssets()
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Select All ({selectedAssets.length}/
                            {filteredHardware.length})
                          </span>
                        </div>
                        {selectedAssets.length > 0 && (
                          <div className="text-sm text-gray-600">
                            {selectedAssets.length} asset
                            {selectedAssets.length !== 1 ? "s" : ""} selected
                          </div>
                        )}
                      </div>
                      {selectedAssets.length > 0 && (
                        <button
                          onClick={handleEnhancedAssignment}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Bulk Assign ({selectedAssets.length})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHardware.map((item) => {
                      const isSelected = selectedAssets.includes(item._id);
                      return (
                        <div
                          key={item._id}
                          className={`relative ${
                            isSelected
                              ? "ring-2 ring-blue-500 ring-opacity-50"
                              : ""
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                handleAssetSelection(item._id, e.target.checked)
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <HardwareCard
                            hardware={item}
                            onClick={setSelectedHardware}
                          />

                          <div className="absolute top-2 right-2 flex space-x-2">
                            {isAssetAssigned(item.system?.mac_address) ? (
                              <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Assigned to{" "}
                                {
                                  getAssignedUser(item.system?.mac_address)
                                    ?.username
                                }
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAsset(item);
                                  setShowAssignModal(true);
                                }}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full hover:bg-blue-200"
                              >
                                Assign
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              // Users Tab
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Assets
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.department || "Not specified"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span>
                              {user.assignedAssets?.length || 0} assets
                            </span>
                            {user.assignedAssets?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {user.assignedAssets.slice(0, 2).map((mac) => (
                                  <span
                                    key={mac}
                                    className="text-xs bg-gray-100 px-2 py-1 rounded"
                                  >
                                    {mac.slice(-6)}
                                  </span>
                                ))}
                                {user.assignedAssets.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{user.assignedAssets.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Assign Asset Modal */}
        {showAssignModal && selectedAsset && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign Asset: {selectedAsset.system?.hostname}
                </h3>
                <div className="max-h-60 overflow-y-auto">
                  {users
                    .filter((u) => u.role === "user")
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <button
                          onClick={() =>
                            handleAssignAsset(
                              user.id,
                              selectedAsset.system?.mac_address
                            )
                          }
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Assignment Modal */}
        <EnhancedAssignmentModal
          isOpen={showEnhancedAssignModal}
          onClose={() => setShowEnhancedAssignModal(false)}
          selectedAssets={selectedAssets}
          users={users}
          onAssignmentComplete={handleAssignmentComplete}
        />

        {/* Manual Asset Modal */}
        <ManualAssetModal
          isOpen={showManualAssetModal}
          onClose={() => setShowManualAssetModal(false)}
          onSuccess={() => {
            fetchHardware();
            setShowManualAssetModal(false);
          }}
        />

        {/* Ticket Management Modal */}
        {showTicketManagementModal && selectedTicket && (
          <TicketManagementModal
            ticket={selectedTicket}
            onClose={() => {
              console.log("Closing ticket management modal");
              setShowTicketManagementModal(false);
              setSelectedTicket(null);
            }}
            onUpdate={() => {
              fetchTickets();
            }}
          />
        )}

        {/* Health Dashboard */}
        <HealthDashboard
          isOpen={showHealthDashboard}
          onClose={() => setShowHealthDashboard(false)}
        />

        {/* ML Analytics Dashboard */}
        {showMLDashboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Brain className="h-6 w-6 mr-2 text-indigo-600" />
                    ML Analytics Dashboard
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Advanced machine learning insights and predictions
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowMLControlPanel(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    ML Service Control
                  </button>
                  <button
                    onClick={() => setShowMLDashboard(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[calc(95vh-100px)]">
                <MLAnalyticsDashboard />
              </div>
            </div>
          </div>
        )}

        {/* ML Service Control Panel */}
        <MLServiceControlPanel
          isOpen={showMLControlPanel}
          onClose={() => setShowMLControlPanel(false)}
        />

        {/* CSV Import Modal */}
        <CsvImportModal
          isOpen={showCsvImportModal}
          onClose={() => setShowCsvImportModal(false)}
          onImportComplete={(results) => {
            toast.success(
              `Successfully imported ${results.data.successCount} assets`
            );
            fetchHardware();
            setShowCsvImportModal(false);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
