"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import HardwareCard from "../../components/HardwareCard";
import HardwareDetails from "../../components/HardwareDetails";
import SoftwareDetails from "../../components/SoftwareDetails";
import { hardwareAPI, softwareAPI, ticketsAPI } from "../../lib/api";
import toast from "react-hot-toast";

import {
  Monitor,
  Package,
  Settings,
  Play,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Download,
  CheckCircle,
  Clock,
  Shield,
  Plus,
  Ticket,
  X,
  User,
  Star,
} from "lucide-react";

export default function MyAssetsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("hardware");
  const [hardware, setHardware] = useState([]);
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedHardware, setSelectedHardware] = useState(null);
  const [selectedSoftware, setSelectedSoftware] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showPersonalOnly, setShowPersonalOnly] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "Hardware",
    assetId: "",
  });
  const [ticketLoading, setTicketLoading] = useState(false);
  
  // Personal assets state - store in localStorage for persistence
  const [personalAssets, setPersonalAssets] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`personalAssets_${user?.username}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Toggle personal asset status
  const togglePersonalAsset = (assetId, assetType) => {
    const newPersonalAssets = personalAssets.includes(assetId) 
      ? personalAssets.filter(id => id !== assetId)
      : [...personalAssets, assetId];
    
    setPersonalAssets(newPersonalAssets);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`personalAssets_${user?.username}`, JSON.stringify(newPersonalAssets));
    }
    
    toast.success(
      personalAssets.includes(assetId) 
        ? "Asset removed from personal devices" 
        : "Asset marked as personal device"
    );
  };

  // Check if an asset is personal
  const isPersonalAsset = (assetId) => personalAssets.includes(assetId);

  // Fetch user's hardware assets
  const fetchHardware = async () => {
    try {
      setSearchLoading(true);
      const response = await hardwareAPI.getAll({ 
        page: 1, 
        limit: 1000,
        search: searchTerm || undefined,
        filter: filterType !== "all" ? filterType : undefined
      });
      setHardware(response.data.data || []);
    } catch (error) {
      console.error("Error fetching hardware:", error);
      toast.error("Failed to load hardware data");
    } finally {
      setSearchLoading(false);
    }
  };

  // Fetch user's software assets
  const fetchSoftware = async () => {
    try {
      setSearchLoading(true);
      const response = await softwareAPI.getAll({ 
        page: 1, 
        limit: 1000,
        search: searchTerm || undefined,
        filter: filterType !== "all" ? filterType : undefined
      });
      setSoftware(response.data.data || []);
    } catch (error) {
      console.error("Error fetching software:", error);
      toast.error("Failed to load software data");
    } finally {
      setSearchLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchHardware(), fetchSoftware()]);
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Refetch data when search or filter changes
  useEffect(() => {
    if (activeTab === "hardware") {
      fetchHardware();
    } else {
      fetchSoftware();
    }
  }, [searchTerm, filterType, activeTab, showPersonalOnly]);

  // Handle search
  const handleSearch = () => {
    if (activeTab === "hardware") {
      fetchHardware();
    } else {
      fetchSoftware();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    if (activeTab === "hardware") {
      fetchHardware();
    } else {
      fetchSoftware();
    }
  };

  // Get filtered assets based on personal filter
  const getFilteredAssets = (assets) => {
    if (showPersonalOnly) {
      return assets.filter(asset => isPersonalAsset(asset._id));
    }
    return assets;
  };

  // Export assets to CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    let csvContent = "";
    
    if (activeTab === "hardware") {
      const headers = [
        "Device Name",
        "Asset Tag",
        "Device Type",
        "Model",
        "Serial Number",
        "MAC Address",
        "IP Address",
        "Status",
        "Last Updated"
      ];
      
      csvContent = [
        headers.join(','),
        ...data.map(item => [
          item.system?.hostname || 'N/A',
          item.asset_tag || 'N/A',
          item.system?.platform || 'N/A',
          item.system?.model || 'N/A',
          item.system?.serial_number || 'N/A',
          item.system?.mac_address || 'N/A',
          item.network?.ip_address || 'N/A',
          item.status || 'N/A',
          item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'
        ].join(','))
      ].join('\n');
    } else {
      const headers = [
        "System Hostname",
        "Operating System",
        "OS Version",
        "Total Software Packages",
        "Services Running",
        "Startup Programs",
        "Last Scan Date"
      ];
      
      csvContent = [
        headers.join(','),
        ...data.map(item => [
          item.system?.hostname || 'N/A',
          item.system?.platform || 'N/A',
          item.system?.platform_release || 'N/A',
          item.scan_metadata?.total_software_count || '0',
          item.services?.length || '0',
          item.startup_programs?.length || '0',
          item.scan_metadata?.last_updated ? new Date(item.scan_metadata.last_updated).toLocaleDateString() : 'N/A'
        ].join(','))
      ].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`${filename} exported successfully!`);
  };

  const handleExport = () => {
    const data = activeTab === "hardware" ? getFilteredAssets(hardware) : getFilteredAssets(software);
    const filename = `my_${activeTab}_assets_${showPersonalOnly ? 'personal_' : ''}${new Date().toISOString().split('T')[0]}`;
    exportToCSV(data, filename);
  };

  // Handle ticket creation
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!ticketForm.assetId) {
      toast.error("Please select a related asset for this ticket");
      return;
    }

    try {
      setTicketLoading(true);
      
      // Map our category values to server-expected values
      const categoryMapping = {
        "Hardware": "Hardware Issue",
        "Software": "Software Issue", 
        "Network": "Network Issue",
        "Account": "Access Request",
        "Other": "Other"
      };

      const ticketData = {
        title: ticketForm.title.trim(),
        description: ticketForm.description.trim(),
        priority: ticketForm.priority,
        category: categoryMapping[ticketForm.category] || "Other",
        asset_id: ticketForm.assetId
      };

      const response = await ticketsAPI.create(ticketData);
      
      if (response.data.success) {
        toast.success("Ticket created successfully!");
        setShowTicketModal(false);
        setTicketForm({
          title: "",
          description: "",
          priority: "Medium",
          category: "Hardware",
          assetId: "",
        });
      } else {
        toast.error("Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error(error.response?.data?.error || "Failed to create ticket");
    } finally {
      setTicketLoading(false);
    }
  };

  // Open ticket modal with pre-filled asset
  const handleOpenTicketModal = () => {
    // Pre-select the first available asset based on current tab
    const firstAsset = activeTab === "hardware" ? hardware[0] : software[0];
    setTicketForm({
      title: "",
      description: "",
      priority: "Medium",
      category: activeTab === "hardware" ? "Hardware" : "Software",
      assetId: firstAsset?._id || "",
    });
    setShowTicketModal(true);
  };

  // Reset ticket form when modal closes
  const handleCloseTicketModal = () => {
    setShowTicketModal(false);
    setTicketForm({
      title: "",
      description: "",
      priority: "Medium",
      category: "Hardware",
      assetId: "",
    });
  };

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
                Back to My Assets
              </button>
              <HardwareDetails 
                hardware={selectedHardware} 
                onHardwareUpdate={(updatedHardware) => {
                  setSelectedHardware(updatedHardware);
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
      <ProtectedRoute>
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      My Assets
                    </h1>
                  <p className="text-lg text-gray-600 font-light">
                    View and manage your assigned IT hardware and software assets
                  </p>
                </div>
                
                <button
                  onClick={handleOpenTicketModal}
                  disabled={hardware.length === 0 && software.length === 0}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white text-sm font-medium rounded-2xl hover:from-black hover:to-gray-900 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 bg-white hover:bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Monitor className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {getFilteredAssets(hardware).length}
                      {showPersonalOnly && hardware.length > 0 && (
                        <span className="text-sm text-blue-600 ml-2">
                          of {hardware.length}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">
                      Hardware Devices
                      {showPersonalOnly && (
                        <span className="text-xs text-blue-600 ml-2">(Personal Only)</span>
                      )}
                    </p>
                  </div>
                  </div>
                <p className="text-xs text-gray-500">
                  Your assigned hardware
                </p>
              </div>

              <div className="p-6 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {getFilteredAssets(software).length}
                      {showPersonalOnly && software.length > 0 && (
                        <span className="text-sm text-green-600 ml-2">
                          of {software.length}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">
                      Software Systems
                      {showPersonalOnly && (
                        <span className="text-xs text-green-600 ml-2">(Personal Only)</span>
                      )}
                    </p>
                  </div>
                  </div>
                <p className="text-xs text-gray-500">Your assigned software</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 mb-8">
              <div className="border-b border-gray-100">
                <nav className="flex space-x-2 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("hardware")}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-2xl ${
                      activeTab === "hardware"
                        ? "border-gray-900 text-gray-900 bg-gray-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Monitor className="h-5 w-5 inline mr-3" />
                    Hardware ({getFilteredAssets(hardware).length})
                    {showPersonalOnly && hardware.length > 0 && (
                      <span className="text-xs text-blue-600 ml-1">
                        of {hardware.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("software")}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-2xl ${
                      activeTab === "software"
                        ? "border-gray-900 text-gray-900 bg-gray-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Package className="h-5 w-5 inline mr-3" />
                    Software ({getFilteredAssets(software).length})
                    {showPersonalOnly && software.length > 0 && (
                      <span className="text-xs text-green-600 ml-1">
                        of {software.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {/* Search and Filter Bar */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
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
                        activeTab === "hardware"
                          ? "Search hardware assets..."
                          : "Search software systems..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className={`w-full pl-10 pr-24 py-3 border rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 transition-colors ${
                        searchTerm ? 'border-gray-400 bg-gray-50' : 'border-gray-300 bg-white'
                      }`}
                    />
                    <button
                      onClick={handleSearch}
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

                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="pl-10 pr-8 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 bg-white transition-colors"
                      >
                        {activeTab === "hardware" ? (
                          <>
                            <option value="all">All Hardware</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
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

                    <button
                      onClick={activeTab === "hardware" ? fetchHardware : fetchSoftware}
                      disabled={loading}
                      className="flex items-center px-4 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl hover:from-black hover:to-gray-900 focus:ring-2 focus:ring-gray-400 disabled:opacity-50 text-sm transition-all duration-300 hover:scale-105"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </button>

                    <button
                      onClick={() => setShowPersonalOnly(!showPersonalOnly)}
                      className={`flex items-center px-4 py-3 rounded-2xl text-sm transition-all duration-300 hover:scale-105 ${
                        showPersonalOnly 
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      title={showPersonalOnly ? "Show all assets" : "Show only personal assets"}
                    >
                      <Star className={`h-4 w-4 mr-2 ${showPersonalOnly ? 'text-yellow-200' : ''}`} />
                      {showPersonalOnly ? 'All Assets' : 'Personal Only'}
                    </button>

                    <button
                      onClick={handleExport}
                      disabled={loading || (activeTab === "hardware" ? getFilteredAssets(hardware).length === 0 : getFilteredAssets(software).length === 0)}
                      className="flex items-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-400 disabled:opacity-50 text-sm transition-all duration-300 hover:scale-105"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
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
            ) : activeTab === "hardware" ? (
              // Hardware Tab
              <div>
                {hardware.length === 0 ? (
                  <div className="text-center py-12">
                    <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hardware assets assigned
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || filterType !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "You don't have any hardware assets assigned to you yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredAssets(hardware).map((item) => (
                      <div key={item._id} className="relative">
                        <HardwareCard
                          hardware={item}
                          onClick={setSelectedHardware}
                        />
                        
                        {/* Asset Status Badge */}
                        <div className="absolute top-2 right-2 flex space-x-2">
                          {/* Personal Asset Indicator */}
                          {isPersonalAsset(item._id) && (
                            <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              Personal
                            </div>
                          )}
                          
                                                      {item.status === "Active" ? (
                              <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Active
                              </div>
                            ) : (
                              <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                {item.status || ""}
                              </div>
                            )}
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="absolute bottom-2 right-2 flex space-x-2">
                          {/* Personal Asset Toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePersonalAsset(item._id, 'hardware');
                            }}
                            className={`text-xs px-2 py-1 rounded-full transition-colors ${
                              isPersonalAsset(item._id)
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={isPersonalAsset(item._id) ? "Remove from personal devices" : "Mark as personal device"}
                          >
                            {isPersonalAsset(item._id) ? (
                              <>
                                <Star className="h-3 w-3 inline mr-1" />
                                Personal
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3 inline mr-1" />
                                Mark Personal
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTicketForm({
                                title: "",
                                description: "",
                                priority: "Medium",
                                category: "Hardware",
                                assetId: item._id,
                              });
                              setShowTicketModal(true);
                            }}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                            title="Create ticket for this asset"
                          >
                            <Ticket className="h-3 w-3 inline mr-1" />
                            Ticket
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Software Tab
              <div>
                {software.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No software systems assigned
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || filterType !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "You don't have any software systems assigned to you yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredAssets(software).map((item) => (
                                              <div
                          key={item._id}
                          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border cursor-pointer relative"
                          onClick={() => setSelectedSoftware(item)}
                        >
                          {/* Personal Asset Indicator */}
                          {isPersonalAsset(item._id) && (
                            <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              Personal
                            </div>
                          )}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.system?.hostname || ""}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {item.system?.platform} Software
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">MAC Address</p>
                            <p className="text-sm font-mono text-gray-700">
                              {item.system?.mac_address || ""}
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

                        {/* Quick Action Button */}
                        <div className="absolute bottom-2 right-2 flex space-x-2">
                          {/* Personal Asset Toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePersonalAsset(item._id, 'software');
                            }}
                            className={`text-xs px-2 py-1 rounded-full transition-colors ${
                              isPersonalAsset(item._id)
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={isPersonalAsset(item._id) ? "Remove from personal devices" : "Mark as personal device"}
                          >
                            {isPersonalAsset(item._id) ? (
                              <>
                                <Star className="h-3 w-3 inline mr-1" />
                                Personal
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3 inline mr-1" />
                                Mark Personal
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTicketForm({
                                title: "",
                                description: "",
                                priority: "Medium",
                                category: "Software",
                                assetId: item._id,
                              });
                              setShowTicketModal(true);
                            }}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                            title="Create ticket for this system"
                          >
                            <Ticket className="h-3 w-3 inline mr-1" />
                            Ticket
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Results Info */}
            {!loading && (
              <div className="mt-8 text-center text-sm text-gray-500">
                Showing {activeTab === "hardware" ? getFilteredAssets(hardware).length : getFilteredAssets(software).length} {activeTab === "hardware" ? "hardware assets" : "software systems"} assigned to you
                
                {showPersonalOnly && (
                  <div className="mt-2 text-xs text-yellow-600">
                    ⭐ Showing only personal devices
                  </div>
                )}
                
                {searchTerm && (
                  <div className="mt-2 text-xs text-blue-600">
                    🔍 Filtered by: "{searchTerm}"
                  </div>
                )}
                
                {filterType !== "all" && (
                  <div className="mt-2 text-xs text-purple-600">
                    🏷️ Filtered by: {filterType}
                  </div>
                )}
              </div>
            )}

            {/* Ticket Creation Modal */}
            {showTicketModal && (
              <div 
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
                onClick={handleCloseTicketModal}
              >
                <div 
                  className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-gray-900 to-black px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                          <Ticket className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                        Create Support Ticket
                      </h3>
                          <p className="text-gray-300 text-sm">
                            Submit a new support request for your assets
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleCloseTicketModal}
                        className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    </div>
                    
                  {/* Modal Body */}
                  <div className="p-8">
                    <form onSubmit={handleCreateTicket} className="space-y-6">
                      {/* Title Field */}
                      <div>
                        <label className="block text-base font-semibold text-gray-800 mb-3">
                          Ticket Title *
                        </label>
                        <input
                          type="text"
                          value={ticketForm.title}
                          onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-800 placeholder-gray-500 text-base transition-all duration-300 hover:border-gray-400"
                          placeholder="Brief description of the issue"
                          required
                        />
                      </div>

                      {/* Description Field */}
                      <div>
                        <label className="block text-base font-semibold text-gray-800 mb-3">
                          Description *
                        </label>
                        <textarea
                          value={ticketForm.description}
                          onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-800 placeholder-gray-500 text-base transition-all duration-300 hover:border-gray-400 resize-none"
                          placeholder="Provide detailed information about the problem, steps to reproduce, and any error messages..."
                          required
                        />
                      </div>

                      {/* Priority and Category Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-base font-semibold text-gray-800 mb-3">
                            Priority Level
                          </label>
                          <select
                            value={ticketForm.priority}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-800 text-base transition-all duration-300 hover:border-gray-400"
                          >
                            <option value="Low">🟢 Low Priority</option>
                            <option value="Medium">🟡 Medium Priority</option>
                            <option value="High">🟠 High Priority</option>
                            <option value="Critical">🔴 Critical Priority</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-base font-semibold text-gray-800 mb-3">
                            Issue Category
                          </label>
                          <select
                            value={ticketForm.category}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-800 text-base transition-all duration-300 hover:border-gray-400"
                          >
                            <option value="Hardware">💻 Hardware Issue</option>
                            <option value="Software">🖥️ Software Problem</option>
                            <option value="Network">🌐 Network Issue</option>
                            <option value="Account">👤 Account Access</option>
                            <option value="Other">❓ Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Asset Selection */}
                      <div>
                        <label className="block text-base font-semibold text-gray-800 mb-3">
                          Related Asset *
                        </label>
                        <select
                          value={ticketForm.assetId}
                          onChange={(e) => setTicketForm(prev => ({ ...prev, assetId: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-800 text-base transition-all duration-300 hover:border-gray-400"
                          required
                        >
                          <option value="">Select an asset from your inventory</option>
                          {activeTab === "hardware" 
                            ? hardware.map(asset => (
                                <option key={asset._id} value={asset._id}>
                                  💻 {asset.system?.hostname || asset.system?.mac_address || ""}
                                </option>
                              ))
                            : software.map(asset => (
                                <option key={asset._id} value={asset._id}>
                                  🖥️ {asset.system?.hostname || asset.system?.mac_address || ""}
                                </option>
                              ))
                          }
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleCloseTicketModal}
                          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all duration-300 font-medium text-base hover:scale-105"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={ticketLoading}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-base hover:scale-105 shadow-lg"
                        >
                          {ticketLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              Creating Ticket...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Ticket className="h-4 w-4 mr-2" />
                              Create Ticket
                            </div>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
