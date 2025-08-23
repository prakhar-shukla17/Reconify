"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import HardwareCard from "../../components/HardwareCard";
import HardwareDetails from "../../components/HardwareDetails";
import SoftwareDetails from "../../components/SoftwareDetails";
import AlertsWidget from "../../components/AlertsWidget";
import AlertsPanel from "../../components/AlertsPanel";
import EnhancedAssignmentModal from "../../components/EnhancedAssignmentModal";
import ManualAssetModal from "../../components/lazy/ManualAssetModal.lazy";
import CsvImportModal from "../../components/lazy/CsvImportModal.lazy";
import TicketCard from "../../components/TicketCard";
import TicketManagementModal from "../../components/lazy/TicketManagementModal.lazy";
import HealthDashboard from "../../components/lazy/HealthDashboard.lazy";
import MLServiceControlPanel from "../../components/lazy/MLServiceControlPanel.lazy";
import Pagination from "../../components/Pagination";
import LazyLoader from "../../components/LazyLoader";
import { hardwareAPI, authAPI, ticketsAPI, softwareAPI } from "../../lib/api";
import toast from "react-hot-toast";
import { throttle } from "../../utils/performance";
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
  FileText,
  AlertCircle,
  Play,
} from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("assets");
  const [hardware, setHardware] = useState([]);
  const [software, setSoftware] = useState([]);
  const [assetType, setAssetType] = useState("hardware"); // "hardware" or "software"
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedHardware, setSelectedHardware] = useState(null);
  const [selectedSoftware, setSelectedSoftware] = useState(null);
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
  const [showMLControlPanel, setShowMLControlPanel] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Cache for asset data to prevent unnecessary API calls
  const [assetCache, setAssetCache] = useState({});
  const [lastFetchTime, setLastFetchTime] = useState({});

  // Ref for the assets section to scroll to
  const assetsSectionRef = useRef(null);



  useEffect(() => {
    if (activeTab === "assets") {
      setCurrentPage(1); // Reset to first page when switching to assets tab
      if (assetType === "hardware") {
        fetchHardware(1);
        fetchDashboardStats();
      } else {
        fetchSoftware(1);
      }
      // Only fetch users once when needed, not every time
      if (users.length === 0) {
        fetchUsers();
      }
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [activeTab, assetType]);

  // Refetch data when search or filter changes
  useEffect(() => {
    if (activeTab === "assets") {
      // Add debounce for search to reduce API calls
      const timeoutId = setTimeout(() => {
        setCurrentPage(1); // Reset to first page when search/filter changes
        if (assetType === "hardware") {
          fetchHardware(1);
        } else {
          fetchSoftware(1);
        }
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, filterType]);

  const handleAssetTypeChange = (type) => {
    setAssetType(type);
    setCurrentPage(1);

    // Scroll to the top of the assets section when switching asset types
    if (assetsSectionRef.current) {
      assetsSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    if (type === "hardware") {
      fetchHardware(1);
    } else {
      fetchSoftware(1);
    }
  };

  const fetchHardware = async (page = currentPage, limit = itemsPerPage) => {
    try {
      // Check cache first
      const cacheKey = `hardware_${page}_${limit}_${searchTerm}_${filterType}`;
      const now = Date.now();
      const cacheAge = now - (lastFetchTime[cacheKey] || 0);

      // Use cache if it's less than 30 seconds old and we have the data
      if (assetCache[cacheKey] && cacheAge < 30000) {
        setHardware(assetCache[cacheKey].data);
        setCurrentPage(assetCache[cacheKey].pagination.currentPage);
        setTotalPages(assetCache[cacheKey].pagination.totalPages);
        setTotalItems(assetCache[cacheKey].pagination.totalItems);
        return;
      }

      // Use searchLoading for search operations, main loading for initial fetch
      if (page === 1 && !searchTerm && filterType === "all") {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }

      // Build query parameters
      const params = {
        page: page,
        limit: limit,
      };

      // Add search and filter parameters if we're on the assets tab
      if (activeTab === "assets") {
        if (searchTerm) {
          params.search = searchTerm;
        }
        if (filterType && filterType !== "all") {
          params.filter = filterType;
        }
      }

      const response = await hardwareAPI.getAll(params);
      const hardwareData = response.data.data || [];

      setHardware(hardwareData);

      // Update pagination info
      if (response.data.pagination) {
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);

        // Cache the response
        setAssetCache((prev) => ({
          ...prev,
          [cacheKey]: {
            data: hardwareData,
            pagination: response.data.pagination,
          },
        }));
        setLastFetchTime((prev) => ({
          ...prev,
          [cacheKey]: now,
        }));
      } else {
        // Fallback pagination if API doesn't provide it
        const totalItems = hardwareData.length;
        setTotalItems(totalItems);
        setTotalPages(Math.ceil(totalItems / limit));
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching hardware:", error);
      toast.error("Failed to load hardware data");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await hardwareAPI.getStats();
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchSoftware = async (page = currentPage, limit = itemsPerPage) => {
    try {
      // Check cache first
      const cacheKey = `software_${page}_${limit}_${searchTerm}_${filterType}`;
      const now = Date.now();
      const cacheAge = now - (lastFetchTime[cacheKey] || 0);

      // Use cache if it's less than 30 seconds old and we have the data
      if (assetCache[cacheKey] && cacheAge < 30000) {
        setSoftware(assetCache[cacheKey].data);
        setCurrentPage(assetCache[cacheKey].pagination.currentPage);
        setTotalPages(assetCache[cacheKey].pagination.totalPages);
        setTotalItems(assetCache[cacheKey].pagination.totalItems);
        return;
      }

      // Use searchLoading for search operations, main loading for initial fetch
      if (page === 1 && !searchTerm && filterType === "all") {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }

      // Build query parameters
      const params = {
        page: page,
        limit: limit,
      };

      // Add search and filter parameters if we're on the assets tab
      if (activeTab === "assets") {
        if (searchTerm) {
          params.search = searchTerm;
        }
        if (filterType && filterType !== "all") {
          params.filter = filterType;
        }
      }

      const response = await softwareAPI.getAll(params);
      const softwareData = response.data.data || [];

      setSoftware(softwareData);

      // Update pagination info
      if (response.data.pagination) {
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);

        // Cache the response
        setAssetCache((prev) => ({
          ...prev,
          [cacheKey]: {
            data: softwareData,
            pagination: response.data.pagination,
          },
        }));
        setLastFetchTime((prev) => ({
          ...prev,
          [cacheKey]: now,
        }));
      } else {
        // Fallback pagination if API doesn't provide it
        const totalItems = softwareData.length;
        setTotalItems(totalItems);
        setTotalPages(Math.ceil(totalItems / limit));
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching software:", error);
      toast.error("Failed to load software data");
    } finally {
      setLoading(false);
      setSearchLoading(false);
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

  const handlePageChange = (page) => {
    setCurrentPage(page);

    // Scroll to the top of the assets section when changing pages
    if (assetsSectionRef.current) {
      assetsSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    if (assetType === "hardware") {
      fetchHardware(page);
    } else {
      fetchSoftware(page);
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

        if (aIsClosed && !bIsClosed) return 1; // a goes after b
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

  const handleAssignAsset = async (userId, macAddress) => {
    try {
      const response = await authAPI.assignAsset(userId, macAddress);
      toast.success("Asset assigned successfully");
      fetchUsers();
      if (assetType === "hardware") {
        fetchHardware(); // Also refresh hardware to update assignment status
      } else {
        fetchSoftware(); // Refresh software if that's what we're viewing
      }
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
    const allAssetIds = currentAssets.map((item) => item._id);
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
    if (assetType === "hardware") {
      fetchHardware();
    } else {
      fetchSoftware();
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

  const isAssetAssigned = (macAddress) => {
    return users.some((user) => user.assignedAssets?.includes(macAddress));
  };

  const getAssignedUser = (macAddress) => {
    return users.find((user) => user.assignedAssets?.includes(macAddress));
  };

  const currentAssets = assetType === "hardware" ? hardware : software;

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSystemStats = () => {
    if (activeTab === "tickets") {
      // Ticket statistics
      const totalTickets = tickets.length;
      const openTickets = tickets.filter((t) => t.status === "Open").length;
      const resolvedTickets = tickets.filter(
        (t) => t.status === "Resolved"
      ).length;
      const closedTickets = tickets.filter((t) => t.status === "Closed").length;
      const inProgressTickets = tickets.filter(
        (t) => t.status === "In Progress"
      ).length;

      return {
        totalTickets,
        openTickets,
        resolvedTickets,
        closedTickets,
        inProgressTickets,
      };
    } else if (activeTab === "assets") {
      if (assetType === "hardware") {
        // Hardware statistics - use dashboard stats for total count if available
        const totalAssets = dashboardStats?.totalAssets || hardware.length;
        const assignedAssets =
          dashboardStats?.assignedAssets ||
          hardware.filter((h) => isAssetAssigned(h.system?.mac_address)).length;
        const totalUsers = users.length;
        const activeUsers = users.filter((u) => u.isActive).length;

        return {
          totalAssets,
          assignedAssets,
          unassignedAssets: totalAssets - assignedAssets,
          totalUsers,
          activeUsers,
        };
      } else {
        // Software statistics
        const totalSystems = software.length;
        const totalPackages = software.reduce(
          (sum, s) => sum + (s.scan_metadata?.total_software_count || 0),
          0
        );
        const totalServices = software.reduce(
          (sum, s) => sum + (s.services?.length || 0),
          0
        );
        const totalStartupPrograms = software.reduce(
          (sum, s) => sum + (s.startup_programs?.length || 0),
          0
        );

        return {
          totalSystems,
          totalPackages,
          totalServices,
          totalStartupPrograms,
        };
      }
    } else {
      // User statistics (default)
      const totalUsers = users.length;
      const activeUsers = users.filter((u) => u.isActive).length;

      return {
        totalUsers,
        activeUsers,
      };
    }
  };

  const stats = getSystemStats();

  // Search function that only triggers when explicitly called
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    if (activeTab === "assets") {
      if (assetType === "hardware") {
        fetchHardware(1);
      } else {
        fetchSoftware(1);
      }
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, assetType, fetchHardware, fetchSoftware, fetchUsers]);

  // Handle search input change without triggering search
  const handleSearchInputChange = (value) => {
    setSearchTerm(value);
  };

  // Handle search button click or Enter key press
  const handleSearchSubmit = () => {
    handleSearch(searchTerm);
  };

  // Clear search and reset to show all items
  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    if (activeTab === "assets") {
      if (assetType === "hardware") {
        fetchHardware(1);
      } else {
        fetchSoftware(1);
      }
    } else if (activeTab === "users") {
      fetchUsers();
    }
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

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
                             <HardwareDetails 
                 hardware={selectedHardware} 
                 onHardwareUpdate={(updatedHardware) => {
                   console.log('Admin page received onHardwareUpdate:', updatedHardware);
                   setSelectedHardware(updatedHardware);
                   // Also update the hardware in the main list
                   setHardware(prevHardware => 
                     prevHardware.map(h => 
                       h._id === updatedHardware._id ? updatedHardware : h
                     )
                   );
                 }}
               />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (selectedSoftware) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <SoftwareDetails 
            software={selectedSoftware} 
            onBack={() => setSelectedSoftware(null)} 
          />
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
              {activeTab === "tickets" ? (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-md shadow-sm border border-blue-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          Total Tickets
                        </p>
                        <p className="text-xl font-bold text-blue-900">
                          {stats.totalTickets}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm">
                        <Ticket className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600">
                        All support requests
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-md shadow-sm border border-red-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-red-700 mb-1">
                          Open
                        </p>
                        <p className="text-xl font-bold text-red-900">
                          {stats.openTickets}
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

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-md shadow-sm border border-amber-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-amber-700 mb-1">
                          In Progress
                        </p>
                        <p className="text-xl font-bold text-amber-900">
                          {stats.inProgressTickets}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-md flex items-center justify-center shadow-sm">
                        <Settings className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-amber-200">
                      <p className="text-xs text-amber-600">Being worked on</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-md shadow-sm border border-green-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-700 mb-1">
                          Resolved
                        </p>
                        <p className="text-xl font-bold text-green-900">
                          {stats.resolvedTickets}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center shadow-sm">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-xs text-green-600">
                        Successfully completed
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-md shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Closed
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {stats.closedTickets}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-md flex items-center justify-center shadow-sm">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">Archived tickets</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-md shadow-sm border border-blue-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          {assetType === "hardware"
                            ? "Total Assets"
                            : "Total Systems"}
                        </p>
                        <p className="text-xl font-bold text-blue-900">
                          {assetType === "hardware"
                            ? stats.totalAssets
                            : stats.totalSystems}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600">
                        {assetType === "hardware"
                          ? "All registered devices"
                          : "All scanned systems"}
                      </p>
                    </div>
                  </div>

                  {assetType === "hardware" ? (
                    <>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-md shadow-sm border border-green-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-green-700 mb-1">
                              Assigned
                            </p>
                            <p className="text-xl font-bold text-green-900">
                              {stats.assignedAssets}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center shadow-sm">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <p className="text-xs text-green-600">
                            User assigned
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-md shadow-sm border border-red-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-red-700 mb-1">
                              Unassigned
                            </p>
                            <p className="text-xl font-bold text-red-900">
                              {stats.unassignedAssets}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-md flex items-center justify-center shadow-sm">
                            <X className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs text-red-600">
                            Available for assignment
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
                          <p className="text-xs text-green-600">
                            Installed software
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-md shadow-sm border border-purple-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-purple-700 mb-1">
                              Services
                            </p>
                            <p className="text-xl font-bold text-purple-900">
                              {stats.totalServices}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center shadow-sm">
                            <Settings className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-purple-200">
                          <p className="text-xs text-purple-600">
                            System services
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-md shadow-sm border border-purple-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-purple-700 mb-1">
                          {assetType === "hardware"
                            ? "Total Users"
                            : "Startup Programs"}
                        </p>
                        <p className="text-xl font-bold text-purple-900">
                          {assetType === "hardware"
                            ? stats.totalUsers
                            : stats.totalStartupPrograms}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center shadow-sm">
                        {assetType === "hardware" ? (
                          <Users className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <p className="text-xs text-purple-600">
                        {assetType === "hardware"
                          ? "Registered accounts"
                          : "Auto-start programs"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-md shadow-sm border border-emerald-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-emerald-700 mb-1">
                          {assetType === "hardware"
                            ? "Active Users"
                            : "Active Services"}
                        </p>
                        <p className="text-xl font-bold text-emerald-900">
                          {assetType === "hardware"
                            ? stats.activeUsers
                            : stats.totalServices}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md flex items-center justify-center shadow-sm">
                        {assetType === "hardware" ? (
                          <UserPlus className="h-4 w-4 text-white" />
                        ) : (
                          <Settings className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-200">
                      <p className="text-xs text-emerald-600">
                        {assetType === "hardware"
                          ? "Currently active"
                          : "Running services"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-1 px-4" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("assets")}
                    className={`py-3 px-3 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                      activeTab === "assets"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Monitor className="h-4 w-4 inline mr-2" />
                    Assets
                  </button>
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`py-3 px-3 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                      activeTab === "users"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="h-4 w-4 inline mr-2" />
                    Users
                  </button>
                  <button
                    onClick={() => setActiveTab("alerts")}
                    className={`py-3 px-3 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                      activeTab === "alerts"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Bell className="h-4 w-4 inline mr-2" />
                    Alerts
                  </button>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className={`py-3 px-3 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                      activeTab === "tickets"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Ticket className="h-4 w-4 inline mr-2" />
                    Tickets
                  </button>
                  <button
                    onClick={() => setShowHealthDashboard(true)}
                    className="py-3 px-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-t-lg"
                  >
                    <Activity className="h-4 w-4 inline mr-2" />
                    Health
                  </button>
                </nav>
              </div>

              {/* Search and Filter Bar */}
              {activeTab !== "alerts" && activeTab !== "tickets" && (
                <div className="bg-white rounded border border-gray-200 p-3">
                  {/* Asset Type Toggle */}
                  {activeTab === "assets" && (
                    <div className="mb-3">
                      <div className="flex space-x-1 bg-gray-100 p-1 rounded">
                        <button
                          onClick={() => handleAssetTypeChange("hardware")}
                          className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
                            assetType === "hardware"
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Monitor className="h-4 w-4" />
                            <span>Hardware</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleAssetTypeChange("software")}
                          className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
                            assetType === "software"
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4" />
                            <span>Software</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      {searchLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder={
                          activeTab === "assets"
                            ? assetType === "hardware"
                              ? "Search hardware assets..."
                              : "Search software systems..."
                            : "Search users..."
                        }
                        value={searchTerm}
                        onChange={(e) => handleSearchInputChange(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        className={`w-full pl-7 pr-24 py-1.5 border rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 transition-colors ${
                          searchTerm ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white'
                        }`}
                      />
                      <button
                        onClick={handleSearchSubmit}
                        disabled={searchLoading}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 focus:ring-1 focus:ring-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {searchLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          'Search'
                        )}
                      </button>
                                             {searchTerm && (
                         <button
                           onClick={handleClearSearch}
                           className="absolute right-16 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 focus:ring-1 focus:ring-gray-400 transition-colors"
                           title="Clear search"
                         >
                           ×
                         </button>
                       )}
                    </div>


                    <div className="flex items-center space-x-2">
                      {activeTab === "assets" && (
                        <>
                          <div className="relative">
                            <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                              value={filterType}
                              onChange={(e) => setFilterType(e.target.value)}
                              className="pl-7 pr-5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 bg-white"
                            >
                              {assetType === "hardware" ? (
                                <>
                                  <option value="all">All Hardware</option>
                                  <option value="assigned">Assigned</option>
                                  <option value="unassigned">Unassigned</option>
                                </>
                              ) : (
                                <>
                                  <option value="all">All Software</option>
                                  <option value="windows">Windows</option>
                                  <option value="linux">Linux</option>
                                  <option value="macos">macOS</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div className="relative">
                            <select
                              value={itemsPerPage}
                              onChange={(e) => {
                                const newLimit = parseInt(e.target.value);
                                setItemsPerPage(newLimit);
                                setCurrentPage(1);
                                if (assetType === "hardware") {
                                  fetchHardware(1, newLimit);
                                } else {
                                  fetchSoftware(1, newLimit);
                                }
                              }}
                              className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 bg-white"
                            >
                              <option value={12}>12 per page</option>
                              <option value={24}>24 per page</option>
                              <option value={36}>36 per page</option>
                              <option value={48}>48 per page</option>
                            </select>
                          </div>
                        </>
                      )}

                      <button
                        onClick={
                          activeTab === "assets"
                            ? () => {
                                setCurrentPage(1);
                                if (assetType === "hardware") {
                                  fetchHardware(1);
                                } else {
                                  fetchSoftware(1);
                                }
                              }
                            : fetchUsers
                        }
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

                      {activeTab === "assets" && (
                        <>
                          <button
                            onClick={() => setShowCsvImportModal(true)}
                            className="flex items-center px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-1 focus:ring-gray-400 text-sm"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Import CSV
                          </button>
                          <button
                            onClick={() => setShowManualAssetModal(true)}
                            className="flex items-center px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-1 focus:ring-gray-400 text-sm"
                          >
                            <Package className="h-3.5 w-3.5 mr-1" />
                            Add Asset
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
              <div className="p-4">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-800 mb-1 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Support Tickets Management
                  </h2>
                  <p className="text-sm text-slate-600">
                    View and manage all support tickets from users
                  </p>
                </div>

                {tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Ticket className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-base font-medium text-slate-800 mb-1">
                      No support tickets found
                    </h3>
                    <p className="text-sm text-slate-500">
                      No users have created support tickets yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tickets.map((ticket) => (
                      <TicketCard
                        key={ticket._id}
                        ticket={ticket}
                        onClick={(ticket) => {
                          // Only allow opening tickets that are not closed or rejected
                          if (
                            ticket.status !== "Closed" &&
                            ticket.status !== "Rejected"
                          ) {
                            setSelectedTicket(ticket);
                            setShowTicketManagementModal(true);
                          }
                        }}
                        isAdmin={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "assets" ? (
              // Assets Tab
              <div ref={assetsSectionRef}>
                {/* Page Info */}
                {totalItems > 0 && (
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Page {currentPage} of {totalPages} • {totalItems} total{" "}
                        {assetType === "hardware"
                          ? "hardware assets"
                          : "software systems"}
                      </span>
                    </div>
                  </div>
                )}

                {currentAssets.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No{" "}
                      {assetType === "hardware"
                        ? "hardware assets"
                        : "software systems"}{" "}
                      found
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || filterType !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : `No ${
                            assetType === "hardware"
                              ? "hardware assets"
                              : "software systems"
                          } have been registered yet.`}
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Loading Skeleton */}
                    {loading && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg shadow-md p-6 animate-pulse"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                                <div className="space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-20"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                                </div>
                              ))}
                            </div>
                            <div className="pt-4 border-t">
                              <div className="flex justify-between items-center">
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actual Assets Grid */}
                    {!loading && (
                      <>
                        {/* Bulk Actions Bar */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedAssets.length ===
                                      currentAssets.length &&
                                    currentAssets.length > 0
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
                                  {currentAssets.length})
                                </span>
                              </div>
                              {selectedAssets.length > 0 && (
                                <div className="text-sm text-gray-600">
                                  {selectedAssets.length} asset
                                  {selectedAssets.length !== 1 ? "s" : ""}{" "}
                                  selected
                                </div>
                              )}
                            </div>
                            {selectedAssets.length > 0 && (
                              <button
                                onClick={handleEnhancedAssignment}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <UserPlus className="h-4 w-4" />
                                <span>
                                  Bulk Assign ({selectedAssets.length})
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {currentAssets.map((item) => {
                            const isSelected = selectedAssets.includes(
                              item._id
                            );
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
                                      handleAssetSelection(
                                        item._id,
                                        e.target.checked
                                      )
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>

                                {assetType === "hardware" ? (
                                  <HardwareCard
                                    hardware={item}
                                    onClick={setSelectedHardware}
                                  />
                                ) : (
                                  // Software Card - Same as Dashboard
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
                                )}

                                <div className="absolute top-2 right-2 flex space-x-2">
                                  {assetType === "hardware" && (
                                    <>
                                      {isAssetAssigned(
                                        item.system?.mac_address
                                      ) ? (
                                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                          Assigned to{" "}
                                          {
                                            getAssignedUser(
                                              item.system?.mac_address
                                            )?.username
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
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Pagination */}
                    {currentAssets.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                      />
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === "users" ? (
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
                              <div className="text-xs font-medium text-gray-900">
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
            ) : null}
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
        <LazyLoader>
          <ManualAssetModal
            isOpen={showManualAssetModal}
            onClose={() => setShowManualAssetModal(false)}
            onSuccess={() => {
              setCurrentPage(1);
              if (assetType === "hardware") {
                fetchHardware(1);
              } else {
                fetchSoftware(1);
              }
              setShowManualAssetModal(false);
            }}
          />
        </LazyLoader>

        {/* Ticket Management Modal */}
        {showTicketManagementModal && selectedTicket && (
          <LazyLoader>
            <TicketManagementModal
              ticket={selectedTicket}
              onClose={() => {
                setShowTicketManagementModal(false);
                setSelectedTicket(null);
              }}
              onUpdate={() => {
                fetchTickets();
              }}
            />
          </LazyLoader>
        )}

        {/* Health Dashboard */}
        <LazyLoader>
          <HealthDashboard
            isOpen={showHealthDashboard}
            onClose={() => setShowHealthDashboard(false)}
          />
        </LazyLoader>

        {/* ML Service Control Panel */}
        <LazyLoader>
          <MLServiceControlPanel
            isOpen={showMLControlPanel}
            onClose={() => setShowMLControlPanel(false)}
          />
        </LazyLoader>

        {/* CSV Import Modal */}
        <LazyLoader>
          <CsvImportModal
            isOpen={showCsvImportModal}
            onClose={() => setShowCsvImportModal(false)}
            onImportComplete={(results) => {
              toast.success(
                `Successfully imported ${results.data.successCount} assets`
              );
              setCurrentPage(1);
              if (assetType === "hardware") {
                fetchHardware(1);
              } else {
                fetchSoftware(1);
            }
            setShowCsvImportModal(false);
          }}
        />
        </LazyLoader>
      </div>
    </ProtectedRoute>
  );
}
