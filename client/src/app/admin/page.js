"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

import LazyLoader from "../../components/LazyLoader";
import {
  hardwareAPI,
  authAPI,
  ticketsAPI,
  softwareAPI,
  alertsAPI,
} from "../../lib/api";
import toast from "react-hot-toast";

import {
  exportTicketsToCSV,
  exportTicketStatsToCSV,
  exportTicketsResolvedToday,
  exportTicketsByTimePeriod,
  exportTicketsBySLACompliance,
} from "../../utils/exportUtils";
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
  AlertTriangle,
  Clock,
  Download,
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
  const [paginationLoading, setPaginationLoading] = useState(false);
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
  const [alerts, setAlerts] = useState([]);
  const [alertsSummary, setAlertsSummary] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  // Cache for asset data to prevent unnecessary API calls
  const [assetCache, setAssetCache] = useState({});
  const [lastFetchTime, setLastFetchTime] = useState({});

  // Enhanced ticket filtering and pagination state
  const [ticketFilters, setTicketFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    searchTerm: "",
    dateRange: "all",
    assignedTo: "all",
  });

  const [ticketPagination, setTicketPagination] = useState({
    currentPage: 1,
    itemsPerPage: 12,
    totalPages: 1,
    totalItems: 0,
  });

  // Ref for the assets section to scroll to
  const assetsSectionRef = useRef(null);

  // Asset pagination state
  const [assetPagination, setAssetPagination] = useState({
    currentPage: 1,
    itemsPerPage: 12,
    totalPages: 1,
    totalItems: 0
  });

  // Asset cache for better performance
  const [assetCache, setAssetCache] = useState(new Map());

  // Ticket optimization state
  const [ticketCache, setTicketCache] = useState(new Map());
  const [lastTicketFetch, setLastTicketFetch] = useState(0);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState(null);
  const TICKET_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Check if ticket cache is valid
  const isTicketCacheValid = useCallback(() => {
    return Date.now() - lastTicketFetch < TICKET_CACHE_DURATION;
  }, [lastTicketFetch]);

  // Get cached tickets if available
  const getCachedTickets = useCallback(() => {
    const cacheKey = `admin-tickets`;
    const cached = ticketCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < TICKET_CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [ticketCache]);

  // Set cached tickets
  const setCachedTickets = useCallback((data) => {
    const cacheKey = `admin-tickets`;
    setTicketCache((prev) =>
      new Map(prev).set(cacheKey, {
        data,
        timestamp: Date.now(),
      })
    );
  }, []);

  // Optimized ticket fetching with caching
  const fetchTickets = useCallback(
    async (forceRefresh = false) => {
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
    },
    [getCachedTickets, setCachedTickets]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      ticketFilters.status !== "all" ||
      ticketFilters.priority !== "all" ||
      ticketFilters.dateRange !== "all" ||
      ticketFilters.searchTerm
    );
  }, [ticketFilters]);

  // Memoized filtered tickets with advanced filtering
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];

    // Status filter
    if (ticketFilters.status !== "all") {
      filtered = filtered.filter(
        (ticket) => ticket.status === ticketFilters.status
      );
    }

    // Only hide closed tickets if other filters are applied (not by default)
    if (hasActiveFilters && ticketFilters.status === "all") {
      // When filters are applied but status is 'all', exclude closed and rejected tickets
      filtered = filtered.filter(
        (ticket) => ticket.status !== "Closed" && ticket.status !== "Rejected"
      );
    }

    // Priority filter
    if (ticketFilters.priority !== "all") {
      filtered = filtered.filter(
        (ticket) => ticket.priority === ticketFilters.priority
      );
    }

    // Category filter
    if (ticketFilters.category !== "all") {
      filtered = filtered.filter(
        (ticket) => ticket.category === ticketFilters.category
      );
    }

    // Search term filter
    if (ticketFilters.searchTerm) {
      const searchLower = ticketFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.title?.toLowerCase().includes(searchLower) ||
          ticket.description?.toLowerCase().includes(searchLower) ||
          ticket.ticket_id?.toLowerCase().includes(searchLower) ||
          ticket.created_by_name?.toLowerCase().includes(searchLower) ||
          ticket.asset_hostname?.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
    if (ticketFilters.dateRange !== "all") {
      const now = new Date();
      let startDate;

      switch (ticketFilters.dateRange) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "quarter":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          break;
      }

      if (startDate) {
        filtered = filtered.filter(
          (ticket) => new Date(ticket.created_at) >= startDate
        );
      }
    }

    // Assigned to filter
    if (ticketFilters.assignedTo !== "all") {
      if (ticketFilters.assignedTo === "unassigned") {
        filtered = filtered.filter((ticket) => !ticket.assigned_to?.username);
      } else {
        filtered = filtered.filter(
          (ticket) => ticket.assigned_to?.username === ticketFilters.assignedTo
        );
      }
    }

    return filtered;
  }, [tickets, ticketFilters, hasActiveFilters]);

  // Memoized paginated tickets
  const paginatedTickets = useMemo(() => {
    const startIndex =
      (ticketPagination.currentPage - 1) * ticketPagination.itemsPerPage;
    const endIndex = startIndex + ticketPagination.itemsPerPage;
    return filteredTickets.slice(startIndex, endIndex);
  }, [
    filteredTickets,
    ticketPagination.currentPage,
    ticketPagination.itemsPerPage,
  ]);

  // Update pagination when filters change
  useEffect(() => {
    const totalPages = Math.ceil(
      filteredTickets.length / ticketPagination.itemsPerPage
    );
    setTicketPagination((prev) => ({
      ...prev,
      currentPage: 1, // Reset to first page when filters change
      totalPages: Math.max(1, totalPages),
      totalItems: filteredTickets.length,
    }));
  }, [filteredTickets, ticketPagination.itemsPerPage]);

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab === "tickets") {
        switch (e.key) {
          case "ArrowLeft":
            if (e.ctrlKey) {
              e.preventDefault();
              setTicketPagination((prev) => ({
                ...prev,
                currentPage: Math.max(1, prev.currentPage - 1),
              }));
            }
            break;
          case "ArrowRight":
            if (e.ctrlKey) {
              e.preventDefault();
              setTicketPagination((prev) => ({
                ...prev,
                currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
              }));
            }
            break;
          case "Home":
            if (e.ctrlKey) {
              e.preventDefault();
              setTicketPagination((prev) => ({ ...prev, currentPage: 1 }));
            }
            break;
          case "End":
            if (e.ctrlKey) {
              e.preventDefault();
              setTicketPagination((prev) => ({
                ...prev,
                currentPage: prev.totalPages,
              }));
            }
            break;
          case "Escape":
            setTicketFilters({
              status: "all",
              priority: "all",
              category: "all",
              searchTerm: "",
              dateRange: "all",
              assignedTo: "all",
            });
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, ticketPagination.totalPages]);

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

  // Memoized filtered tickets (only active tickets for display)
  const activeTickets = useMemo(() => {
    return tickets.filter(
      (ticket) => ticket.status !== "Closed" && ticket.status !== "Rejected"
    );
  }, [tickets]);

  useEffect(() => {
    if (activeTab === "assets") {
      if (assetType === "hardware") {
        fetchHardware(1, assetPagination.itemsPerPage);
      } else {
        fetchSoftware(1, assetPagination.itemsPerPage);
      }
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "tickets") {
      fetchTickets();
    } else if (activeTab === "alerts") {
      fetchAlerts();
    }
  }, [activeTab, assetType]);

  // Auto-refresh tickets every 30 seconds when on tickets tab
  useEffect(() => {
    if (activeTab === "tickets") {
      const interval = setInterval(() => {
        fetchTickets(true); // Force refresh every 30 seconds
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, fetchTickets]);

  // Refetch data when search or filter changes
  useEffect(() => {
    if (activeTab === "assets") {
      // Add debounce for search to reduce API calls
      const timeoutId = setTimeout(() => {
        if (assetType === "hardware") {
          fetchHardware(1, assetPagination.itemsPerPage);
        } else {
          fetchSoftware(1, assetPagination.itemsPerPage);
        }
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, filterType]);

  // Fetch assets when pagination changes
  useEffect(() => {
    if (activeTab === "assets") {
      if (assetType === "hardware") {
        fetchHardware(assetPagination.currentPage, assetPagination.itemsPerPage);
      } else {
        fetchSoftware(assetPagination.currentPage, assetPagination.itemsPerPage);
      }
    }
  }, [assetPagination.currentPage, assetPagination.itemsPerPage, activeTab, assetType]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setAssetPagination(prev => ({ ...prev, currentPage: 1 }));
    
    // Clear cache when filters change for fresh results
    setAssetCache(new Map());
  }, [searchTerm, filterType]);

  const handleAssetTypeChange = (type) => {
    setAssetType(type);

    // Scroll to the top of the assets section when switching asset types
    if (assetsSectionRef.current) {
      assetsSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    if (type === "hardware") {
      fetchHardware(1, assetPagination.itemsPerPage);
    } else {
      fetchSoftware(1, assetPagination.itemsPerPage);
    }
  };

  const fetchHardware = async (page = 1, limit = assetPagination.itemsPerPage) => {
    try {
      // Check cache first
      const cacheKey = `hardware_${page}_${limit}_${searchTerm}_${filterType}`;
      const cached = assetCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes TTL
        setHardware(cached.data);
        if (cached.pagination) {
          setAssetPagination(prev => ({
            ...prev,
            currentPage: cached.pagination.currentPage,
            totalPages: cached.pagination.totalPages,
            totalItems: cached.pagination.totalItems,
            itemsPerPage: cached.pagination.itemsPerPage
          }));
        }
        return;
      }

      // Use searchLoading for search operations, main loading for initial fetch
      if (!searchTerm && filterType === "all") {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }

      // Build query parameters
      const params = {
        page,
        limit
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

      // Cache the response
      setAssetCache((prev) => ({
        ...prev,
        [cacheKey]: {
          data: hardwareData,
        },
      }));
      setLastFetchTime((prev) => ({
        ...prev,
        [cacheKey]: now,
      }));
    } catch (error) {
      console.error("Error fetching hardware:", error);
      toast.error("Failed to load hardware data");
    } finally {
      setLoading(false);
      setSearchLoading(false);
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

  const fetchSoftware = async () => {
    try {
      // Check cache first
      const cacheKey = `software_${page}_${limit}_${searchTerm}_${filterType}`;
      const cached = assetCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes TTL
        setSoftware(cached.data);
        if (cached.pagination) {
          setAssetPagination(prev => ({
            ...prev,
            currentPage: cached.pagination.currentPage,
            totalPages: cached.pagination.totalPages,
            totalItems: cached.pagination.totalItems,
            itemsPerPage: cached.pagination.itemsPerPage
          }));
        }
        return;
      }

      // Use searchLoading for search operations, main loading for initial fetch
      if (!searchTerm && filterType === "all") {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }

      // Build query parameters
      const params = {
        page,
        limit
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

      // Cache the response
      setAssetCache((prev) => ({
        ...prev,
        [cacheKey]: {
          data: softwareData,
        },
      }));
      setLastFetchTime((prev) => ({
        ...prev,
        [cacheKey]: now,
      }));
    } catch (error) {
      console.error("Error fetching software:", error);
      toast.error("Failed to load software data");
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setPaginationLoading(false);
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

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      console.log("Fetching alerts...");
      const response = await alertsAPI.getWarrantyAlerts(30, 1, 1000, "all"); // 30 days, first page, large limit, all severities
      console.log("Alerts response:", response);
      setAlerts(response.data.alerts || []);
      setAlertsSummary(response.data.summary || {});
      console.log("Alerts summary set:", response.data.summary || {});
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
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
      fetchHardware(assetPagination.currentPage, assetPagination.itemsPerPage);
    } else {
      fetchSoftware(assetPagination.currentPage, assetPagination.itemsPerPage);
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

        return {
          totalAssets,
          assignedAssets,
          unassignedAssets: totalAssets - assignedAssets,
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
    } else if (activeTab === "users") {
      // User statistics
      const totalUsers = users.length;
      const activeUsers = users.filter((u) => u.isActive).length;
      const inactiveUsers = totalUsers - activeUsers;
      const usersWithAssets = users.filter(
        (u) => u.assignedAssets?.length > 0
      ).length;
      const usersWithoutAssets = totalUsers - usersWithAssets;
      const totalAssignedAssets = users.reduce(
        (sum, u) => sum + (u.assignedAssets?.length || 0),
        0
      );
      const averageAssetsPerUser =
        totalUsers > 0 ? (totalAssignedAssets / totalUsers).toFixed(1) : 0;
      const maxAssetsPerUser = Math.max(
        ...users.map((u) => u.assignedAssets?.length || 0),
        0
      );

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersWithAssets,
        usersWithoutAssets,
        totalAssignedAssets,
        averageAssetsPerUser,
        maxAssetsPerUser,
      };
    } else if (activeTab === "alerts") {
      // Alerts statistics
      console.log("Getting alerts stats, alertsSummary:", alertsSummary);
      const stats = {
        totalAlerts: alertsSummary.total || 0,
        criticalAlerts: alertsSummary.critical || 0,
        highAlerts: alertsSummary.high || 0,
        mediumAlerts: alertsSummary.medium || 0,
        lowAlerts: alertsSummary.low || 0,
      };
      console.log("Alerts stats calculated:", stats);
      return stats;
    } else {
      // Default statistics (when no specific tab is selected)
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
  const handleSearch = useCallback(
    (term) => {
      setSearchTerm(term);
      if (activeTab === "assets") {
        if (assetType === "hardware") {
          fetchHardware();
        } else {
          fetchSoftware();
        }
      } else if (activeTab === "users") {
        fetchUsers();
      }
    },
    [activeTab, assetType, fetchHardware, fetchSoftware, fetchUsers]
  );

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
    if (activeTab === "assets") {
      if (assetType === "hardware") {
        fetchHardware();
      } else {
        fetchSoftware();
      }
    } else if (activeTab === "users") {
      fetchUsers();
    }
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  // Pagination handlers for assets
  const handleAssetPageChange = (newPage) => {
    setPaginationLoading(true);
    setAssetPagination(prev => ({ ...prev, currentPage: newPage }));
    
    // Scroll to top of assets section when page changes
    setTimeout(() => {
      if (assetsSectionRef.current) {
        assetsSectionRef.current.scrollIntoView({ 
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
      if (assetsSectionRef.current) {
        assetsSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100); // Small delay to ensure state update completes
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
                  console.log(
                    "Admin page received onHardwareUpdate:",
                    updatedHardware
                  );
                  setSelectedHardware(updatedHardware);
                  // Also update the hardware in the main list
                  setHardware((prevHardware) =>
                    prevHardware.map((h) =>
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
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage users, assets, and system configuration
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            {/* Stats Cards - Hidden for alerts tab */}
            {activeTab !== "alerts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {activeTab === "tickets" ? (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            Total Tickets
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.totalTickets}
                          </p>
                        </div>
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                          <Ticket className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          All support requests
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            Open
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.openTickets}
                          </p>
                        </div>
                        <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Awaiting response
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            In Progress
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.inProgressTickets}
                          </p>
                        </div>
                        <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                          <Settings className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Being worked on</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            Resolved
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.resolvedTickets}
                          </p>
                        </div>
                        <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Successfully completed
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            Closed
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.closedTickets}
                          </p>
                        </div>
                        <div className="h-10 w-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center shadow-sm">
                          <X className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Archived tickets
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            {assetType === "hardware"
                              ? "Total Assets"
                              : "Total Systems"}
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {assetType === "hardware"
                              ? stats.totalAssets
                              : stats.totalSystems}
                          </p>
                        </div>
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {assetType === "hardware"
                            ? "All registered devices"
                            : "All scanned systems"}
                        </p>
                      </div>
                    </div>

                    {assetType === "hardware" ? (
                      <>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                                Assigned
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                {stats.assignedAssets}
                              </p>
                            </div>
                            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                              <Check className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              User assigned
                            </p>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                                Unassigned
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                {stats.unassignedAssets}
                              </p>
                            </div>
                            <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                              <X className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              Available for assignment
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                                Software Packages
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                {stats.totalPackages}
                              </p>
                            </div>
                            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                              <Package className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              Installed software
                            </p>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                                Services
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                {stats.totalServices}
                              </p>
                            </div>
                            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                              <Settings className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              System services
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            {assetType === "hardware"
                              ? "Total Users"
                              : "Startup Programs"}
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {assetType === "hardware"
                              ? stats.totalUsers
                              : stats.totalStartupPrograms}
                          </p>
                        </div>
                        <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                          {assetType === "hardware" ? (
                            <Users className="h-5 w-5 text-white" />
                          ) : (
                            <Play className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {assetType === "hardware"
                            ? "Registered accounts"
                            : "Auto-start programs"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            {assetType === "hardware"
                              ? "Active Users"
                              : "Active Services"}
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {assetType === "hardware"
                              ? stats.activeUsers
                              : stats.totalServices}
                          </p>
                        </div>
                        <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                          {assetType === "hardware" ? (
                            <UserPlus className="h-5 w-5 text-white" />
                          ) : (
                            <Settings className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {assetType === "hardware"
                            ? "Currently active"
                            : "Running services"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="border-b border-gray-100">
                <nav className="flex space-x-1 px-6 py-1" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("assets")}
                    className={`py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
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
                    className={`py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
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
                    className={`py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
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
                    className={`py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
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
                    className="py-3 px-4 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-t-lg"
                  >
                    <Activity className="h-4 w-4 inline mr-2" />
                    Health
                  </button>
                </nav>
              </div>

              {/* Search and Filter Bar */}
              {activeTab !== "alerts" && activeTab !== "tickets" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
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

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                        onChange={(e) =>
                          handleSearchInputChange(e.target.value)
                        }
                        onKeyPress={handleSearchKeyPress}
                        className={`w-full pl-10 pr-24 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 transition-all duration-200 ${
                          searchTerm ? "border-blue-300 bg-blue-50" : "bg-white"
                        }`}
                      />
                      <button
                        onClick={handleSearchSubmit}
                        disabled={searchLoading}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {searchLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          "Search"
                        )}
                      </button>
                      {searchTerm && (
                        <button
                          onClick={handleClearSearch}
                          className="absolute right-16 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                          title="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      {activeTab === "assets" && (
                        <>
                          <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                              value={filterType}
                              onChange={(e) => setFilterType(e.target.value)}
                              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200"
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
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200"
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
                                if (assetType === "hardware") {
                                  fetchHardware();
                                } else {
                                  fetchSoftware();
                                }
                              }
                            : fetchUsers
                        }
                        disabled={loading}
                        className="flex items-center px-3 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm transition-all duration-200"
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-1.5 ${
                            loading ? "animate-spin" : ""
                          }`}
                        />
                        Refresh
                      </button>

                      {activeTab === "assets" && (
                        <>
                          <button
                            onClick={() => setShowCsvImportModal(true)}
                            className="flex items-center px-3 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 text-sm transition-all duration-200"
                          >
                            <FileText className="h-4 w-4 mr-1.5" />
                            Import CSV
                          </button>
                          <button
                            onClick={() => setShowManualAssetModal(true)}
                            className="flex items-center px-3 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 text-sm transition-all duration-200"
                          >
                            <Package className="h-4 w-4 mr-1.5" />
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
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 mb-1 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Support Tickets Management
                      </h2>
                      <p className="text-sm text-slate-600">
                        View and manage all support tickets from users
                      </p>
                    </div>

                    {/* Export Buttons */}
                    {tickets.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            exportTicketsToCSV(tickets, "admin_all_tickets");
                            toast.success(
                              `Exported ${tickets.length} tickets to CSV`
                            );
                          }}
                          disabled={ticketLoading}
                          className="text-xs border border-green-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                          title="Export all tickets to CSV"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Export All
                        </button>
                        <button
                          onClick={() => {
                            exportTicketStatsToCSV(
                              tickets,
                              "admin_ticket_statistics"
                            );
                            toast.success("Exported ticket statistics to CSV");
                          }}
                          disabled={ticketLoading}
                          className="text-xs border border-purple-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                          title="Export ticket statistics to CSV"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Export Stats
                        </button>

                        {/* Export Filtered Tickets Button */}
                        <button
                          onClick={() => {
                            if (filteredTickets.length === 0) {
                              toast.error("No filtered tickets to export");
                              return;
                            }
                            exportTicketsToCSV(
                              filteredTickets,
                              "admin_filtered_tickets"
                            );
                            toast.success(
                              `Exported ${filteredTickets.length} filtered tickets to CSV`
                            );
                          }}
                          disabled={
                            ticketLoading || filteredTickets.length === 0
                          }
                          className="text-xs border border-indigo-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                          title="Export currently filtered tickets to CSV"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Export Filtered
                        </button>

                        {/* Time-based Export Buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={async () => {
                              // Always fetch fresh data before export
                              try {
                                const response = await ticketsAPI.getAll();
                                const freshTickets = response.data.data || [];
                                const sortedTickets = freshTickets.sort(
                                  (a, b) => {
                                    const aIsClosed =
                                      a.status === "Closed" ||
                                      a.status === "Rejected";
                                    const bIsClosed =
                                      b.status === "Closed" ||
                                      b.status === "Rejected";
                                    if (aIsClosed && !bIsClosed) return 1;
                                    if (!aIsClosed && bIsClosed) return -1;
                                    return 0;
                                  }
                                );

                                // Update local state with fresh data
                                setTickets(sortedTickets);
                                setCachedTickets(sortedTickets);

                                // Export fresh data
                                const count = exportTicketsResolvedToday(
                                  sortedTickets,
                                  "admin_tickets_resolved_today"
                                );
                                toast.success(
                                  `Exported ${count} tickets resolved today to CSV (fresh data)`
                                );
                              } catch (error) {
                                console.error(
                                  "Error fetching fresh tickets for export:",
                                  error
                                );
                                // Fallback to cached data
                                const count = exportTicketsResolvedToday(
                                  tickets,
                                  "admin_tickets_resolved_today"
                                );
                                toast.success(
                                  `Exported ${count} tickets resolved today to CSV (cached data)`
                                );
                              }
                            }}
                            disabled={ticketLoading}
                            className="text-xs border border-blue-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                            title="Export tickets resolved today (with fresh data)"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Today
                          </button>
                          <button
                            onClick={async () => {
                              // Always fetch fresh data before export
                              try {
                                const response = await ticketsAPI.getAll();
                                const freshTickets = response.data.data || [];
                                const sortedTickets = freshTickets.sort(
                                  (a, b) => {
                                    const aIsClosed =
                                      a.status === "Closed" ||
                                      a.status === "Rejected";
                                    const bIsClosed =
                                      b.status === "Closed" ||
                                      b.status === "Rejected";
                                    if (aIsClosed && !bIsClosed) return 1;
                                    if (!aIsClosed && bIsClosed) return -1;
                                    return 0;
                                  }
                                );

                                // Update local state with fresh data
                                setTickets(sortedTickets);
                                setCachedTickets(sortedTickets);

                                // Export fresh data
                                const count = exportTicketsByTimePeriod(
                                  sortedTickets,
                                  "7d",
                                  "admin_tickets_last_7_days"
                                );
                                toast.success(
                                  `Exported ${count} tickets from last 7 days to CSV (fresh data)`
                                );
                              } catch (error) {
                                console.error(
                                  "Error fetching fresh tickets for export:",
                                  error
                                );
                                // Fallback to cached data
                                const count = exportTicketsByTimePeriod(
                                  tickets,
                                  "7d",
                                  "admin_tickets_last_7_days"
                                );
                                toast.success(
                                  `Exported ${count} tickets from last 7 days to CSV (cached data)`
                                );
                              }
                            }}
                            disabled={ticketLoading}
                            className="text-xs border border-orange-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                            title="Export tickets from last 7 days (with fresh data)"
                          >
                            <Download className="h-3 w-3 mr-1" />7 Days
                          </button>
                          <button
                            onClick={async () => {
                              // Always fetch fresh data before export
                              try {
                                const response = await ticketsAPI.getAll();
                                const freshTickets = response.data.data || [];
                                const sortedTickets = freshTickets.sort(
                                  (a, b) => {
                                    const aIsClosed =
                                      a.status === "Closed" ||
                                      a.status === "Rejected";
                                    const bIsClosed =
                                      b.status === "Closed" ||
                                      b.status === "Rejected";
                                    if (aIsClosed && !bIsClosed) return 1;
                                    if (!aIsClosed && bIsClosed) return -1;
                                    return 0;
                                  }
                                );

                                // Update local state with fresh data
                                setTickets(sortedTickets);
                                setCachedTickets(sortedTickets);

                                // Export fresh data
                                const count = exportTicketsBySLACompliance(
                                  sortedTickets,
                                  "compliant",
                                  "admin_sla_compliant_tickets"
                                );
                                toast.success(
                                  `Exported ${count} SLA compliant tickets to CSV (fresh data)`
                                );
                              } catch (error) {
                                console.error(
                                  "Error fetching fresh tickets for export:",
                                  error
                                );
                                // Fallback to cached data
                                const count = exportTicketsBySLACompliance(
                                  tickets,
                                  "compliant",
                                  "admin_sla_compliant_tickets"
                                );
                                toast.success(
                                  `Exported ${count} SLA compliant tickets to CSV (cached data)`
                                );
                              }
                            }}
                            disabled={ticketLoading}
                            className="text-xs border border-emerald-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                            title="Export SLA compliant tickets (with fresh data)"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            SLA OK
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Advanced Filter Controls */}
                {tickets.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      {/* Search Input */}
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Search Tickets
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by title, description, ID..."
                            value={ticketFilters.searchTerm}
                            onChange={(e) =>
                              setTicketFilters((prev) => ({
                                ...prev,
                                searchTerm: e.target.value,
                              }))
                            }
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={ticketFilters.status}
                          onChange={(e) =>
                            setTicketFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Status</option>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select
                          value={ticketFilters.priority}
                          onChange={(e) =>
                            setTicketFilters((prev) => ({
                              ...prev,
                              priority: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Priority</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>

                      {/* Date Range Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Date Range
                        </label>
                        <select
                          value={ticketFilters.dateRange}
                          onChange={(e) =>
                            setTicketFilters((prev) => ({
                              ...prev,
                              dateRange: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">Last 7 Days</option>
                          <option value="month">Last 30 Days</option>
                          <option value="quarter">Last 90 Days</option>
                        </select>
                      </div>

                      {/* Clear Filters Button */}
                      <div className="flex items-end">
                        <button
                          onClick={() =>
                            setTicketFilters({
                              status: "all",
                              priority: "all",
                              category: "all",
                              searchTerm: "",
                              dateRange: "all",
                              assignedTo: "all",
                            })
                          }
                          className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>

                    {/* Filter Summary */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-800">
                      <span>
                        Showing {paginatedTickets.length} of{" "}
                        {filteredTickets.length} tickets
                        {ticketFilters.searchTerm &&
                          ` matching "${ticketFilters.searchTerm}"`}
                        {ticketFilters.status !== "all" &&
                          ` with status "${ticketFilters.status}"`}
                        {hasActiveFilters &&
                          ticketFilters.status === "all" &&
                          ` (excluding closed/rejected)`}
                        {ticketFilters.priority !== "all" &&
                          ` with priority "${ticketFilters.priority}"`}
                        {ticketFilters.dateRange !== "all" &&
                          ` from ${ticketFilters.dateRange}`}
                      </span>
                      <span className="text-green-700 font-medium">
                        {filteredTickets.length > 0 &&
                          `${(
                            (filteredTickets.length / tickets.length) *
                            100
                          ).toFixed(1)}% of total tickets`}
                      </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-2 flex items-center space-x-4 text-xs">
                      <span className="text-gray-800">Quick Actions:</span>
                      <button
                        onClick={() =>
                          setTicketFilters((prev) => ({
                            ...prev,
                            status: "Open",
                          }))
                        }
                        className="text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        Show Open Tickets
                      </button>
                      <button
                        onClick={() =>
                          setTicketFilters((prev) => ({
                            ...prev,
                            priority: "Critical",
                          }))
                        }
                        className="text-red-700 hover:text-red-900 hover:underline"
                      >
                        Show Critical Priority
                      </button>
                      <button
                        onClick={() =>
                          setTicketFilters((prev) => ({
                            ...prev,
                            dateRange: "today",
                          }))
                        }
                        className="text-green-700 hover:text-green-900 hover:underline"
                      >
                        Show Today's Tickets
                      </button>
                      <button
                        onClick={() =>
                          setTicketFilters((prev) => ({
                            ...prev,
                            status: "Closed",
                          }))
                        }
                        className="text-gray-700 hover:text-gray-900 hover:underline"
                      >
                        Show Closed Tickets
                      </button>
                    </div>

                    {/* Keyboard Shortcuts Help */}
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-700">
                      <span>Keyboard shortcuts:</span>
                      <span>Ctrl+←/→ Navigate pages</span>
                      <span>Ctrl+Home/End First/Last page</span>
                      <span>Escape Clear filters</span>
                    </div>
                  </div>
                )}

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
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-base font-medium text-slate-800 mb-1">
                      No tickets match your filters
                    </h3>
                    <p className="text-sm text-slate-500">
                      Try adjusting your search criteria or clearing some
                      filters.
                    </p>
                    <button
                      onClick={() =>
                        setTicketFilters({
                          status: "all",
                          priority: "all",
                          category: "all",
                          searchTerm: "",
                          dateRange: "all",
                          assignedTo: "all",
                        })
                      }
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedTickets.map((ticket) => (
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

                {/* Pagination Controls */}
                {filteredTickets.length > 0 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Items per page selector */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">Show:</label>
                        <select
                          value={ticketPagination.itemsPerPage}
                          onChange={(e) => {
                            const newItemsPerPage = parseInt(e.target.value);
                            setTicketPagination((prev) => ({
                              ...prev,
                              itemsPerPage: newItemsPerPage,
                              currentPage: 1, // Reset to first page
                              totalPages: Math.ceil(
                                filteredTickets.length / newItemsPerPage
                              ),
                            }));
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={4}>4</option>
                          <option value={8}>8</option>
                          <option value={12}>12</option>
                          <option value={16}>16</option>
                          <option value={20}>20</option>
                        </select>
                        <span className="text-sm text-gray-800">per page</span>
                      </div>

                      {/* Page info */}
                      <div className="text-sm text-gray-800">
                        Page {ticketPagination.currentPage} of{" "}
                        {ticketPagination.totalPages}(
                        {ticketPagination.totalItems} total tickets)
                      </div>
                    </div>

                    {/* Pagination buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setTicketPagination((prev) => ({
                            ...prev,
                            currentPage: Math.max(1, prev.currentPage - 1),
                          }))
                        }
                        disabled={ticketPagination.currentPage === 1}
                        className="px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
                      >
                        Previous
                      </button>

                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(5, ticketPagination.totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (ticketPagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (ticketPagination.currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (
                              ticketPagination.currentPage >=
                              ticketPagination.totalPages - 2
                            ) {
                              pageNum = ticketPagination.totalPages - 4 + i;
                            } else {
                              pageNum = ticketPagination.currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() =>
                                  setTicketPagination((prev) => ({
                                    ...prev,
                                    currentPage: pageNum,
                                  }))
                                }
                                className={`px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                                  pageNum === ticketPagination.currentPage
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setTicketPagination((prev) => ({
                            ...prev,
                            currentPage: Math.min(
                              prev.totalPages,
                              prev.currentPage + 1
                            ),
                          }))
                        }
                        disabled={
                          ticketPagination.currentPage ===
                          ticketPagination.totalPages
                        }
                        className="px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "assets" ? (
              // Assets Tab
              <div ref={assetsSectionRef}>
                {/* Assets Info */}
                {currentAssets.length > 0 && (
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Showing {currentAssets.length}{" "}
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

                    {/* Pagination Loading Indicator */}
                    {paginationLoading && (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600 text-sm">Loading page...</p>
                        </div>
                      </div>
                    )}

                    {/* Actual Assets Grid */}
                    {!loading && !paginationLoading && (
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
                              <div className="text-sm text-gray-600">
                                {selectedAssets.length} asset
                                {selectedAssets.length !== 1 ? "s" : ""} selected
                              </div>
                            )}
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
                                            {item.system?.hostname ||
                                              "Unknown System"}
                                          </h3>
                                          <p className="text-sm text-gray-500">
                                            {item.system?.platform} Software
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                          MAC Address
                                        </p>
                                        <p className="text-sm font-mono text-gray-700">
                                          {item.system?.mac_address ||
                                            "Unknown"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div className="flex items-center space-x-2">
                                        <Package className="h-4 w-4 text-gray-600" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs text-gray-500">
                                            Installed
                                          </p>
                                          <p className="text-sm font-medium text-gray-900">
                                            {item.installed_software?.length ||
                                              0}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            packages
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <Settings className="h-4 w-4 text-gray-600" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs text-gray-500">
                                            Services
                                          </p>
                                          <p className="text-sm font-medium text-gray-900">
                                            {item.services?.length || 0}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            running
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <Play className="h-4 w-4 text-gray-600" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs text-gray-500">
                                            Startup
                                          </p>
                                          <p className="text-sm font-medium text-gray-900">
                                            {item.startup_programs?.length || 0}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            programs
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <Monitor className="h-4 w-4 text-gray-600" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs text-gray-500">
                                            Total
                                          </p>
                                          <p className="text-sm font-medium text-gray-900">
                                            {item.scan_metadata
                                              ?.total_software_count || 0}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            items
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t">
                                      <div className="text-xs text-gray-500">
                                        Last scan:{" "}
                                        {new Date(
                                          item.scan_metadata?.last_updated ||
                                            item.updatedAt
                                        ).toLocaleDateString()}
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs text-gray-600">
                                          Scanned
                                        </span>
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
                  </div>
                )}
              </div>
            ) : activeTab === "users" ? (
              // Users Tab
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Assets
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              if (assetType === "hardware") {
                fetchHardware();
              } else {
                fetchSoftware();
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
              if (assetType === "hardware") {
                fetchHardware();
              } else {
                fetchSoftware();
              }
              setShowCsvImportModal(false);
            }}
          />
        </LazyLoader>
      </div>
    </ProtectedRoute>
  );
}
