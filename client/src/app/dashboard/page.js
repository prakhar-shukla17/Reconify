"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import Pagination from "../../components/Pagination";
import { hardwareAPI, softwareAPI, ticketsAPI, authAPI } from "../../lib/api";
import toast from "react-hot-toast";

import { 
  exportTicketsToCSV, 
  exportTicketStatsToCSV, 
  exportTicketsResolvedToday, 
  exportTicketsByTimePeriod,
  exportTicketsBySLACompliance
} from "../../utils/exportUtils";
import {
  Monitor,
  HardDrive,
  Cpu,
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
  Download,
  Clock,
  X,
  BarChart3,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [hardware, setHardware] = useState([]);
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [selectedHardware, setSelectedHardware] = useState(null);
  const [selectedSoftware, setSelectedSoftware] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("hardware");

  // Asset pagination state
  const [assetPagination, setAssetPagination] = useState({
    currentPage: 1,
    itemsPerPage: 12,
    totalPages: 1,
    totalItems: 0
  });

  // Asset cache for better performance
  const [assetCache, setAssetCache] = useState(new Map());

  // Generate cache key for assets
  const getAssetCacheKey = useCallback((type, page, limit, search, filter) => {
    return `${type}-${page}-${limit}-${search || 'none'}-${filter || 'all'}`;
  }, []);

  const [tickets, setTickets] = useState([]);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showMLControlPanel, setShowMLControlPanel] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [assignmentStats, setAssignmentStats] = useState(null);



  // Ticket optimization state
  const [ticketCache, setTicketCache] = useState(new Map());
  const [lastTicketFetch, setLastTicketFetch] = useState(0);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState(null);
  const TICKET_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes





  // Get cached tickets if available
  const getCachedTickets = useCallback(() => {
    const cacheKey = `tickets-${user?.role || 'user'}`;
    const cached = ticketCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < TICKET_CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [ticketCache, user?.role]);

  // Set cached tickets
  const setCachedTickets = useCallback((data) => {
    const cacheKey = `tickets-${user?.role || 'user'}`;
    setTicketCache(prev => new Map(prev).set(cacheKey, {
      data,
      timestamp: Date.now()
    }));
  }, [user?.role]);

  // Optimized ticket fetching with caching
  const fetchTickets = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = getCachedTickets();
      if (cached) {
        setTickets(cached);
        setTicketError(null);
        return;
      }
    }

    try {
      setTicketLoading(true);
      setTicketError(null);
      
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
      setCachedTickets(sortedTickets);
      setLastTicketFetch(Date.now());
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setTicketError("Failed to load tickets");
      toast.error("Failed to load tickets");
    } finally {
      setTicketLoading(false);
    }
  }, [getCachedTickets, setCachedTickets]);

  // Memoized ticket statistics
  const ticketStats = useMemo(() => {
    if (!tickets.length) return { total: 0, open: 0, resolved: 0, closed: 0 };
    
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "Open").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
      closed: tickets.filter((t) => t.status === "Closed").length,
    };
  }, [tickets]);

  // Enhanced filtering and pagination state
  const [ticketFilters, setTicketFilters] = useState({
    status: 'all',
    priority: 'all',
    searchTerm: '',
    dateRange: 'all'
  });
  
  const [ticketPagination, setTicketPagination] = useState({
    currentPage: 1,
    itemsPerPage: 12,
    totalPages: 1,
    totalItems: 0
  });

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return ticketFilters.status !== 'all' || 
           ticketFilters.priority !== 'all' || 
           ticketFilters.dateRange !== 'all' || 
           ticketFilters.searchTerm;
  }, [ticketFilters]);

  // Memoized filtered tickets with advanced filtering
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];
    
    // Status filter
    if (ticketFilters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === ticketFilters.status);
    }
    
    // Only hide closed tickets if other filters are applied (not by default)
    if (hasActiveFilters && ticketFilters.status === 'all') {
      // When filters are applied but status is 'all', exclude closed and rejected tickets
      filtered = filtered.filter(ticket => 
        ticket.status !== 'Closed' && ticket.status !== 'Rejected'
      );
    }
    
    // Priority filter
    if (ticketFilters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === ticketFilters.priority);
    }
    
    // Search term filter
    if (ticketFilters.searchTerm) {
      const searchLower = ticketFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.title?.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower) ||
        ticket.ticket_id?.toLowerCase().includes(searchLower) ||
        ticket.created_by_name?.toLowerCase().includes(searchLower) ||
        ticket.asset_hostname?.toLowerCase().includes(searchLower)
      );
    }
    
    // Date range filter
    if (ticketFilters.dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (ticketFilters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case 'month':
          startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
          break;
        default:
          break;
      }
      
      if (startDate) {
        filtered = filtered.filter(ticket => new Date(ticket.created_at) >= startDate);
      }
    }
    
    return filtered;
  }, [tickets, ticketFilters, hasActiveFilters]);

  // Memoized paginated tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (ticketPagination.currentPage - 1) * ticketPagination.itemsPerPage;
    const endIndex = startIndex + ticketPagination.itemsPerPage;
    return filteredTickets.slice(startIndex, endIndex);
  }, [filteredTickets, ticketPagination.currentPage, ticketPagination.itemsPerPage]);

  // Update pagination when filters change
  useEffect(() => {
    const totalPages = Math.ceil(filteredTickets.length / ticketPagination.itemsPerPage);
    setTicketPagination(prev => ({
      ...prev,
      currentPage: 1, // Reset to first page when filters change
      totalPages: Math.max(1, totalPages),
      totalItems: filteredTickets.length
    }));
  }, [filteredTickets, ticketPagination.itemsPerPage]);



  // Pagination handlers for assets
  const handleAssetPageChange = (newPage) => {
    setPaginationLoading(true);
    setAssetPagination(prev => ({ ...prev, currentPage: newPage }));
    
    // Scroll to top of assets section when page changes
    setTimeout(() => {
      const assetsSection = document.querySelector('[data-assets-section]');
      if (assetsSection) {
        assetsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100); // Small delay to ensure state update completes
  };

  const handleAssetItemsPerPageChange = (newItemsPerPage) => {
    setPaginationLoading(true);
    setAssetPagination(prev => ({ 
      ...prev, 
      itemsPerPage: newItemsPerPage,
      currentPage: 1 // Reset to first page
    }));
    
    // Scroll to top of assets section when items per page changes
    setTimeout(() => {
      const assetsSection = document.querySelector('[data-assets-section]');
      if (assetsSection) {
        assetsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100); // Small delay to ensure state update completes
  };

  // Fetch assets when pagination changes
  useEffect(() => {
    if (activeTab === "hardware") {
      fetchHardware(assetPagination.currentPage, assetPagination.itemsPerPage);
    } else if (activeTab === "software") {
      fetchSoftware(assetPagination.currentPage, assetPagination.itemsPerPage);
    }
  }, [assetPagination.currentPage, assetPagination.itemsPerPage, activeTab]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setAssetPagination(prev => ({ ...prev, currentPage: 1 }));
    
    // Clear cache when filters change for fresh results
    setAssetCache(new Map());
  }, [searchTerm, filterType]);

  // Debounced search effect for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm && activeTab !== "tickets") {
        if (activeTab === "hardware") {
          fetchHardware(1, assetPagination.itemsPerPage);
        } else if (activeTab === "software") {
          fetchSoftware(1, assetPagination.itemsPerPage);
        }
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    if (activeTab === "hardware") {
      fetchHardware(1, assetPagination.itemsPerPage);
      fetchDashboardStats();
      fetchAssignmentStats();
    } else if (activeTab === "software") {
      fetchSoftware(1, assetPagination.itemsPerPage);
    } else if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [activeTab, fetchTickets]);

  // Auto-refresh tickets every 30 seconds when on tickets tab
  useEffect(() => {
    if (activeTab === "tickets") {
      const interval = setInterval(() => {
        fetchTickets(true); // Force refresh every 30 seconds
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, fetchTickets]);





  



  const fetchHardware = async (page = 1, limit = assetPagination.itemsPerPage) => {
    try {
      setLoading(true);
      
      // Check cache first
      const cacheKey = getAssetCacheKey('hardware', page, limit, searchTerm, filterType);
      const cached = assetCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
        setHardware(cached.data);
        setAssetPagination(prev => ({
          ...prev,
          currentPage: cached.pagination.currentPage,
          totalPages: cached.pagination.totalPages,
          totalItems: cached.pagination.totalItems,
          itemsPerPage: cached.pagination.itemsPerPage
        }));
        setLoading(false);
        setPaginationLoading(false);
        return;
      }
      
      const response = await hardwareAPI.getAll({ 
        page, 
        limit,
        search: searchTerm,
        filter: filterType 
      });
      
      const hardwareData = response.data.data || [];
      setHardware(hardwareData);
      
      // Update pagination state from server response
      if (response.data.pagination) {
        setAssetPagination(prev => ({
          ...prev,
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
          itemsPerPage: response.data.pagination.itemsPerPage
        }));
        
        // Cache the result
        setAssetCache(prev => new Map(prev).set(cacheKey, {
          data: hardwareData,
          pagination: response.data.pagination,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error("Error fetching hardware:", error);
      toast.error("Failed to load hardware data");
    } finally {
      setLoading(false);
      setPaginationLoading(false);
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

  const fetchAssignmentStats = async () => {
    try {
      const response = await authAPI.getAssignmentStatistics();
      setAssignmentStats(response.data.statistics);
    } catch (error) {
      console.error("Error fetching assignment stats:", error);
    }
  };

  const fetchSoftware = async (page = 1, limit = assetPagination.itemsPerPage) => {
    try {
      setLoading(true);
      
      // Check cache first
      const cacheKey = getAssetCacheKey('software', page, limit, searchTerm, filterType);
      const cached = assetCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
        setSoftware(cached.data);
        setAssetPagination(prev => ({
          ...prev,
          currentPage: cached.pagination.currentPage,
          totalPages: cached.pagination.totalPages,
          totalItems: cached.pagination.totalItems,
          itemsPerPage: cached.pagination.itemsPerPage
        }));
        setLoading(false);
        setPaginationLoading(false);
        return;
      }
      
      const response = await softwareAPI.getAll({ 
        page, 
        limit,
        search: searchTerm,
        filter: filterType 
      });
      
      const softwareData = response.data.data || [];
      setSoftware(softwareData);
      
      // Update pagination state from server response
      if (response.data.pagination) {
        setAssetPagination(prev => ({
          ...prev,
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
          itemsPerPage: response.data.pagination.itemsPerPage
        }));
        
        // Cache the result
        setAssetCache(prev => new Map(prev).set(cacheKey, {
          data: softwareData,
          pagination: response.data.pagination,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error("Error fetching software:", error);
      toast.error("Failed to load software data");
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  };

  // Memoized filtered results for better performance
  const filteredHardware = useMemo(() => {
    return hardware.filter((item) => {
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
  }, [hardware, searchTerm, filterType]);

  const filteredSoftware = useMemo(() => {
    return software.filter((item) => {
      const matchesSearch =
        item.system?.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.system?.mac_address
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [software, searchTerm, filterType]);

  const getSystemStats = () => {
    if (activeTab === "hardware") {
      // Calculate device type counts from current hardware data
      const desktop = hardware.filter(
        (item) =>
          item.system?.platform?.toLowerCase().includes("windows") &&
          !item.power_thermal?.battery
      ).length;

      const laptop = hardware.filter(
        (item) => item.power_thermal?.battery
      ).length;

      const server = hardware.filter((item) =>
        item.system?.platform?.toLowerCase().includes("linux")
      ).length;

      const stats = {
        total: hardware.length,
        assigned: dashboardStats?.assignedAssets || 0,
        active: dashboardStats?.activeAssets || 0,
        expiring: dashboardStats?.expiringWarranties || 0,
        desktop: desktop,
        laptop: laptop,
        server: server,
      };
      return stats;
    } else if (activeTab === "tickets") {
      return ticketStats;
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
                      <p className="text-xs text-blue-600">
                        All registered devices
                      </p>
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
                      <p className="text-xs text-green-600">
                        Windows workstations
                      </p>
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
                      <p className="text-xs text-purple-600">
                        Portable devices
                      </p>
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

                  {/* Asset Assignment Statistics */}
                  {assignmentStats && (
                    <>
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-md shadow-sm border border-indigo-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-indigo-700 mb-1">
                              Total Assets
                            </p>
                            <p className="text-xl font-bold text-indigo-900">
                              {dashboardStats?.total || 0}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                            <Package className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-indigo-200">
                          <p className="text-xs text-indigo-600">All registered devices</p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-md shadow-sm border border-emerald-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-emerald-700 mb-1">
                              Assigned Assets
                            </p>
                            <p className="text-xl font-bold text-emerald-900">
                              {assignmentStats.totalAssignedAssets || 0}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md flex items-center justify-center shadow-sm">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-emerald-200">
                          <p className="text-xs text-emerald-600">Currently assigned to users</p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-md shadow-sm border border-amber-200 p-3 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-amber-700 mb-1">
                              Unassigned Assets
                            </p>
                            <p className="text-xl font-bold text-amber-900">
                              {(dashboardStats?.total || 0) - (assignmentStats.totalAssignedAssets || 0)}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-md flex items-center justify-center shadow-sm">
                            <AlertCircle className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-amber-200">
                          <p className="text-xs text-amber-600">Available for assignment</p>
                    </div>
                  </div>
                    </>
                  )}
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
                      <p className="text-xs text-red-600">
                        Auto-start programs
                      </p>
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

            {/* Content Grid */}
            <div data-assets-section>
              {activeTab === "alerts" ? (
                <AlertsPanel />
              ) : activeTab === "tickets" ? (
                <div>
                  {/* Create Ticket Button */}
                  <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Your Support Tickets
                    </h2>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => fetchTickets(true)}
                          disabled={ticketLoading}
                          className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          {ticketLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                              <span>Loading...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Refresh</span>
                            </div>
                          )}
                        </button>
                        
                        {/* Last Updated Indicator */}
                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Last updated: {lastTicketFetch ? new Date(lastTicketFetch).toLocaleTimeString() : 'Never'}
                          </span>
                          {activeTab === "tickets" && (
                            <div className="flex items-center space-x-1">
                              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-600">Auto-refresh active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    
                      {/* Export Buttons */}
                      {tickets.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={async () => {
                              // Always fetch fresh data before export
                              try {
                                const response = await ticketsAPI.getAll();
                                const freshTickets = response.data.data || [];
                                const sortedTickets = freshTickets.sort((a, b) => {
                                  const aIsClosed = a.status === "Closed" || a.status === "Rejected";
                                  const bIsClosed = b.status === "Closed" || b.status === "Rejected";
                                  if (aIsClosed && !bIsClosed) return 1;
                                  if (!aIsClosed && bIsClosed) return -1;
                                  return 0;
                                });
                                
                                // Update local state with fresh data
                                setTickets(sortedTickets);
                                setCachedTickets(sortedTickets);
                                
                                // Export fresh data
                                exportTicketsToCSV(sortedTickets, 'all_tickets');
                                toast.success(`Exported ${sortedTickets.length} tickets to CSV (fresh data)`);
                              } catch (error) {
                                console.error('Error fetching fresh tickets for export:', error);
                                // Fallback to cached data
                                exportTicketsToCSV(tickets, 'all_tickets');
                                toast.success(`Exported ${tickets.length} tickets to CSV (cached data)`);
                              }
                            }}
                            disabled={ticketLoading}
                            className="text-xs border border-green-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                            title="Export all tickets to CSV (with fresh data)"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export All
                          </button>
                          <button
                            onClick={async () => {
                              // Always fetch fresh data before export
                              try {
                                const response = await ticketsAPI.getAll();
                                const freshTickets = response.data.data || [];
                                const sortedTickets = freshTickets.sort((a, b) => {
                                  const aIsClosed = a.status === "Closed" || a.status === "Rejected";
                                  const bIsClosed = b.status === "Closed" || b.status === "Rejected";
                                  if (aIsClosed && !bIsClosed) return 1;
                                  if (!aIsClosed && bIsClosed) return -1;
                                  return 0;
                                });
                                
                                // Update local state with fresh data
                                setTickets(sortedTickets);
                                setCachedTickets(sortedTickets);
                                
                                // Export fresh data
                                exportTicketsResolvedToday(sortedTickets);
                                toast.success(`Exported ${sortedTickets.filter(t => t.status === "Resolved").length} resolved tickets from today`);
                              } catch (error) {
                                console.error('Error fetching fresh tickets for export:', error);
                                // Fallback to cached data
                                exportTicketsResolvedToday(tickets);
                                toast.success(`Exported ${tickets.filter(t => t.status === "Resolved").length} resolved tickets from today (cached data)`);
                              }
                            }}
                            disabled={ticketLoading}
                            className="text-xs border border-blue-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                            title="Export resolved tickets from today (with fresh data)"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Today's Resolved
                          </button>
                          <button
                            onClick={async () => {
                              // Always fetch fresh data before export
                              try {
                                const response = await ticketsAPI.getAll();
                                const freshTickets = response.data.data || [];
                                const sortedTickets = freshTickets.sort((a, b) => {
                                  const aIsClosed = a.status === "Closed" || a.status === "Rejected";
                                  const bIsClosed = b.status === "Closed" || b.status === "Rejected";
                                  if (aIsClosed && !bIsClosed) return 1;
                                  if (!aIsClosed && bIsClosed) return -1;
                                  return 0;
                                });
                                
                                // Update local state with fresh data
                                setTickets(sortedTickets);
                                setCachedTickets(sortedTickets);
                                
                                // Export fresh data
                                exportTicketStatsToCSV(sortedTickets);
                                toast.success(`Exported ticket statistics to CSV (fresh data)`);
                              } catch (error) {
                                console.error('Error fetching fresh tickets for export:', error);
                                // Fallback to cached data
                                exportTicketStatsToCSV(tickets);
                                toast.success(`Exported ticket statistics to CSV (cached data)`);
                              }
                            }}
                            disabled={ticketLoading}
                            className="text-xs border border-purple-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                            title="Export ticket statistics to CSV (with fresh data)"
                          >
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Statistics
                          </button>
                          <button
                            onClick={async () => {
                              // Always fetch fresh data before export
                              try {
                                const response = await ticketsAPI.getAll();
                                const freshTickets = response.data.data || [];
                                const sortedTickets = freshTickets.sort((a, b) => {
                                  const aIsClosed = a.status === "Closed" || a.status === "Rejected";
                                  const bIsClosed = b.status === "Closed" || b.status === "Rejected";
                                  if (aIsClosed && !bIsClosed) return 1;
                                  if (!aIsClosed && bIsClosed) return -1;
                                  return 0;
                                });
                                
                                // Update local state with fresh data
                                setTickets(sortedTickets);
                                setCachedTickets(sortedTickets);
                                
                                // Export fresh data
                                exportTicketsByTimePeriod(sortedTickets);
                                toast.success(`Exported tickets by time period to CSV (fresh data)`);
                              } catch (error) {
                                console.error('Error fetching fresh tickets for export:', error);
                                // Fallback to cached data
                                exportTicketsByTimePeriod(tickets);
                                toast.success(`Exported tickets by time period to CSV (cached data)`);
                              }
                            }}
                            disabled={ticketLoading}
                            className="text-xs border border-orange-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                            title="Export tickets by time period to CSV (with fresh data)"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            By Period
                          </button>
                          <button
                            onClick={async () => {
                              // Always fetch fresh data before export
                              try {
                                const response = await ticketsAPI.getAll();
                                const freshTickets = response.data.data || [];
                                const sortedTickets = freshTickets.sort((a, b) => {
                                  const aIsClosed = a.status === "Closed" || a.status === "Rejected";
                                  const bIsClosed = b.status === "Closed" || b.status === "Rejected";
                                  if (aIsClosed && !bIsClosed) return 1;
                                  if (!aIsClosed && bIsClosed) return -1;
                                  return 0;
                                });
                                
                                // Update local state with fresh data
                                setTickets(sortedTickets);
                                setCachedTickets(sortedTickets);
                                
                                // Export fresh data
                                exportTicketsBySLACompliance(sortedTickets);
                                toast.success(`Exported tickets by SLA compliance to CSV (fresh data)`);
                              } catch (error) {
                                console.error('Error fetching fresh tickets for export:', error);
                                // Fallback to cached data
                                exportTicketsBySLACompliance(tickets);
                                toast.success(`Exported tickets by SLA compliance to CSV (cached data)`);
                              }
                            }}
                            disabled={ticketLoading}
                            className="text-xs border border-red-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                            title="Export tickets by SLA compliance to CSV (with fresh data)"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            SLA Compliance
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ticket Filters */}
                  <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={ticketFilters.status}
                          onChange={(e) => setTicketFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Statuses</option>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <select
                          value={ticketFilters.priority}
                          onChange={(e) => setTicketFilters(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Priorities</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>

                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={ticketFilters.category}
                          onChange={(e) => setTicketFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Categories</option>
                          <option value="Hardware">Hardware</option>
                          <option value="Software">Software</option>
                          <option value="Network">Network</option>
                          <option value="Account">Account</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Date Range Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Range
                        </label>
                        <select
                          value={ticketFilters.dateRange}
                          onChange={(e) => setTicketFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="quarter">This Quarter</option>
                          <option value="year">This Year</option>
                        </select>
                      </div>

                      {/* Assigned To Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned To
                        </label>
                        <select
                          value={ticketFilters.assignedTo}
                          onChange={(e) => setTicketFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Users</option>
                          {users.map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Search Input */}
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Tickets
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by title, description, ID..."
                            value={ticketFilters.searchTerm}
                            onChange={(e) => setTicketFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            setTicketFilters({
                              status: 'all',
                              priority: 'all',
                              category: 'all',
                              searchTerm: '',
                              dateRange: 'all',
                              assignedTo: 'all'
                            });
                          }}
                          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tickets List */}
                  {ticketLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tickets...</p>
                      </div>
                    </div>
                  ) : ticketError ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tickets</h3>
                      <p className="text-gray-500 mb-4">{ticketError}</p>
                      <button
                        onClick={() => fetchTickets(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {hasActiveFilters
                          ? `No tickets found${ticketFilters.searchTerm && ` matching "${ticketFilters.searchTerm}"`}`
                          : "No tickets found"}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {hasActiveFilters
                          ? "Try adjusting your search criteria or clearing some filters."
                          : "No support tickets have been created yet."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={() => {
                            setTicketFilters({
                              status: 'all',
                              priority: 'all',
                              category: 'all',
                              searchTerm: '',
                              dateRange: 'all',
                              assignedTo: 'all'
                            });
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Results Info */}
                      <div className="mb-4 text-sm text-gray-600">
                        Showing {filteredTickets.length} of {tickets.length} tickets
                        {ticketFilters.searchTerm && ` matching "${ticketFilters.searchTerm}"`}
                      </div>

                      {/* Tickets Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTickets.map((ticket) => (
                          <TicketCard
                            key={ticket._id}
                            ticket={ticket}
                            onClick={setSelectedTicket}
                            onStatusChange={handleTicketStatusChange}
                            onPriorityChange={handleTicketPriorityChange}
                            onCategoryChange={handleTicketCategoryChange}
                            onAssignedToChange={handleTicketAssignedToChange}
                            onDelete={handleTicketDelete}
                            users={users}
                            user={user}
                          />
                        ))}
                      </div>

                      {/* Ticket Pagination */}
                      {ticketPagination.totalPages > 1 && (
                        <div className="mt-8">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                              Page {ticketPagination.currentPage} of {ticketPagination.totalPages}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setTicketPagination(prev => ({
                                  ...prev,
                                  currentPage: Math.max(1, prev.currentPage - 1)
                                }))}
                                disabled={ticketPagination.currentPage === 1}
                                className="px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
                              >
                                Previous
                              </button>
                              
                              <button
                                onClick={() => setTicketPagination(prev => ({
                                  ...prev,
                                  currentPage: Math.min(prev.totalPages, prev.currentPage + 1)
                                }))}
                                disabled={ticketPagination.currentPage === ticketPagination.totalPages}
                                className="px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : activeTab === "hardware" ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Hardware Assets
                  </h3>
                  <p className="text-gray-500">
                    Hardware asset display has been removed from the dashboard.
                  </p>
                </div>
              ) : filteredSoftware.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || filterType !== "all"
                      ? "No software data matches your criteria"
                      : "No software data found"}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || filterType !== "all"
                      ? "Try adjusting your search criteria."
                      : "No software inventory data available yet."}
                  </p>
                  {(searchTerm || filterType !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterType("all");
                        fetchSoftware(1, assetPagination.itemsPerPage);
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Software Assets
                  </h3>
                  <p className="text-gray-500">
                    Software asset display has been removed from the dashboard.
                  </p>
                </div>
              )}
            </div>

            {/* Results Info */}
            {!loading && activeTab !== "alerts" && activeTab !== "tickets" && (
              <div className="mt-8 text-center text-sm text-gray-500">
                {activeTab === "hardware"
                  ? `Showing ${hardware.length} of ${assetPagination.totalItems} hardware assets (Page ${assetPagination.currentPage} of ${assetPagination.totalPages})`
                  : `Showing ${software.length} of ${assetPagination.totalItems} software inventories (Page ${assetPagination.currentPage} of ${assetPagination.totalPages})`}
                
                {assetPagination.totalItems > 1000 && (
                  <div className="mt-2 text-xs text-blue-600">
                    💡 Tip: Use search and filters to quickly find specific assets
                  </div>
                )}
                
                {/* Cache indicator */}
                {assetCache.size > 0 && (
                  <div className="mt-2 text-xs text-green-600">
                    🚀 {assetCache.size} pages cached for faster loading
                  </div>
                )}
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
              const aIsClosed =
                a.status === "Closed" || a.status === "Rejected";
              const bIsClosed =
                b.status === "Closed" || b.status === "Rejected";

              if (aIsClosed && !bIsClosed) return 1; // a goes after b
              if (!aIsClosed && bIsClosed) return -1; // a goes before b
              return 0; // keep original order for same status type
            });

            setTickets(sortedTickets);
             setCachedTickets(sortedTickets);
             setLastTicketFetch(Date.now());
            setShowCreateTicketModal(false);
            toast.success("Ticket created successfully!");
          }}
        />

         {/* Ticket Details Modal - for viewing/updating tickets */}
         {selectedTicket && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold">Ticket Details</h2>
                 <button
                   onClick={() => setSelectedTicket(null)}
                   className="text-gray-500 hover:text-gray-700"
                 >
                   <X className="h-6 w-6" />
                 </button>
               </div>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Status
                   </label>
                   <select
                     value={selectedTicket.status || 'Open'}
                     onChange={async (e) => {
                       try {
                         const newStatus = e.target.value;
                         // Update ticket status via API
                         const response = await ticketsAPI.update(selectedTicket._id, {
                           status: newStatus,
                           ...(newStatus === 'Resolved' && { resolved_at: new Date().toISOString() }),
                           ...(newStatus === 'Closed' && { closed_at: new Date().toISOString() })
                         });
                         
                         if (response.data.success) {
                           // Update local state
                           const updatedTicket = { ...selectedTicket, status: newStatus };
                           if (newStatus === 'Resolved') {
                             updatedTicket.resolved_at = new Date().toISOString();
                           } else if (newStatus === 'Closed') {
                             updatedTicket.closed_at = new Date().toISOString();
                           }
                           
                           const updatedTickets = tickets.map(t => 
                             t._id === selectedTicket._id ? updatedTicket : t
                           );
                           
                           // Re-sort tickets
                           const sortedTickets = updatedTickets.sort((a, b) => {
                             const aIsClosed = a.status === "Closed" || a.status === "Rejected";
                             const bIsClosed = b.status === "Closed" || b.status === "Rejected";
                             if (aIsClosed && !bIsClosed) return 1;
                             if (!aIsClosed && bIsClosed) return -1;
                             return 0;
                           });
                           
                           setTickets(sortedTickets);
                           setCachedTickets(sortedTickets);
                           setSelectedTicket(updatedTicket);
                           toast.success(`Ticket status updated to ${newStatus}`);
                         }
                       } catch (error) {
                         console.error('Error updating ticket status:', error);
                         toast.error('Failed to update ticket status');
                       }
                     }}
                     className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="Open">Open</option>
                     <option value="In Progress">In Progress</option>
                     <option value="Resolved">Resolved</option>
                     <option value="Closed">Closed</option>
                     <option value="Rejected">Rejected</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Priority
                   </label>
                   <select
                     value={selectedTicket.priority || 'Medium'}
                     onChange={async (e) => {
                       try {
                         const newPriority = e.target.value;
                         const response = await ticketsAPI.update(selectedTicket._id, {
                           priority: newPriority
                         });
                         
                         if (response.data.success) {
                           const updatedTicket = { ...selectedTicket, priority: newPriority };
                           const updatedTickets = tickets.map(t => 
                             t._id === selectedTicket._id ? updatedTicket : t
                           );
                           
                           setTickets(updatedTickets);
                           setCachedTickets(updatedTickets);
                           setSelectedTicket(updatedTicket);
                           toast.success(`Ticket priority updated to ${newPriority}`);
                         }
                       } catch (error) {
                         console.error('Error updating ticket priority:', error);
                         toast.error('Failed to update ticket priority');
                       }
                     }}
                     className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="Low">Low</option>
                     <option value="Medium">Medium</option>
                     <option value="High">High</option>
                     <option value="Critical">Critical</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Resolution Notes
                   </label>
                   <textarea
                     value={selectedTicket.resolution_notes || ''}
                     onChange={async (e) => {
                       try {
                         const resolutionNotes = e.target.value;
                         const response = await ticketsAPI.update(selectedTicket._id, {
                           resolution_notes: resolutionNotes
                         });
                         
                         if (response.data.success) {
                           const updatedTicket = { ...selectedTicket, resolution_notes };
                           const updatedTickets = tickets.map(t => 
                             t._id === selectedTicket._id ? updatedTicket : t
                           );
                           
                           setTickets(updatedTickets);
                           setCachedTickets(updatedTickets);
                           setSelectedTicket(updatedTicket);
                         }
                       } catch (error) {
                         console.error('Error updating resolution notes:', error);
                         toast.error('Failed to update resolution notes');
                       }
                     }}
                     rows={3}
                     className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                     placeholder="Add resolution notes..."
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Created
                     </label>
                     <p className="text-sm text-gray-900">
                       {new Date(selectedTicket.created_at).toLocaleString()}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Last Updated
                     </label>
                     <p className="text-sm text-gray-900">
                       {new Date(selectedTicket.updated_at).toLocaleString()}
                     </p>
                   </div>
                 </div>
                 
                 {selectedTicket.resolved_at && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Resolved At
                     </label>
                     <p className="text-sm text-gray-900">
                       {new Date(selectedTicket.resolved_at).toLocaleString()}
                     </p>
                   </div>
                 )}
               </div>
               
               <div className="mt-6 flex justify-end space-x-3">
                 <button
                   onClick={() => setSelectedTicket(null)}
                   className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                 >
                   Close
                 </button>
                 <button
                   onClick={() => {
                     fetchTickets(true); // Force refresh
                     setSelectedTicket(null);
                   }}
                   className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                 >
                   Refresh Data
                 </button>
               </div>
             </div>
           </div>
         )}

        {/* ML Service Control Panel */}
        <MLServiceControlPanel
          isOpen={showMLControlPanel}
          onClose={() => setShowMLControlPanel(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
