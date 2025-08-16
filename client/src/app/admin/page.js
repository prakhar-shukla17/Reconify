"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import HardwareCard from "../../components/HardwareCard";
import HardwareDetails from "../../components/HardwareDetails";
import { hardwareAPI, authAPI } from "../../lib/api";
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

  useEffect(() => {
    if (activeTab === "assets") {
      fetchHardware();
    } else if (activeTab === "users") {
      fetchUsers();
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
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAsset = async (userId, macAddress) => {
    try {
      await authAPI.assignAsset(userId, macAddress);
      toast.success("Asset assigned successfully");
      fetchUsers();
      setShowAssignModal(false);
    } catch (error) {
      toast.error("Failed to assign asset");
    }
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
                </nav>
              </div>

              {/* Search and Filter Bar */}
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    {activeTab === "assets" && (
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHardware.map((item) => (
                    <div key={item._id} className="relative">
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
                  ))}
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
      </div>
    </ProtectedRoute>
  );
}
