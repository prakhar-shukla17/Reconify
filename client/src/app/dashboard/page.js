"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import HardwareCard from "../../components/HardwareCard";
import HardwareDetails from "../../components/HardwareDetails";
import { hardwareAPI } from "../../lib/api";
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
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHardware, setSelectedHardware] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchHardware();
  }, []);

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

  const getSystemStats = () => {
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                      {stats.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Monitor className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Desktops
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.desktop}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Cpu className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Laptops</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.laptop}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <HardDrive className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Servers</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.server}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by hostname, MAC address, or CPU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Hardware Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredHardware.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No assets found
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
            )}

            {/* Results Info */}
            {!loading && filteredHardware.length > 0 && (
              <div className="mt-8 text-center text-sm text-gray-500">
                Showing {filteredHardware.length} of {hardware.length} assets
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
