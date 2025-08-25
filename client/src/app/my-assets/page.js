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
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "Hardware",
    assetId: "",
  });
  const [ticketLoading, setTicketLoading] = useState(false);

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
      const hardwareData = response.data.data || [];
      setHardware(hardwareData);
      
      // Debug: Log warranty information for troubleshooting
      if (hardwareData.length > 0) {
        console.log("Hardware data sample:", hardwareData[0]);
        console.log("Warranty fields available:", hardwareData.map(item => ({
          id: item._id,
          hostname: item.system?.hostname,
          warranty: item.asset_info?.warranty_expiry,
          hasAssetInfo: !!item.asset_info
        })));
      }
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
  }, [searchTerm, filterType, activeTab]);

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
    const data = activeTab === "hardware" ? hardware : software;
    const filename = `my_${activeTab}_assets_${new Date().toISOString().split('T')[0]}`;
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
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      My Assets
                    </h1>
                  </div>
                  <p className="text-gray-600">
                    View and manage your assigned IT hardware and software assets
                  </p>
                </div>
                
                <button
                  onClick={handleOpenTicketModal}
                  disabled={hardware.length === 0 && software.length === 0}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Hardware Devices</p>
                    <p className="text-2xl font-bold text-blue-900">{hardware.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Software Systems</p>
                    <p className="text-2xl font-bold text-green-900">{software.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-1 px-4" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("hardware")}
                    className={`py-3 px-3 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                      activeTab === "hardware"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Monitor className="h-4 w-4 inline mr-2" />
                    Hardware ({hardware.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("software")}
                    className={`py-3 px-3 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                      activeTab === "software"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Package className="h-4 w-4 inline mr-2" />
                    Software ({software.length})
                  </button>
                </nav>
              </div>

              {/* Search and Filter Bar */}
              <div className="bg-white rounded border border-gray-200 p-3">
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
                        activeTab === "hardware"
                          ? "Search hardware assets..."
                          : "Search software systems..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className={`w-full pl-7 pr-24 py-1.5 border rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 transition-colors ${
                        searchTerm ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white'
                      }`}
                    />
                    <button
                      onClick={handleSearch}
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
                    <div className="relative">
                      <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="pl-7 pr-5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 bg-white"
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
                      className="flex items-center px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-1 focus:ring-gray-400 disabled:opacity-50 text-sm"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 mr-1 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </button>

                    <button
                      onClick={handleExport}
                      disabled={loading || (activeTab === "hardware" ? hardware.length === 0 : software.length === 0)}
                      className="flex items-center px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 focus:ring-1 focus:ring-green-400 disabled:opacity-50 text-sm"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
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
                    {hardware.map((item) => (
                      <div key={item._id} className="relative">
                        <HardwareCard
                          hardware={item}
                          onClick={setSelectedHardware}
                        />
                        
                        {/* Asset Status Badge */}
                        <div className="absolute top-2 right-2 flex space-x-2">
                          {item.status === "Active" ? (
                            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Active
                            </div>
                          ) : (
                            <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              {item.status || "Unknown"}
                            </div>
                          )}
                          
                          {/* Warranty Warning */}
                          {item.asset_info?.warranty_expiry ? (() => {
                            const expiryDate = new Date(item.asset_info.warranty_expiry);
                            const now = new Date();
                            const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                            
                            if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                              return (
                                <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                                  Warranty: {daysUntilExpiry}d
                                </div>
                              );
                            } else if (daysUntilExpiry <= 0) {
                              return (
                                <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                  Warranty Expired
                                </div>
                              );
                            } else {
                              return (
                                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  Warranty: {daysUntilExpiry}d
                                </div>
                              );
                            }
                          })() : (
                            <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              No Warranty Info
                            </div>
                          )}
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="absolute bottom-2 right-2">
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
                    {software.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border cursor-pointer"
                        onClick={() => setSelectedSoftware(item)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-white" />
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

                        {/* Quick Action Button */}
                        <div className="absolute bottom-2 right-2">
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
                Showing {activeTab === "hardware" ? hardware.length : software.length} {activeTab === "hardware" ? "hardware assets" : "software systems"} assigned to you
                
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
                className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
                onClick={handleCloseTicketModal}
              >
                <div 
                  className="relative top-20 mx-auto p-5 border w-96 shadow-2xl rounded-lg bg-white/95 backdrop-blur-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Create Support Ticket
                      </h3>
                      <button
                        onClick={handleCloseTicketModal}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={ticketForm.title}
                          onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500"
                          placeholder="Brief description of the issue"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                          Description *
                        </label>
                        <textarea
                          value={ticketForm.description}
                          onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500"
                          placeholder="Detailed description of the problem"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-1">
                            Priority
                          </label>
                          <select
                            value={ticketForm.priority}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-1">
                            Category
                          </label>
                          <select
                            value={ticketForm.category}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                          >
                            <option value="Hardware">Hardware</option>
                            <option value="Software">Software</option>
                            <option value="Network">Network</option>
                            <option value="Account">Account</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                          Related Asset *
                        </label>
                        <select
                          value={ticketForm.assetId}
                          onChange={(e) => setTicketForm(prev => ({ ...prev, assetId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                          required
                        >
                          <option value="">Select an asset</option>
                          {activeTab === "hardware" 
                            ? hardware.map(asset => (
                                <option key={asset._id} value={asset._id}>
                                  {asset.system?.hostname || asset.system?.mac_address || "Unknown Device"}
                                </option>
                              ))
                            : software.map(asset => (
                                <option key={asset._id} value={asset._id}>
                                  {asset.system?.hostname || asset.system?.mac_address || "Unknown System"}
                                </option>
                              ))
                          }
                        </select>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={handleCloseTicketModal}
                          className="px-4 py-2 text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={ticketLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {ticketLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </div>
                          ) : (
                            "Create Ticket"
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
