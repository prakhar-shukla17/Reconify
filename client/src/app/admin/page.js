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
import CreateUserModal from "../../components/CreateUserModal";

import LazyLoader from "../../components/LazyLoader";
import Pagination from "../../components/Pagination";
import { hardwareAPI, authAPI, ticketsAPI, softwareAPI, alertsAPI } from "../../lib/api";
import toast from "react-hot-toast";

import { 
  exportTicketsToCSV, 
  exportTicketStatsToCSV, 
  exportTicketsResolvedToday, 
  exportTicketsByTimePeriod,
  exportTicketsBySLACompliance
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
  Info,
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
    low: 0
  });
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);





  // Enhanced ticket filtering and pagination state
  const [ticketFilters, setTicketFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    searchTerm: '',
    dateRange: 'all',
    assignedTo: 'all'
  });
  
  const [ticketPagination, setTicketPagination] = useState({
    currentPage: 1,
    itemsPerPage: 12,
    totalPages: 1,
    totalItems: 0
  });

  // Ref for the assets section to scroll to
  const assetsSectionRef = useRef(null);

  // Asset pagination state
  const [assetPagination, setAssetPagination] = useState({
    currentPage: 1,
    itemsPerPage: 9,
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
    setTicketCache(prev => new Map(prev).set(cacheKey, {
      data,
      timestamp: Date.now()
    }));
  }, []);

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
      
      const response = await ticketsAPI.getAll({ page: 1, limit: 10000 }); // Increased limit to ensure all tickets are fetched
      const ticketsData = response.data.data || [];

      // Sort tickets: active tickets first, closed tickets last
      const sortedTickets = ticketsData.sort((a, b) => {
        const aIsClosed = a.status === "Closed" || a.status === "Rejected";
        const bIsClosed = b.status === "Closed" || b.status === "Rejected";

        if (aIsClosed && !bIsClosed) return 1; // a goes after b
        if (!aIsClosed && bIsClosed) return -1; // a goes before b
        
        // For active tickets, prioritize by priority and creation date
        if (!aIsClosed && !bIsClosed) {
          const priorityOrder = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
          const aPriority = priorityOrder[a.priority] || 5;
          const bPriority = priorityOrder[b.priority] || 5;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // If same priority, show newer tickets first
          return new Date(b.created_at) - new Date(a.created_at);
        }
        
        return 0; // keep original order for closed tickets
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

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return ticketFilters.status !== 'all' || 
           ticketFilters.priority !== 'all' || 
           ticketFilters.dateRange !== 'all' || 
           ticketFilters.searchTerm ||
           ticketFilters.category !== 'all' ||
           ticketFilters.assignedTo !== 'all';
  }, [ticketFilters]);

  // Memoized filtered tickets with advanced filtering
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];
    
    // Status filter
    if (ticketFilters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === ticketFilters.status);
    } else {
      // By default, only show active tickets (exclude closed and rejected)
      filtered = filtered.filter(ticket => 
        ticket.status !== 'Closed' && ticket.status !== 'Rejected'
      );
    }
    
    // Priority filter
    if (ticketFilters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === ticketFilters.priority);
    }
    
    // Category filter
    if (ticketFilters.category !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === ticketFilters.category);
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
    
    // Assigned to filter
    if (ticketFilters.assignedTo !== 'all') {
      if (ticketFilters.assignedTo === 'unassigned') {
        filtered = filtered.filter(ticket => !ticket.assigned_to?.username);
      } else {
        filtered = filtered.filter(ticket => ticket.assigned_to?.username === ticketFilters.assignedTo);
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

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab === "tickets") {
        switch (e.key) {
          case 'ArrowLeft':
            if (e.ctrlKey) {
              e.preventDefault();
              setTicketPagination(prev => ({
                ...prev,
                currentPage: Math.max(1, prev.currentPage - 1)
              }));
            }
            break;
          case 'ArrowRight':
            if (e.ctrlKey) {
              e.preventDefault();
              setTicketPagination(prev => ({
                ...prev,
                currentPage: Math.min(prev.totalPages, prev.currentPage + 1)
              }));
            }
            break;
          case 'Home':
            if (e.ctrlKey) {
              e.preventDefault();
              setTicketPagination(prev => ({ ...prev, currentPage: 1 }));
            }
            break;
          case 'End':
            if (e.ctrlKey) {
              e.preventDefault();
              setTicketPagination(prev => ({ ...prev, currentPage: prev.totalPages }));
            }
            break;
          case 'Escape':
            setTicketFilters({
              status: 'all',
              priority: 'all',
              category: 'all',
              searchTerm: '',
              dateRange: 'all',
              assignedTo: 'all'
            });
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
    return tickets.filter(ticket => 
      ticket.status !== "Closed" && ticket.status !== "Rejected"
    );
  }, [tickets]);

  // Initial data loading when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Load initial data based on active tab
        if (activeTab === "assets") {
          if (assetType === "hardware") {
            await fetchHardware(1, assetPagination.itemsPerPage);
          } else {
            await fetchSoftware(1, assetPagination.itemsPerPage);
          }
        } else if (activeTab === "users") {
          await fetchUsers();
        } else if (activeTab === "tickets") {
          await fetchTickets();
        } else if (activeTab === "alerts") {
          await fetchAlerts();
        }
        
        // Always load users for assignment functionality
        await fetchUsers();
        
        // Load dashboard stats for accurate asset counts
        await fetchDashboardStats();
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array - runs only once on mount

  useEffect(() => {
    if (activeTab === "assets") {
      if (assetType === "hardware") {
        fetchHardware(1, assetPagination.itemsPerPage);
      } else {
        fetchSoftware(1, assetPagination.itemsPerPage);
      }
      // Refresh dashboard stats when assets tab is activated
      fetchDashboardStats();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "tickets") {
      fetchTickets();
    } else if (activeTab === "alerts") {
      fetchAlerts();
    }
  }, [activeTab, assetType, assetPagination.itemsPerPage]);

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
    
    // Refresh dashboard stats when switching asset types
    fetchDashboardStats();
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

      // Update pagination state from server response
      if (response.data.pagination) {
        console.log('Hardware API response pagination:', response.data.pagination);
        setAssetPagination(prev => ({
          ...prev,
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
          itemsPerPage: response.data.pagination.itemsPerPage
        }));

        // Cache the response with pagination data
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
      setSearchLoading(false);
      setPaginationLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await hardwareAPI.getStats();
      console.log('Dashboard stats API response:', response.data);
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };



  const fetchSoftware = async (page = 1, limit = assetPagination.itemsPerPage) => {
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

      // Update pagination state from server response
      if (response.data.pagination) {
        console.log('Software API response pagination:', response.data.pagination);
        setAssetPagination(prev => ({
          ...prev,
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
          itemsPerPage: response.data.pagination.itemsPerPage
        }));

        // Cache the response with pagination data
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
      setSearchLoading(false);
      setPaginationLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAllUsers();
      console.log("Users API response:", response);
      const usersData = response.data.users || [];
      console.log("Users data:", usersData);
      
      // Ensure user objects have the expected structure
      const normalizedUsers = usersData.map(user => ({
        id: user._id || user.id,
        username: user.username || user.email,
        email: user.email,
        firstName: user.firstName || user.first_name || user.name?.split(' ')[0] || 'Unknown',
        lastName: user.lastName || user.last_name || user.name?.split(' ').slice(1).join(' ') || 'Unknown',
        role: user.role || 'user',
        department: user.department || 'Not specified',
        assignedAssets: user.assignedAssets || user.assigned_assets || [],
        isActive: user.isActive !== undefined ? user.isActive : true
      }));
      
      console.log("Normalized users:", normalizedUsers);
      setUsers(normalizedUsers);
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
        // Hardware statistics - use total count from pagination for overall count
        const totalAssets = assetPagination.totalItems || dashboardStats?.totalAssets || 0;
        
        // Calculate assigned assets from users data for more accurate count
        const assignedAssets = users.reduce((total, user) => {
          return total + (user.assignedAssets?.length || 0);
        }, 0);

        // Debug logging to verify total count
        console.log('Admin stats - Hardware:', {
          assetPaginationTotalItems: assetPagination.totalItems,
          dashboardStatsTotalAssets: dashboardStats?.totalAssets,
          calculatedTotalAssets: totalAssets,
          currentPageHardwareCount: hardware.length,
          assignedAssets,
          unassignedAssets: totalAssets - assignedAssets
        });

        return {
          totalAssets,
          assignedAssets,
          unassignedAssets: totalAssets - assignedAssets,
        };
      } else {
        // Software statistics - use total count from pagination for overall count
        const totalSystems = assetPagination.totalItems || 0;
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

        // Debug logging to verify total count
        console.log('Admin stats - Software:', {
          assetPaginationTotalItems: assetPagination.totalItems,
          calculatedTotalSystems: totalSystems,
          currentPageSoftwareCount: software.length,
          totalPackages,
          totalServices,
          totalStartupPrograms
        });

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
      const usersWithAssets = users.filter((u) => u.assignedAssets?.length > 0).length;
      const usersWithoutAssets = totalUsers - usersWithAssets;
      const totalAssignedAssets = users.reduce((sum, u) => sum + (u.assignedAssets?.length || 0), 0);
      const averageAssetsPerUser = totalUsers > 0 ? (totalAssignedAssets / totalUsers).toFixed(1) : 0;
      const maxAssetsPerUser = Math.max(...users.map((u) => u.assignedAssets?.length || 0), 0);

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
  const handleSearch = useCallback((term) => {
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
    if (e.key === 'Enter') {
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

  // Handle URL query parameters for tab navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      
      if (tabParam && ['assets', 'users', 'tickets', 'alerts', 'health', 'ml'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

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
      <div className="min-h-screen bg-white relative overflow-hidden">
        <Navbar />

        <div className="py-6 relative">
          {/* Subtle background gradient effect */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="mb-8">
              <div className="mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Admin Dashboard
                  </h1>
                  <p className="text-lg text-gray-600 font-light">
                    Manage users, assets, and system configuration
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {activeTab === "tickets" ? (
                <>
                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Ticket className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalTickets}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Total Tickets
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      All support requests
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <AlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.openTickets}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Open Tickets
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Awaiting response</p>
                  </div>

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Settings className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.inProgressTickets}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          In Progress
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Being worked on</p>
                  </div>

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.resolvedTickets}
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

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <X className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.closedTickets}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Closed
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Archived tickets</p>
                  </div>
                </>
              ) : activeTab === "users" ? (
                <>
                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalUsers}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Total Users
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      All registered accounts
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserPlus className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.activeUsers}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Active Users
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Currently active accounts
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <X className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.inactiveUsers}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Inactive Users
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Disabled accounts
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.usersWithAssets}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Users with Assets
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Have assigned devices
                    </p>
                  </div>


                </>
              ) : activeTab === "alerts" ? (
                <>
                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Bell className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalAlerts}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Total Alerts
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      All active alerts
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <AlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.criticalAlerts}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Critical
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Immediate attention required
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <AlertTriangle className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.highAlerts}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          High Priority
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      High priority issues
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.mediumAlerts}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Medium Priority
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Monitor closely
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.lowAlerts}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Low Priority
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Low risk alerts
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {assetType === "hardware"
                            ? stats.totalAssets
                            : stats.totalSystems}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          {assetType === "hardware"
                            ? "Total Assets"
                            : "Total Systems"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {assetType === "hardware"
                        ? "All registered devices"
                        : "All scanned systems"}
                    </p>
                  </div>

                  {assetType === "hardware" ? (
                    <>
                      <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Check className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {stats.assignedAssets}
                            </p>
                            <p className="text-sm text-gray-600 font-medium">
                              Assigned
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          User assigned
                        </p>
                      </div>

                      <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <X className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {stats.unassignedAssets}
                            </p>
                            <p className="text-sm text-gray-600 font-medium">
                              Unassigned
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Available for assignment
                        </p>
                      </div>


                    </>
                  ) : (
                    <>
                      <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {stats.totalPackages}
                            </p>
                            <p className="text-sm text-gray-600 font-medium">
                              Software Packages
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Installed software
                        </p>
                      </div>

                      <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Settings className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {stats.totalServices}
                            </p>
                            <p className="text-sm text-gray-600 font-medium">
                              Services
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          System services
                        </p>
                      </div>
                    </>
                  )}


                </>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 mb-8">
              <div className="border-b border-gray-100">
                <nav className="flex space-x-2 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("assets")}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-2xl ${
                      activeTab === "assets"
                        ? "border-gray-900 text-gray-900 bg-gray-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Monitor className="h-5 w-5 inline mr-3" />
                    Assets
                  </button>
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-2xl ${
                      activeTab === "users"
                        ? "border-gray-900 text-gray-900 bg-gray-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="h-5 w-5 inline mr-3" />
                    Users
                  </button>
                  <button
                    onClick={() => setActiveTab("alerts")}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-2xl ${
                      activeTab === "alerts"
                        ? "border-gray-900 text-gray-900 bg-gray-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Bell className="h-5 w-5 inline mr-2" />
                    Alerts
                  </button>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-2xl ${
                      activeTab === "tickets"
                        ? "border-gray-900 text-gray-900 bg-gray-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Ticket className="h-5 w-5 inline mr-3" />
                    Tickets
                  </button>
                  <button
                    onClick={() => setShowHealthDashboard(true)}
                    className="py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 rounded-t-2xl"
                  >
                    <Activity className="h-5 w-5 inline mr-3" />
                    Health
                  </button>
                </nav>
              </div>

              {/* Search and Filter Bar */}
              {activeTab !== "alerts" && activeTab !== "tickets" && (
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                  {/* Asset Type Toggle */}
                  {activeTab === "assets" && (
                    <div className="mb-4">
                      <div className="flex space-x-2 bg-gray-100 p-2 rounded-2xl">
                        <button
                          onClick={() => handleAssetTypeChange("hardware")}
                          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                            assetType === "hardware"
                              ? "bg-white text-gray-900 shadow-lg"
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
                          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                            assetType === "software"
                              ? "bg-white text-gray-900 shadow-lg"
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
                        className={`w-full pl-7 pr-24 py-3 border rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 transition-colors ${
                          searchTerm ? 'border-gray-400 bg-gray-50' : 'border-gray-300 bg-white'
                        }`}
                      />
                      {searchTerm && (
                        <div className="absolute right-20 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                          Press Enter to search
                        </div>
                      )}
                      <button
                        onClick={handleSearchSubmit}
                        disabled={searchLoading}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white text-xs rounded-xl hover:from-black hover:to-gray-900 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                           className="absolute right-20 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-500 text-white text-xs rounded-xl hover:bg-gray-600 focus:ring-2 focus:ring-gray-400 transition-all duration-300 hover:scale-105"
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
                              className="pl-7 pr-5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 bg-white"
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
                        className="flex items-center px-4 py-2.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl hover:from-black hover:to-gray-900 focus:ring-2 focus:ring-gray-400 disabled:opacity-50 text-sm transition-all duration-300 hover:scale-105"
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
                            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl hover:from-black hover:to-gray-900 focus:ring-2 focus:ring-gray-400 text-sm transition-all duration-300 hover:scale-105"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Import CSV
                          </button>
                          <button
                            onClick={() => setShowManualAssetModal(true)}
                            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl hover:from-black hover:to-gray-900 focus:ring-2 focus:ring-gray-400 text-sm transition-all duration-300 hover:scale-105"
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Add Asset
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Remove Filter Text - Below the filter div */}
                  {(filterType !== "all" || searchTerm) && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={() => {
                          setFilterType("all");
                          setSearchTerm("");
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition-colors"
                        title="Remove all filters"
                      >
                        Remove Filter
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Ticket Filter Bar - Merged with nav like assets/users */}
              {activeTab === "tickets" && tickets.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Search Input */}
                    <div className="lg:col-span-2">
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Search Tickets
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by title, description, ID..."
                          value={ticketFilters.searchTerm}
                          onChange={(e) => setTicketFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              // Trigger search on Enter key
                              e.preventDefault();
                            }
                          }}
                          className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-2xl text-base text-gray-900 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors bg-white hover:border-gray-400"
                        />
                        {ticketFilters.searchTerm && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                            Press Enter to search
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={ticketFilters.status}
                        onChange={(e) => setTicketFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-3 border border-gray-300 rounded-2xl text-base text-gray-900 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors bg-white hover:border-gray-400"
                      >
                        <option value="all">All Status</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    {/* Priority Filter */}
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={ticketFilters.priority}
                        onChange={(e) => setTicketFilters(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-3 border border-gray-300 rounded-2xl text-base text-gray-900 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors bg-white hover:border-gray-400"
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
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Date Range
                      </label>
                      <select
                        value={ticketFilters.dateRange}
                        onChange={(e) => setTicketFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="w-full px-3 py-3 border border-gray-300 rounded-2xl text-base text-gray-900 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors bg-white hover:border-gray-400"
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
                        onClick={() => setTicketFilters({
                          status: 'all',
                          priority: 'all',
                          category: 'all',
                          searchTerm: '',
                          dateRange: 'all',
                          assignedTo: 'all'
                        })}
                        className="w-full px-4 py-3 text-base text-gray-600 border border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-300 hover:scale-105"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>



                  {/* Quick Actions */}
                  <div className="mt-3 flex items-center space-x-4 text-sm">
                    <span className="text-gray-800">Quick Actions:</span>
                    <button
                      onClick={() => setTicketFilters(prev => ({ ...prev, status: 'Open' }))}
                      className="text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                    >
                      Show Open Tickets
                    </button>
                    <button
                      onClick={() => setTicketFilters(prev => ({ ...prev, priority: 'Critical' }))}
                      className="text-red-700 hover:text-red-900 hover:underline transition-colors"
                    >
                      Show Critical Priority
                    </button>
                    <button
                      onClick={() => setTicketFilters(prev => ({ ...prev, dateRange: 'today' }))}
                      className="text-green-700 hover:text-green-900 hover:underline transition-colors"
                    >
                      Show Today's Tickets
                    </button>
                    <button
                      onClick={() => setTicketFilters(prev => ({ ...prev, status: 'Closed' }))}
                      className="text-gray-700 hover:text-gray-900 hover:underline transition-colors"
                    >
                      Show Closed Tickets
                    </button>
                    
                    {/* Refresh Button */}
                    <button
                      onClick={() => fetchTickets(true)}
                      disabled={ticketLoading}
                      className="text-blue-700 hover:text-blue-900 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      title="Refresh tickets data"
                    >
                      <RefreshCw className={`h-3 w-3 ${ticketLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
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
              <div className="p-8 bg-white rounded-3xl border border-gray-200 shadow-sm">
                {/* Export Buttons */}
                {tickets.length > 0 && (
                  <div className="mb-8 flex items-center justify-end space-x-3">
                    <button
                      onClick={() => {
                        exportTicketsToCSV(tickets, 'admin_all_tickets');
                        toast.success(`Exported ${tickets.length} tickets to CSV`);
                      }}
                      disabled={ticketLoading}
                      className="text-sm border border-green-300 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center font-medium"
                      title="Export all tickets to CSV"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export All
                    </button>
                    <button
                      onClick={() => {
                        exportTicketStatsToCSV(tickets, 'admin_ticket_statistics');
                        toast.success('Exported ticket statistics to CSV');
                      }}
                      disabled={ticketLoading}
                      className="text-sm border border-purple-300 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center font-medium"
                      title="Export ticket statistics to CSV"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export Stats
                    </button>
                    
                    {/* Export Filtered Tickets Button */}
                    <button
                      onClick={() => {
                        if (filteredTickets.length === 0) {
                          toast.error('No filtered tickets to export');
                          return;
                        }
                        exportTicketsToCSV(filteredTickets, 'admin_filtered_tickets');
                        toast.success(`Exported ${filteredTickets.length} filtered tickets to CSV`);
                      }}
                      disabled={ticketLoading || filteredTickets.length === 0}
                      className="text-sm border border-indigo-300 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center font-medium"
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
                            const count = exportTicketsResolvedToday(sortedTickets, 'admin_tickets_resolved_today');
                            toast.success(`Exported ${count} tickets resolved today to CSV (fresh data)`);
                          } catch (error) {
                            console.error('Error fetching fresh tickets for export:', error);
                            // Fallback to cached data
                            const count = exportTicketsResolvedToday(tickets, 'admin_tickets_resolved_today');
                            toast.success(`Exported ${count} tickets resolved today to CSV (cached data)`);
                          }
                        }}
                        disabled={ticketLoading}
                        className="text-sm border border-blue-300 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center font-medium"
                        title="Export tickets resolved today (with fresh data)"
                      >
                                                 <Download className="h-3 w-3 mr-1" />
                         Resolved Today
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
                            const count = exportTicketsByTimePeriod(sortedTickets, '7d', 'admin_tickets_last_7_days');
                            toast.success(`Exported ${count} tickets from last 7 days to CSV (fresh data)`);
                          } catch (error) {
                            console.error('Error fetching fresh tickets for export:', error);
                            // Fallback to cached data
                            const count = exportTicketsByTimePeriod(tickets, '7d', 'admin_tickets_last_7_days');
                            toast.success(`Exported ${count} tickets from last 7 days to CSV (cached data)`);
                          }
                        }}
                        disabled={ticketLoading}
                        className="text-sm border border-orange-300 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center font-medium"
                        title="Export tickets from last 7 days (with fresh data)"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        7 Days
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
                            const count = exportTicketsBySLACompliance(sortedTickets, 'compliant', 'admin_sla_compliant_tickets');
                            toast.success(`Exported ${count} SLA compliant tickets to CSV (fresh data)`);
                          } catch (error) {
                            console.error('Error fetching fresh tickets for export:', error);
                            // Fallback to cached data
                            const count = exportTicketsBySLACompliance(tickets, 'compliant', 'admin_sla_compliant_tickets');
                            toast.success(`Exported ${count} SLA compliant tickets to CSV (cached data)`);
                          }
                        }}
                        disabled={ticketLoading}
                        className="text-sm border border-emerald-300 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center font-medium"
                        title="Export SLA compliant tickets (with fresh data)"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        SLA OK
                      </button>
                    </div>
                  </div>
                )}

                {tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Ticket className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      No support tickets found
                    </h3>
                    <p className="text-base text-slate-500">
                      No users have created support tickets yet.
                    </p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      No tickets match your filters
                    </h3>
                    <p className="text-base text-slate-500">
                      Try adjusting your search criteria or clearing some filters.
                    </p>
                    <button
                      onClick={() => setTicketFilters({
                        status: 'all',
                        priority: 'all',
                        category: 'all',
                        searchTerm: '',
                        dateRange: 'all',
                        assignedTo: 'all'
                      })}
                      className="mt-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-105 text-base font-medium shadow-lg"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
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
                      <div className="flex items-center space-x-3">
                        <label className="text-base font-medium text-gray-700">Show:</label>
                        <select
                          value={ticketPagination.itemsPerPage}
                          onChange={(e) => {
                            const newItemsPerPage = parseInt(e.target.value);
                            setTicketPagination(prev => ({
                              ...prev,
                              itemsPerPage: newItemsPerPage,
                              currentPage: 1, // Reset to first page
                              totalPages: Math.ceil(filteredTickets.length / newItemsPerPage)
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-2xl text-base text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                        >
                          <option value={4}>4</option>
                          <option value={8}>8</option>
                          <option value={12}>12</option>
                          <option value={16}>16</option>
                          <option value={20}>20</option>
                        </select>
                        <span className="text-base text-gray-800 font-medium">per page</span>
                      </div>

                      {/* Page info */}
                      <div className="text-base text-gray-800 font-medium">
                        Page {ticketPagination.currentPage} of {ticketPagination.totalPages} 
                        ({filteredTickets.length} filtered tickets)
                        {hasActiveFilters && (
                          <span className="text-gray-500 ml-1">
                            of {tickets.length} total
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pagination buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setTicketPagination(prev => ({
                          ...prev,
                          currentPage: Math.max(1, prev.currentPage - 1)
                        }))}
                        disabled={ticketPagination.currentPage === 1}
                        className="px-4 py-2.5 text-base text-gray-800 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-300 hover:scale-105"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: Math.min(5, ticketPagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (ticketPagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (ticketPagination.currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (ticketPagination.currentPage >= ticketPagination.totalPages - 2) {
                            pageNum = ticketPagination.totalPages - 4 + i;
                          } else {
                            pageNum = ticketPagination.currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setTicketPagination(prev => ({
                                ...prev,
                                currentPage: pageNum
                              }))}
                              className={`px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-300 hover:scale-105 ${
                                pageNum === ticketPagination.currentPage
                                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setTicketPagination(prev => ({
                          ...prev,
                          currentPage: Math.min(prev.totalPages, prev.currentPage + 1)
                        }))}
                        disabled={ticketPagination.currentPage === ticketPagination.totalPages}
                        className="px-4 py-2.5 text-base text-gray-800 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-300 hover:scale-105"
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
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border cursor-pointer h-80 flex flex-col"
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

                                    <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
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

                    {/* Assets Pagination */}
                    {assetPagination.totalPages > 1 && (
                      <div className="mt-6">
                        {/* Pagination Navigation */}
                        <div className="flex items-center justify-center space-x-2 mb-4">
                          {/* Fast Forward to First Page */}
                          <button
                            onClick={() => handleAssetPageChange(1)}
                            disabled={assetPagination.currentPage === 1}
                            className="px-3 py-2.5 text-base text-gray-800 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-300 hover:scale-105"
                            title="Go to first page"
                          >
                            ⏮️
                          </button>
                          
                          <button
                            onClick={() => handleAssetPageChange(Math.max(1, assetPagination.currentPage - 1))}
                            disabled={assetPagination.currentPage === 1}
                            className="px-4 py-2.5 text-base text-gray-800 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-300 hover:scale-105"
                          >
                            Previous
                          </button>
                          
                          {/* Page numbers */}
                          <div className="flex items-center space-x-2">
                            {Array.from({ length: Math.min(5, assetPagination.totalPages) }, (_, i) => {
                              let pageNum;
                              if (assetPagination.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (assetPagination.currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (assetPagination.currentPage >= assetPagination.totalPages - 2) {
                                pageNum = assetPagination.totalPages - 4 + i;
                              } else {
                                pageNum = assetPagination.currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handleAssetPageChange(pageNum)}
                                  className={`px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-300 hover:scale-105 ${
                                    pageNum === assetPagination.currentPage
                                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg'
                                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => handleAssetPageChange(Math.min(assetPagination.totalPages, assetPagination.currentPage + 1))}
                            disabled={assetPagination.currentPage >= assetPagination.totalPages}
                            className="px-4 py-2.5 text-base text-gray-800 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-300 hover:scale-105"
                          >
                            Next
                          </button>
                          
                          {/* Fast Forward to Last Page */}
                          <button
                            onClick={() => handleAssetPageChange(assetPagination.totalPages)}
                            disabled={assetPagination.currentPage >= assetPagination.totalPages}
                            className="px-3 py-2.5 text-base text-gray-800 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-300 hover:scale-105"
                            title="Go to last page"
                          >
                            ⏭️
                          </button>
                        </div>

                        {/* Clean Info Bar */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4">
                          <div className="flex items-center justify-between">
                            {/* Left Side - Items per page & Page info */}
                            <div className="flex items-center space-x-6">
                              {/* Items per page selector */}
                              <div className="flex items-center space-x-3">
                                <label className="text-sm font-medium text-gray-700">Show:</label>
                                <select
                                  value={assetPagination.itemsPerPage}
                                  onChange={(e) => {
                                    const newItemsPerPage = parseInt(e.target.value);
                                    setAssetPagination(prev => ({
                                      ...prev,
                                      itemsPerPage: newItemsPerPage,
                                      currentPage: 1, // Reset to first page
                                      totalPages: Math.ceil(assetPagination.totalItems / newItemsPerPage)
                                    }));
                                  }}
                                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium bg-white"
                                >
                                  <option value={9}>9</option>
                                  <option value={18}>18</option>
                                  <option value={27}>27</option>
                                  <option value={36}>36</option>
                                  <option value={45}>45</option>
                                </select>
                                <span className="text-sm text-gray-600">per page</span>
                              </div>

                              {/* Page info */}
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Page {assetPagination.currentPage}</span>
                                <span className="text-gray-500"> of {assetPagination.totalPages}</span>
                                <span className="text-gray-600 ml-2">({assetPagination.totalItems} {assetType === "hardware" ? "hardware assets" : "software systems"})</span>
                              </div>
                            </div>

                            {/* Right Side - Quick jump */}
                            {assetPagination.totalPages > 10 && (
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-700">Quick Jump:</span>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    placeholder="Page #"
                                    className="w-16 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-center bg-white"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const page = parseInt(e.target.value);
                                        if (page >= 1 && page <= assetPagination.totalPages) {
                                          handleAssetPageChange(page);
                                          e.target.value = '';
                                        } else {
                                          toast.error(`Please enter a page number between 1 and ${assetPagination.totalPages}`);
                                        }
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const page = parseInt(e.target.value);
                                      if (page >= 1 && page <= assetPagination.totalPages) {
                                        handleAssetPageChange(page);
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-500">of {assetPagination.totalPages}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Results Info */}
                    {!loading && assetPagination.totalItems > 1000 && (
                      <div className="mt-8 text-center text-sm text-gray-500">
                        <div className="text-xs text-blue-600">
                          💡 Tip: Use search and filters to quickly find specific assets
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            ) : activeTab === "users" ? (
              // Users Tab
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No users found</p>
                    <p className="text-sm text-gray-500 mt-2">Users will appear here once they are registered</p>
                  </div>
                ) : (
                  <>
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          User Management ({users.length} users)
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowCreateUserModal(true)}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                            title="Create new user"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span>Create User</span>
                          </button>
                          <button
                            onClick={() => fetchUsers()}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                            title="Refresh users"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
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
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-700">
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
                                <span className="font-medium">
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
                    
                    {filteredUsers.length === 0 && searchTerm && (
                      <div className="p-8 text-center">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No users found matching "{searchTerm}"</p>
                        <button
                          onClick={handleClearSearch}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : activeTab === "alerts" ? (
              <AlertsPanel />
            ) : (
              <HealthDashboard
                isOpen={showHealthDashboard}
                onClose={() => setShowHealthDashboard(false)}
              />
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
              onUpdate={async () => {
                // Force refresh tickets data to show updated information
                await fetchTickets(true);
                
                // Reset pagination to first page when tickets are updated
                setTicketPagination(prev => ({ ...prev, currentPage: 1 }));
                
                // Ensure the UI updates by forcing a re-render
                // This will recalculate filtered tickets and pagination
                setTicketFilters(prev => ({ ...prev }));
                
                // Data has been refreshed silently
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

        {/* Create User Modal */}
        <LazyLoader>
          <CreateUserModal
            isOpen={showCreateUserModal}
            onClose={() => setShowCreateUserModal(false)}
            onUserCreated={(newUser) => {
              // Add the new user to the users list
              setUsers(prev => [newUser, ...prev]);
              // Refresh users to get the updated list
              fetchUsers();
              toast.success(`User ${newUser.firstName} ${newUser.lastName} created successfully!`);
            }}
          />
        </LazyLoader>
      </div>
    </ProtectedRoute>
  );
}
