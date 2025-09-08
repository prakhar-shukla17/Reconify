import React, { useState, useEffect, useMemo } from "react";
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
import {
  Search,
  Filter,
  Edit,
  MapPin,
  User,
  Calendar,
  Monitor,
  HardDrive,
  Cpu,
  MemoryStick,
  Building,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
<<<<<<< HEAD
=======
=======
import { 
  Search, 
  Filter, 
  ChevronDown,
  ChevronUp,
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
  Home,
  Box,
  CheckCircle,
  Scan,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  X,
  Save,
  Users,
  Settings,
<<<<<<< HEAD
=======
  Edit
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
} from "lucide-react";
import { hardwareAPI, softwareAPI } from "../lib/api";
import toast from "react-hot-toast";

const AssetsManagement = ({ users }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [sortBy, setSortBy] = useState("assetName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("home");
  
  // Filter states
  const [filters, setFilters] = useState({
    category: "",
    subCategory: "",
    status: "",
    assignedTo: "",
    assetType: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    subCategories: [],
    statuses: [],
    assetTypes: [],
    assignedUsers: []
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    selectedUser: "",
    assignmentDate: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [bulkActionType, setBulkActionType] = useState("");
  const [editingAsset, setEditingAsset] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [editForm, setEditForm] = useState({
    assetName: "",
    tagId: "",
    category: "",
    subCategory: "",
    status: "",
    purchaseDate: "",
    assetLocation: "",
    assignedTo: "",
    notes: ""
  });

  // Generate sequential tag ID (will be replaced by backend)
  const generateSequentialTagId = () => {
    const prefix = "TAG";
    // This will be replaced by backend-generated sequential IDs
    const randomNumber = Math.floor(Math.random() * 900000) + 100000; // 6-digit number
    return `${prefix}-${randomNumber}`;
  };

  // Fetch real hardware assets from API
  const fetchAllAssets = async () => {
    try {
      setLoading(true);
<<<<<<< HEAD
      console.log("Fetching hardware assets with filters:", {
        searchTerm,
        filters
      });
=======
<<<<<<< HEAD
      const [hardwareResponse, softwareResponse] = await Promise.all([
        hardwareAPI.getAll(),
        softwareAPI.getAll(),
      ]);

      const hardwareAssets = (hardwareResponse.data || []).map((asset) => ({
        ...asset,
        type: "hardware",
        id: asset._id || asset.id,
      }));

      const softwareAssets = (softwareResponse.data || []).map((asset) => ({
        ...asset,
        type: "software",
        id: asset._id || asset.id,
      }));

      setAssets([...hardwareAssets, ...softwareAssets]);
=======
      console.log("Fetching hardware assets...");
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
      
      const response = await hardwareAPI.getAll({ 
        page: 1, 
        limit: 1000,
        search: searchTerm || undefined,
        category: filters.category || undefined,
        subCategory: filters.subCategory || undefined,
        status: filters.status || undefined,
        assignedTo: filters.assignedTo || undefined,
        assetType: filters.assetType || undefined
      });

      console.log("Hardware response:", response);

      // Handle different response structures
      const hardwareData = response.data?.data || response.data || [];

      // Transform hardware data to match our table structure
      const transformedAssets = (hardwareData || []).map(asset => ({
        id: asset._id || asset.id,
        assetName: asset.system?.hostname || asset.hostname || "Unknown Device",
        tagId: asset.asset_info?.asset_tag || generateSequentialTagId(), // Use asset_tag or generate new one
        category: "Hardware",
        subCategory: getSubCategory(asset),
        assetType: getAssetType(asset),
        status: getAssetStatus(asset),
        purchaseDate: formatDate(asset.asset_info?.purchase_date || asset.purchaseDate),
        assetLocation: asset.asset_info?.location || asset.location || "",
        assignedTo: asset.assignedTo || asset.assigned_to || asset.asset_info?.assigned_to || ""
      }));

      console.log("Transformed assets:", transformedAssets);
      setAssets(transformedAssets);
      console.log("Total hardware assets loaded:", transformedAssets.length);
<<<<<<< HEAD
=======
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
    } catch (error) {
      console.error("Error fetching hardware assets:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error("Failed to load hardware assets");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine sub category
  const getSubCategory = (asset) => {
    const model = asset.system?.model || asset.model || "";
    const platform = asset.system?.platform || asset.platform || "";
    
    if (model.toLowerCase().includes("laptop") || model.toLowerCase().includes("notebook")) {
      return "Laptop";
    } else if (model.toLowerCase().includes("server")) {
      return "Server";
    } else if (platform.toLowerCase().includes("mobile") || platform.toLowerCase().includes("android") || platform.toLowerCase().includes("ios")) {
      return "Mobile";
    } else {
      return "Desktop";
    }
  };

  // Helper function to determine asset type
  const getAssetType = (asset) => {
    // You can customize this logic based on your business rules
    if (asset.asset_info?.vendor?.toLowerCase().includes("rental")) {
      return "Rental";
    } else {
      return "SPE Internal";
    }
  };

  // Helper function to determine asset status
  const getAssetStatus = (asset) => {
    // Check if asset is assigned to someone
    if (asset.assignedTo || asset.assigned_to) {
      return "Assigned";
    } else {
      return "Available";
    }
  };

  // Helper function to format dates in DD/MM/YYYY format
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      // Format as DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return "";
    }
  };

  // Helper function to convert DD/MM/YYYY to YYYY-MM-DD for date inputs
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      // Format as YYYY-MM-DD for HTML date inputs
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      return "";
    }
  };

  // Helper function to get assigned user name
  const getAssignedUserName = (assignedTo) => {
    if (!assignedTo) return "Unassigned";
    try {
      const user = users?.find((u) => u.id === assignedTo || u._id === assignedTo);
      return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
    } catch (error) {
      console.error("Error getting assigned user name:", error);
      return "Unknown User";
    }
  };

  useEffect(() => {
    fetchAllAssets();
  }, [searchTerm, filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = assets.filter((asset) => {
      // Search filter
<<<<<<< HEAD
=======
<<<<<<< HEAD
      const matchesSearch =
        !searchTerm ||
        asset.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.macAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = filterType === "all" || asset.type === filterType;

      // Status filter
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "assigned" && asset.assignedTo) ||
        (filterStatus === "unassigned" && !asset.assignedTo);

      return matchesSearch && matchesType && matchesStatus;
=======
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
      const matchesSearch = !searchTerm || 
        asset.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.tagId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.subCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAssignedUserName(asset.assignedTo)?.toLowerCase().includes(searchTerm.toLowerCase());

<<<<<<< HEAD
      // Category filter
      const matchesCategory = !filters.category || asset.category === filters.category;
      
      // Sub Category filter
      const matchesSubCategory = !filters.subCategory || asset.subCategory === filters.subCategory;
      
      // Status filter
      const matchesStatus = !filters.status || asset.status === filters.status;
      
      // Assigned To filter
      const matchesAssignedTo = !filters.assignedTo || 
        (filters.assignedTo === "unassigned" && !asset.assignedTo) ||
        (filters.assignedTo !== "unassigned" && asset.assignedTo === filters.assignedTo);
      
      // Asset Type filter
      const matchesAssetType = !filters.assetType || asset.assetType === filters.assetType;

      return matchesSearch && matchesCategory && matchesSubCategory && matchesStatus && matchesAssignedTo && matchesAssetType;
=======
      return matchesSearch;
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
    });

    // Sort assets
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "assetName":
          aValue = a.assetName || "";
          bValue = b.assetName || "";
          break;
        case "tagId":
          aValue = a.tagId || "";
          bValue = b.tagId || "";
          break;
        case "category":
          aValue = a.category || "";
          bValue = b.category || "";
          break;
        case "subCategory":
          aValue = a.subCategory || "";
          bValue = b.subCategory || "";
          break;
                 case "assignedTo":
           aValue = getAssignedUserName(a.assignedTo) || "";
           bValue = getAssignedUserName(b.assignedTo) || "";
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "purchaseDate":
          aValue = a.purchaseDate || "";
          bValue = b.purchaseDate || "";
          break;
        case "assetLocation":
          aValue = a.assetLocation || "";
          bValue = b.assetLocation || "";
          break;
        default:
          aValue = a.assetName || "";
          bValue = b.assetName || "";
      }

      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [assets, searchTerm, sortBy, sortOrder, filters]);

<<<<<<< HEAD
=======
<<<<<<< HEAD
  // Handle asset edit
  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setEditForm({
      hostname: asset.hostname || "",
      location: asset.location || "",
      assignedTo: asset.assignedTo || "",
      notes: asset.notes || "",
      warrantyExpiry: asset.warrantyExpiry || "",
      purchaseDate: asset.purchaseDate || "",
      purchasePrice: asset.purchasePrice || "",
      vendor: asset.vendor || "",
      model: asset.model || "",
      serialNumber: asset.serialNumber || "",
    });
=======
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAndSortedAssets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder, filters]);

  // Handle asset selection
  const handleAssetSelect = (assetId) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
<<<<<<< HEAD
=======
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
  };

  // Handle select all assets
  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAndSortedAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAndSortedAssets.map(asset => asset.id));
    }
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    try {
      console.log("Filter change:", filterType, value);
      setFilters(prev => ({
        ...prev,
        [filterType]: value
      }));
    } catch (error) {
      console.error("Error changing filter:", error);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    try {
      console.log("Clearing all filters");
      setFilters({
        category: "",
        subCategory: "",
        status: "",
        assignedTo: "",
        assetType: ""
      });
    } catch (error) {
      console.error("Error clearing filters:", error);
    }
  };

  // Fetch filter options from backend
  const fetchFilterOptions = async () => {
    try {
      setFilterOptionsLoading(true);
      console.log("Fetching filter options...");
      const response = await hardwareAPI.getFilterOptions();
      console.log("Filter options response:", response);
      
      if (response.data?.success) {
        setFilterOptions(response.data.data);
        console.log("Filter options set:", response.data.data);
      } else {
        console.warn("Filter options response not successful:", response.data);
        // Fallback to local options
        setFilterOptions(getFallbackFilterOptions());
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
      // Fallback to local options on error
      setFilterOptions(getFallbackFilterOptions());
    } finally {
      setFilterOptionsLoading(false);
    }
  };

  // Get unique values for filter options (fallback)
  const getUniqueValues = (field) => {
    try {
      const values = assets.map(asset => asset[field]).filter(Boolean);
      return [...new Set(values)].sort();
    } catch (error) {
      console.error("Error getting unique values:", error);
      return [];
    }
  };

  // Fallback filter options when backend fails
  const getFallbackFilterOptions = () => ({
    categories: getUniqueValues('category'),
    subCategories: getUniqueValues('subCategory'),
    statuses: ['Available', 'Assigned', 'Maintenance', 'Retired'],
    assetTypes: getUniqueValues('assetType'),
    assignedUsers: []
  });

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => value !== "").length;

  // Assignment functions
  const handleAssignAssets = () => {
    if (selectedAssets.length === 0) {
      toast.error("Please select assets to assign");
      return;
    }
    setShowAssignmentModal(true);
  };

  const handleBulkAction = async (actionType) => {
    if (selectedAssets.length === 0) {
      toast.error("Please select assets first");
      return;
    }

    try {
<<<<<<< HEAD
=======
<<<<<<< HEAD
      const updateData = {
        ...editForm,
        id: editingAsset.id,
      };

      if (editingAsset.type === "hardware") {
        await hardwareAPI.update(editingAsset.id, updateData);
      } else {
        await softwareAPI.update(editingAsset.id, updateData);
      }

      // Update local state
      setAssets((prev) =>
        prev.map((asset) =>
          asset.id === editingAsset.id ? { ...asset, ...updateData } : asset
        )
      );

      setEditingAsset(null);
      setEditForm({});
      toast.success("Asset updated successfully");
=======
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
      switch (actionType) {
        case "assign":
          handleAssignAssets();
          break;
        case "unassign":
          await handleUnassignAssets();
          break;
        case "update":
          // Handle bulk update
          toast.success(`Bulk update completed for ${selectedAssets.length} assets`);
          break;
        case "export":
          // Handle bulk export
          toast.success(`Exported ${selectedAssets.length} assets`);
          break;
        default:
          break;
      }
<<<<<<< HEAD
=======
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Failed to perform bulk action");
    }
  };

<<<<<<< HEAD
  const handleUnassignAssets = async () => {
    try {
      // Update each selected asset to remove assignment
      const updatePromises = selectedAssets.map(assetId => {
        const updateData = {
          assignedTo: "",
          assigned_to: "",
          asset_info: {
            assignment_date: null,
            assignment_notes: null
          }
        };
        return hardwareAPI.update(assetId, updateData);
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      toast.success(`Unassigned ${selectedAssets.length} assets`);
      setSelectedAssets([]);
      // Refresh the data
      await fetchAllAssets();
    } catch (error) {
      console.error("Error unassigning assets:", error);
      toast.error("Failed to unassign assets");
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignmentForm.selectedUser) {
      toast.error("Please select a user");
      return;
    }

    try {
      // Update each selected asset with the assignment information
      const updatePromises = selectedAssets.map(assetId => {
      const updateData = {
          assignedTo: assignmentForm.selectedUser,
          assigned_to: assignmentForm.selectedUser,
          asset_info: {
            assignment_date: assignmentForm.assignmentDate,
            assignment_notes: assignmentForm.notes
          }
        };
        return hardwareAPI.update(assetId, updateData);
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      toast.success(`Assigned ${selectedAssets.length} assets to user`);
      setSelectedAssets([]);
      setShowAssignmentModal(false);
      setAssignmentForm({
        selectedUser: "",
        assignmentDate: new Date().toISOString().split('T')[0],
        notes: ""
      });
      // Refresh the data
      await fetchAllAssets();
    } catch (error) {
      console.error("Error assigning assets:", error);
      toast.error("Failed to assign assets");
    }
  };

  // Handle individual asset edit
  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setEditForm({
      assetName: asset.assetName || "",
      tagId: asset.tagId || "",
      category: asset.category || "",
      subCategory: asset.subCategory || "",
      status: asset.status || "",
      purchaseDate: formatDateForInput(asset.purchaseDate) || "",
      assetLocation: asset.assetLocation || "",
      assignedTo: asset.assignedTo || "",
      notes: asset.notes || ""
    });
    setShowEditModal(true);
  };

  // Handle save individual asset edit
  const handleSaveEdit = async () => {
    if (!editingAsset) return;

    try {
      // Prepare the update data
      const updateData = {
        system: {
          hostname: editForm.assetName
        },
        status: editForm.status,
        assignedTo: editForm.assignedTo,
        assigned_to: editForm.assignedTo,
        asset_info: {
          purchase_date: editForm.purchaseDate,
          location: editForm.assetLocation,
          category: editForm.category,
          sub_category: editForm.subCategory,
          notes: editForm.notes,
          asset_tag: editForm.tagId  // Use Tag ID in asset_tag
        }
      };

      // Make API call to update the asset
      await hardwareAPI.update(editingAsset.id, updateData);
      toast.success("Asset updated successfully");
      setShowEditModal(false);
      setEditingAsset(null);
      setEditForm({
        assetName: "",
        tagId: "",
        category: "",
        subCategory: "",
        status: "",
        purchaseDate: "",
        assetLocation: "",
        assignedTo: "",
        notes: ""
      });
      // Refresh the data
      await fetchAllAssets();
    } catch (error) {
      console.error("Error updating asset:", error);
      toast.error("Failed to update asset");
    }
  };

=======
<<<<<<< HEAD
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
  // Get user name by ID
  const getUserName = (userId) => {
    if (!userId) return "Unassigned";
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  // Get asset icon
  const getAssetIcon = (asset) => {
    if (asset.type === "software") {
      return <Package className="h-5 w-5" />;
    }

    // Hardware icons based on component
    if (asset.cpu) return <Cpu className="h-5 w-5" />;
    if (asset.memory) return <MemoryStick className="h-5 w-5" />;
    if (asset.storage) return <HardDrive className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
<<<<<<< HEAD
=======
=======
  const handleUnassignAssets = async () => {
    try {
      // Here you would call your API to unassign assets
      // For now, just show success message
      toast.success(`Unassigned ${selectedAssets.length} assets`);
      setSelectedAssets([]);
      // Refresh the data
      fetchAllAssets();
    } catch (error) {
      console.error("Error unassigning assets:", error);
      toast.error("Failed to unassign assets");
    }
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
  };

  // Handle inline field editing
  const handleStartEdit = (assetId, field, currentValue) => {
    setEditingField(`${assetId}-${field}`);
    setEditingValue(currentValue || "");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditingValue("");
>>>>>>> dinesh
  };

  const handleSaveField = async (assetId, field) => {
    if (!editingValue && field !== 'assignedTo') {
      toast.error("Value cannot be empty");
      return;
    }

    try {
      setSavingField(true);
      
      // Find the asset to get its current data
      const currentAsset = assets.find(asset => asset.id === assetId);
      if (!currentAsset) {
        toast.error("Asset not found");
        return;
      }

      // Prepare the update data based on the field being edited
      let updateData = {};
      
      switch (field) {
        case 'assignedTo':
          updateData = {
            assignedTo: editingValue || "",
            assigned_to: editingValue || ""
          };
          break;
        case 'status':
          updateData = {
            status: editingValue
          };
          break;
        case 'purchaseDate':
          updateData = {
            asset_info: {
              purchase_date: editingValue
            }
          };
          break;
        case 'assetLocation':
          updateData = {
            asset_info: {
              location: editingValue
            }
          };
          break;
        case 'tagId':
          updateData = {
            asset_info: {
              asset_tag: editingValue
            }
          };
          break;
        default:
          toast.error("Unknown field to update");
          return;
      }

      console.log("Frontend - Updating asset:", assetId, "with data:", updateData);
      
      // Make API call to update the asset
      await hardwareAPI.update(assetId, updateData);
      
      toast.success(`${field} updated successfully`);
      
      // Update local state
      setAssets(prevAssets => 
        prevAssets.map(asset => 
          asset.id === assetId 
            ? { ...asset, [field]: editingValue }
            : asset
        )
      );
      
      setEditingField(null);
      setEditingValue("");
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error("Failed to update field");
    } finally {
      setSavingField(false);
    }
<<<<<<< HEAD
=======
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
  };

  // Navigation tabs
  const navigationTabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "assign", label: "Assign", icon: Box },
    { id: "return", label: "Return", icon: Box },
    { id: "bulk", label: "Bulk", icon: Box },
    { id: "request", label: "Request", icon: CheckCircle },
    { id: "scanner", label: "Scanner", icon: Scan }
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
=======
<<<<<<< HEAD
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Assets Management
        </h1>
        <p className="text-gray-600">
          Manage all hardware and software assets in your organization
        </p>
      </div>
=======
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-8">
<<<<<<< HEAD
            <h1 className="text-2xl font-bold text-gray-900">Assets Management</h1>
        </h1>
        <p className="text-gray-600">
          Manage all hardware and software assets in your organization
        </p>
      </div>
=======
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              return (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
              </button>
              );
            })}
                </div>
                </div>
            </div>
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="hostname-asc">Name (A-Z)</option>
            <option value="hostname-desc">Name (Z-A)</option>
            <option value="type-asc">Type (A-Z)</option>
            <option value="type-desc">Type (Z-A)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="status-desc">Status (Z-A)</option>
            <option value="location-asc">Location (A-Z)</option>
            <option value="location-desc">Location (Z-A)</option>
          </select>
        </div>

        {/* Results count */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedAssets.length} of {assets.length} assets
          </p>
          <button
            onClick={fetchAllAssets}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Assets List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredAndSortedAssets.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No assets found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                      {getAssetIcon(asset)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {asset.hostname || "Unknown Device"}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Package className="h-4 w-4" />
                          <span className="capitalize">{asset.type}</span>
                        </span>
                        {asset.macAddress && (
                          <span className="font-mono">{asset.macAddress}</span>
                        )}
                        {asset.location && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{asset.location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        asset
                      )}`}
                    >
                      {asset.assignedTo ? "Assigned" : "Unassigned"}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedAsset(
                          expandedAsset === asset.id ? null : asset.id
                        )
                      }
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedAsset === asset.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditAsset(asset)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
<<<<<<< HEAD
=======
=======
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {loading ? "Loading..." : `${filteredAndSortedAssets.length} assets found`}
            </div>
            <button
              onClick={fetchAllAssets}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === "home" && (
          <>
            {/* Home View - Current Asset Management Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-9 gap-4 px-6 py-4 text-sm font-medium text-gray-700">
                  {/* Action Column */}
                  <div className="flex items-center space-x-2">
                    <Box className="h-4 w-4" />
                    <span>Action</span>
                  </div>

                  {/* Asset Name Column */}
                  <div className="flex items-center space-x-2">
                    <span>Asset Name</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetName" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetName")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetName" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetName")}
                      />
                    </div>
                    <Filter className="h-4 w-4 text-gray-400 cursor-pointer" />
        </div>

                  {/* Tag ID Column */}
              <div className="flex items-center space-x-2">
                    <span>Tag ID</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "tagId" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("tagId")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "tagId" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("tagId")}
                      />
              </div>
                    <Filter className="h-4 w-4 text-gray-400 cursor-pointer" />
          </div>
          
                  {/* Category Column */}
              <div className="flex items-center space-x-2">
                    <span>Category</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "category" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("category")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "category" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("category")}
                      />
              </div>
                    <Filter className="h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>
                  
                  {/* Sub Category Column */}
                  <div className="flex items-center space-x-2">
                    <span>Sub Category</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "subCategory" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("subCategory")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "subCategory" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("subCategory")}
                      />
          </div>
                    <Filter className="h-4 w-4 text-gray-400 cursor-pointer" />
        </div>
                  
                  {/* Asset Type Column */}
                  <div className="flex items-center space-x-2">
                    <span>Asset Type</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetType" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetType")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetType" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetType")}
                      />
                    </div>
                    <Filter className="h-4 w-4 text-gray-400 cursor-pointer" />
      </div>

                  {/* Status Column */}
                  <div className="flex items-center space-x-2">
                    <span>Status</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "status" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("status")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "status" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("status")}
                      />
          </div>
                    <Filter className="h-4 w-4 text-gray-400 cursor-pointer" />
              </div>
                  
                  {/* Purchase Date Column */}
                  <div className="flex items-center space-x-2">
                    <span>Purchase Date</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "purchaseDate" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("purchaseDate")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "purchaseDate" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("purchaseDate")}
                      />
                    </div>
                    <Filter className="h-4 w-4 text-gray-400 cursor-pointer" />
            </div>

                  {/* Asset Location Column */}
                  <div className="flex items-center space-x-2">
                    <span>Asset Location</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetLocation" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetLocation")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetLocation" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetLocation")}
                      />
                    </div>
                    <Filter className="h-4 w-4 text-gray-400 cursor-pointer" />
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                  </div>
=======
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-8">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              return (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-800 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
              </button>
              );
            })}
>>>>>>> dinesh
                </div>
                </div>
            </div>

<<<<<<< HEAD
                {/* Expanded Details */}
                {expandedAsset === asset.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Basic Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="capitalize">{asset.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Model:</span>
                            <span>{asset.model || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Serial:</span>
                            <span>{asset.serialNumber || "N/A"}</span>
                          </div>
                        </div>
<<<<<<< HEAD
=======
=======
              {/* Table Body */}
              <div className="divide-y divide-gray-200">
            {paginatedAssets.map((asset) => (
                  <div key={asset.id} className="grid grid-cols-9 gap-4 px-6 py-4 text-sm hover:bg-gray-50">
                    {/* Action Column */}
                    <div className="flex items-center">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Box className="h-4 w-4 text-gray-600" />
                    </button>
                    </div>
                    
                    {/* Asset Name Column */}
                    <div className="flex items-center">
                      <span className="text-gray-900">{asset.assetName}</span>
                    </div>

                    {/* Tag ID Column */}
                    <div className="flex items-center">
                      <span className="text-gray-900 font-mono text-sm">{asset.tagId}</span>
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                      </div>

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Assignment
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Assigned to:</span>
                            <span>{getUserName(asset.assignedTo)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span>{asset.location || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Purchase Info
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vendor:</span>
                            <span>{asset.vendor || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Price:</span>
                            <span>{asset.purchasePrice || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span>{asset.purchaseDate || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {asset.notes && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Notes
                        </h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {asset.notes}
                        </p>
                      </div>
                    )}
<<<<<<< HEAD
                  </div>
                )}
=======
      {/* Search Bar and Filters */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-900">
              {loading ? "Loading..." : `${filteredAndSortedAssets.length} assets found`}
            </div>
            <button
              onClick={fetchAllAssets}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                console.log("Filter button clicked, current state:", { showFilters, activeFiltersCount });
                setShowFilters(!showFilters);
              }}
              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Category: {filters.category}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.subCategory && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Sub Category: {filters.subCategory}
                <button
                  onClick={() => handleFilterChange('subCategory', '')}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.assignedTo && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Assigned: {filters.assignedTo === 'unassigned' ? 'Unassigned' : getAssignedUserName(filters.assignedTo)}
                <button
                  onClick={() => handleFilterChange('assignedTo', '')}
                  className="ml-2 text-orange-600 hover:text-orange-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.assetType && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                Type: {filters.assetType}
                <button
                  onClick={() => handleFilterChange('assetType', '')}
                  className="ml-2 text-pink-600 hover:text-pink-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong>Debug Info:</strong> Filters: {JSON.stringify(filters)}, 
            Show Filters: {showFilters.toString()}, 
            Options Loading: {filterOptionsLoading.toString()},
            Options: {JSON.stringify(filterOptions)}
          </div>
        )}

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            {filterOptionsLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading filter options...</p>
>>>>>>> dinesh
              </div>
            )}
            {!filterOptionsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {filterOptions.categories?.map(category => (
                    <option key={category} value={category}>{category}</option>
                  )) || []}
                </select>
              </div>

              {/* Sub Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                <select
                  value={filters.subCategory}
                  onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Sub Categories</option>
                  {filterOptions.subCategories?.map(subCategory => (
                    <option key={subCategory} value={subCategory}>{subCategory}</option>
                  )) || []}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                  {filterOptions.statuses?.map(status => (
                    <option key={status} value={status}>{status}</option>
                  )) || []}
                </select>
              </div>

              {/* Assigned To Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Users</option>
                  <option value="unassigned">Unassigned</option>
                  {users?.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                  {filterOptions.assignedUsers?.map(userId => {
                    const user = users?.find(u => u.id === userId || u._id === userId);
                    return user ? (
                      <option key={userId} value={userId}>
                        {user.firstName} {user.lastName}
                      </option>
                    ) : null;
                  }) || []}
                </select>
              </div>

              {/* Asset Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                <select
                  value={filters.assetType}
                  onChange={(e) => handleFilterChange('assetType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {filterOptions.assetTypes?.map(assetType => (
                    <option key={assetType} value={assetType}>{assetType}</option>
                  )) || []}
                </select>
              </div>
            </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === "home" && (
          <>
            {/* Home View - Current Asset Management Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-9 gap-4 px-6 py-4 text-sm font-medium text-gray-900">
                  {/* Action Column */}
                  <div className="flex items-center space-x-2">
                    <Box className="h-4 w-4" />
                    <span>Action</span>
                  </div>

                  {/* Asset Name Column */}
                  <div className="flex items-center space-x-2">
                    <span>Asset Name</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetName" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetName")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetName" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetName")}
                      />
                    </div>
                    <Filter 
                      className={`h-4 w-4 cursor-pointer ${
                        searchTerm ? "text-blue-600" : "text-gray-400"
                      }`}
                      onClick={() => setShowFilters(!showFilters)}
                    />
        </div>

                  {/* Tag ID Column */}
              <div className="flex items-center space-x-2">
                    <span>Tag ID</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "tagId" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("tagId")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "tagId" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("tagId")}
                      />
              </div>
                    <Filter 
                      className={`h-4 w-4 cursor-pointer ${
                        searchTerm ? "text-blue-600" : "text-gray-400"
                      }`}
                      onClick={() => setShowFilters(!showFilters)}
                    />
          </div>
          
                  {/* Category Column */}
              <div className="flex items-center space-x-2">
                    <span>Category</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "category" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("category")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "category" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("category")}
                      />
              </div>
                    <Filter 
                      className={`h-4 w-4 cursor-pointer ${
                        filters.category ? "text-blue-600" : "text-gray-400"
                      }`}
                      onClick={() => setShowFilters(!showFilters)}
                    />
                  </div>
                  
                  {/* Sub Category Column */}
                  <div className="flex items-center space-x-2">
                    <span>Sub Category</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "subCategory" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("subCategory")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "subCategory" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("subCategory")}
                      />
          </div>
                    <Filter 
                      className={`h-4 w-4 cursor-pointer ${
                        filters.subCategory ? "text-blue-600" : "text-gray-400"
                      }`}
                      onClick={() => setShowFilters(!showFilters)}
                    />
        </div>
                  
                  {/* Asset Type Column */}
                  <div className="flex items-center space-x-2">
                    <span>Asset Type</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetType" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetType")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetType" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetType")}
                      />
                    </div>
                    <Filter 
                      className={`h-4 w-4 cursor-pointer ${
                        filters.assetType ? "text-blue-600" : "text-gray-400"
                      }`}
                      onClick={() => setShowFilters(!showFilters)}
                    />
      </div>

                  {/* Status Column */}
                  <div className="flex items-center space-x-2">
                    <span>Status</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "status" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("status")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "status" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("status")}
                      />
          </div>
                    <Filter 
                      className={`h-4 w-4 cursor-pointer ${
                        filters.status ? "text-blue-600" : "text-gray-400"
                      }`}
                      onClick={() => setShowFilters(!showFilters)}
                    />
              </div>
                  
                  {/* Purchase Date Column */}
                  <div className="flex items-center space-x-2">
                    <span>Purchase Date</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "purchaseDate" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("purchaseDate")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "purchaseDate" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("purchaseDate")}
                      />
                    </div>
                    <Filter 
                      className={`h-4 w-4 cursor-pointer ${
                        searchTerm ? "text-blue-600" : "text-gray-400"
                      }`}
                      onClick={() => setShowFilters(!showFilters)}
                    />
            </div>

                  {/* Asset Location Column */}
                  <div className="flex items-center space-x-2">
                    <span>Asset Location</span>
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetLocation" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetLocation")}
                      />
                      <ChevronDown 
                        className={`h-3 w-3 cursor-pointer ${
                          sortBy === "assetLocation" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                        }`}
                        onClick={() => handleSort("assetLocation")}
                      />
                    </div>
                    <Filter 
                      className={`h-4 w-4 cursor-pointer ${
                        searchTerm ? "text-blue-600" : "text-gray-400"
                      }`}
                      onClick={() => setShowFilters(!showFilters)}
                    />
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
            {paginatedAssets.map((asset) => (
                  <div key={asset.id} className="grid grid-cols-9 gap-4 px-6 py-4 text-sm hover:bg-gray-50">
                    {/* Action Column */}
                    <div className="flex items-center">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Box className="h-4 w-4 text-gray-800" />
              </button>
                    </div>
                    
                    {/* Asset Name Column */}
                    <div className="flex items-center">
                      <span className="text-gray-900">{asset.assetName}</span>
                    </div>

                    {/* Tag ID Column */}
                    <div className="flex items-center">
                      <span className="text-gray-900 font-mono text-sm">{asset.tagId}</span>
                      </div>
                      
                    {/* Category Column */}
                    <div className="flex items-center">
                      <span className="text-gray-900 cursor-pointer hover:text-blue-600">{asset.category}</span>
                    </div>
                    
                    {/* Sub Category Column */}
                    <div className="flex items-center">
                      <span className="text-gray-900">{asset.subCategory}</span>
                    </div>
                    
                                           {/* Assigned User Column */}
                       <div className="flex items-center">
                         <span className="text-gray-900">{getAssignedUserName(asset.assignedTo)}</span>
                         </div>

=======
=======
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                    {/* Status Column */}
                    <div className="flex items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          asset.status === "Available" ? "bg-green-500" : 
                          asset.status === "Assigned" ? "bg-blue-500" : 
                          "bg-gray-500"
                        }`}></div>
                        <span className="text-gray-900">{asset.status}</span>
                      </div>
                    </div>

                    {/* Purchase Date Column */}
                    <div className="flex items-center">
                      <span className="text-gray-900">{asset.purchaseDate}</span>
                    </div>

                    {/* Asset Location Column */}
                    <div className="flex items-center">
                      <span className="text-gray-900">{asset.assetLocation || ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
              <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                              </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                              <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-900 hover:text-gray-950'
                        }`}
                      >
                        {pageNum}
              </button>
                    );
                  })}
            </div>

            <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                  <ChevronRight className="h-4 w-4" />
            </button>
                    <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="h-4 w-4" />
            </button>
          </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-900">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedAssets.length)} of {filteredAndSortedAssets.length} Assign Assets
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-1 text-sm text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
        </div>
      </div>
          </>
        )}

        {activeTab === "assign" && (
          <>
            {/* Assign View - Asset Assignment and Updates */}
            <div className="space-y-6">
              {/* Assignment Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Asset Assignment</span>
                </h2>
                
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => handleBulkAction("assign")}
                    disabled={selectedAssets.length === 0}
                    className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <User className="h-6 w-6 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-blue-900">Assign Assets</div>
                      <div className="text-sm text-blue-600">Assign to user</div>
          </div>
                  </button>

                                <button
                    onClick={() => handleBulkAction("unassign")}
                    disabled={selectedAssets.length === 0}
                    className="flex items-center space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="h-6 w-6 text-orange-600" />
                    <div className="text-left">
                      <div className="font-medium text-orange-900">Unassign Assets</div>
                      <div className="text-sm text-orange-600">Remove assignment</div>
                    </div>
                                </button>

                                <button
                    onClick={() => handleBulkAction("update")}
                    disabled={selectedAssets.length === 0}
                    className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Edit className="h-6 w-6 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium text-green-900">Bulk Update</div>
                      <div className="text-sm text-green-600">Update multiple assets</div>
                    </div>
                                </button>

                  <button
                    onClick={() => handleBulkAction("export")}
                    disabled={selectedAssets.length === 0}
                    className="flex items-center space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FileText className="h-6 w-6 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium text-purple-900">Export Selected</div>
                      <div className="text-sm text-purple-600">Download data</div>
                              </div>
                  </button>
        </div>

            {selectedAssets.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-800">
                        {selectedAssets.length} asset(s) selected
                </span>
                <button
                  onClick={() => setSelectedAssets([])}
                        className="text-sm text-blue-600 hover:text-blue-800"
                >
                        Clear Selection
                </button>
                    </div>
              </div>
            )}
          </div>
          
              {/* Asset Selection Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">Select Assets for Assignment</h3>
                  <p className="text-sm text-gray-800 mt-1">Choose assets from the list below to assign or update</p>
                          </div>

                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-9 gap-4 px-6 py-4 text-sm font-medium text-gray-900">
                    {/* Selection Column */}
              <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedAssets.length === filteredAndSortedAssets.length && filteredAndSortedAssets.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>Select</span>
              </div>
                    
                    {/* Asset Name Column */}
                    <div className="flex items-center space-x-2">
                      <span>Asset Name</span>
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={`h-3 w-3 cursor-pointer ${
                            sortBy === "assetName" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                          }`}
                          onClick={() => handleSort("assetName")}
                        />
                        <ChevronDown 
                          className={`h-3 w-3 cursor-pointer ${
                            sortBy === "assetName" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                          }`}
                          onClick={() => handleSort("assetName")}
                        />
          </div>
                      </div>

                    {/* Tag ID Column */}
                    <div className="flex items-center space-x-2">
                      <span>Tag ID</span>
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={`h-3 w-3 cursor-pointer ${
                            sortBy === "tagId" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"
                          }`}
                          onClick={() => handleSort("tagId")}
                        />
                        <ChevronDown 
                          className={`h-3 w-3 cursor-pointer ${
                            sortBy === "tagId" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"
                          }`}
                          onClick={() => handleSort("tagId")}
                        />
        </div>
      </div>

                    {/* Category Column */}
                    <div className="flex items-center space-x-2">
                      <span>Category</span>
          </div>
                    
                    {/* Sub Category Column */}
                    <div className="flex items-center space-x-2">
                      <span>Sub Category</span>
              </div>
                    
                                         {/* Assigned User Column */}
                     <div className="flex items-center space-x-2">
                       <span>Assigned User</span>
            </div>

                     {/* Status Column */}
                    <div className="flex items-center space-x-2">
                      <span>Status</span>
                          </div>
                    
                    {/* Purchase Date Column */}
                    <div className="flex items-center space-x-2">
                      <span>Purchase Date</span>
                          </div>
                    
                    {/* Asset Location Column */}
                    <div className="flex items-center space-x-2">
                      <span>Asset Location</span>
                          </div>
                        </div>
                      </div>

                                                                 {/* Table Body */}
                 <div className="divide-y divide-gray-200">
            {paginatedAssets.map((asset) => (
                                          <div 
                       key={asset.id} 
                       className="grid grid-cols-9 gap-4 px-6 py-4 text-sm hover:bg-gray-50 group"
                     >
                       {/* Selection Column */}
                       <div className="flex items-center">
                                 <input
                           type="checkbox"
                           checked={selectedAssets.includes(asset.id)}
                           onChange={() => handleAssetSelect(asset.id)}
                           className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                         />
                               </div>
                      
                      {/* Asset Name Column */}
                      <div className="flex items-center">
                        <span className="text-gray-900">{asset.assetName}</span>
                    </div>

                      {/* Tag ID Column */}
                      <div className="flex items-center">
                        <span className="text-gray-900 font-mono text-sm">{asset.tagId}</span>
                      </div>
                      
                      {/* Category Column */}
                      <div className="flex items-center">
                        <span className="text-gray-900">{asset.category}</span>
                          </div>
                      
                      {/* Sub Category Column */}
                      <div className="flex items-center">
                        <span className="text-gray-900">{asset.subCategory}</span>
                        </div>
                      
                       {/* Assigned User Column */}
                       <div className="flex items-center">
                         {editingField === `${asset.id}-assignedTo` ? (
                           <div className="flex items-center space-x-2 w-full">
                             <select
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                               className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                             >
                               <option value="">Unassigned</option>
                               {users?.map(user => (
                                 <option key={user.id} value={user.id}>
                                   {user.firstName} {user.lastName}
                                 </option>
                               ))}
                             </select>
                              <button
                               onClick={() => handleSaveField(asset.id, 'assignedTo')}
                                disabled={savingField}
                                className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                              >
                               <Save className="h-4 w-4" />
                              </button>
                              <button
                               onClick={handleCancelEdit}
                                className="p-1 text-red-600 hover:text-red-800"
                              >
                               <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                           <div className="flex items-center space-x-2 w-full">
                             <span className="text-gray-900 flex-1">{getAssignedUserName(asset.assignedTo)}</span>
                              <button
                               onClick={() => handleStartEdit(asset.id, 'assignedTo', asset.assignedTo)}
                               className="p-1 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                               <Edit className="h-4 w-4" />
                              </button>
                            </div>
                         )}
                  </div>

                      {/* Status Column */}
                      <div className="flex items-center">
                        {editingField === `${asset.id}-status` ? (
                          <div className="flex items-center space-x-2 w-full">
                            <select
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              autoFocus
                            >
                              <option value="Available">Available</option>
                              <option value="Assigned">Assigned</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Retired">Retired</option>
                            </select>
                    <button
                              onClick={() => handleSaveField(asset.id, 'status')}
                              disabled={savingField}
                              className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                    </button>
                    <button
                              onClick={handleCancelEdit}
                              className="p-1 text-red-600 hover:text-red-800"
                    >
                              <X className="h-4 w-4" />
                    </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 w-full">
                            <div className={`w-2 h-2 rounded-full ${
                              asset.status === "Available" ? "bg-green-500" : 
                              asset.status === "Assigned" ? "bg-blue-500" : 
                              "bg-gray-500"
                            }`}></div>
                            <span className="text-gray-900 flex-1">{asset.status}</span>
                    <button
                              onClick={() => handleStartEdit(asset.id, 'status', asset.status)}
                              className="p-1 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit className="h-4 w-4" />
                    </button>
                  </div>
                        )}
                </div>

                      {/* Purchase Date Column */}
                      <div className="flex items-center">
                        {editingField === `${asset.id}-purchaseDate` ? (
                          <div className="flex items-center space-x-2 w-full">
                                <input
                              type="date"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  autoFocus
                                />
                                <button
                              onClick={() => handleSaveField(asset.id, 'purchaseDate')}
                                  disabled={savingField}
                                  className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                >
                              <Save className="h-4 w-4" />
                                </button>
                                <button
                              onClick={handleCancelEdit}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                              <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                          <div className="flex items-center space-x-2 w-full">
                            <span className="text-gray-900 flex-1">{asset.purchaseDate}</span>
                                <button
                              onClick={() => handleStartEdit(asset.id, 'purchaseDate', formatDateForInput(asset.purchaseDate))}
                              className="p-1 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                              <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                      </div>

                      {/* Asset Location Column */}
                      <div className="flex items-center">
<<<<<<< HEAD
                        {editingField === `${asset.id}-assetLocation` ? (
                          <div className="flex items-center space-x-2 w-full">
                                <input
                              type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Unknown"
                                  autoFocus
                                />
                                <button
                              onClick={() => handleSaveField(asset.id, 'assetLocation')}
                                  disabled={savingField}
                                  className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                >
                              <Save className="h-4 w-4" />
                                </button>
                                <button
                              onClick={handleCancelEdit}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                              <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                          <div className="flex items-center space-x-2 w-full">
                            <span className="text-gray-900 flex-1">{asset.assetLocation || ""}</span>
                                <button
                              onClick={() => handleStartEdit(asset.id, 'assetLocation', asset.assetLocation)}
                              className="p-1 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                              <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          </div>
=======
                        <span className="text-gray-900">{asset.assetLocation || ""}</span>
>>>>>>> dinesh
                  </div>
              </div>
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
            ))}
                      </div>
                    </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
              
                  {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded ${
                        currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-900 hover:text-gray-950'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-900">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedAssets.length)} of {filteredAndSortedAssets.length} Assign Assets
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-3 py-1 text-sm text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
            </div>
          </div>
            </div>
          </>
        )}
      </div>

             {/* Assignment Modal */}
       {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
<<<<<<< HEAD
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Asset
                </h2>
                <p className="text-sm text-gray-600">
                  {editingAsset.hostname || "Unknown Device"}
                </p>
<<<<<<< HEAD
=======
=======
                <h2 className="text-xl font-semibold text-gray-900">Assign Assets</h2>
                <p className="text-sm text-gray-600">{selectedAssets.length} asset(s) selected</p>
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
              </div>
              <button
                onClick={() => {
                  setEditingAsset(null);
                  setEditForm({});
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
=======
<<<<<<< HEAD
                 <h2 className="text-xl font-semibold text-gray-900">Assign Assets</h2>
                 <p className="text-sm text-gray-800">{selectedAssets.length} asset(s) selected</p>
              </div>
              <button
                 onClick={() => setShowAssignmentModal(false)}
                 className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
               >
                 <X className="h-5 w-5" />
=======
                <X className="h-5 w-5" />
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
>>>>>>> dinesh
              </button>
            </div>

             <div className="p-6 space-y-4">
                <div>
<<<<<<< HEAD
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                   Assign to User
                  </label>
                   <select
                   value={assignmentForm.selectedUser}
                   onChange={(e) => setAssignmentForm(prev => ({ ...prev, selectedUser: e.target.value }))}
                                         className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                   <option value="">Select a user</option>
                   {users?.map(user => (
                       <option key={user.id} value={user.id}>
                       {user.firstName} {user.lastName} ({user.email})
                       </option>
                     ))}
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                   Assignment Date
=======
                  <label className="block text-sm font-medium text-gray-700 mb-2">
<<<<<<< HEAD
                    Hostname
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                  </label>
                  <input
<<<<<<< HEAD
                    type="text"
                    value={editForm.hostname}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        hostname: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
=======
                     type="date"
                   value={assignmentForm.assignmentDate}
                   onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignmentDate: e.target.value }))}
                                         className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>>>>>>> dinesh
                  />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                   Notes (Optional)
                  </label>
                   <textarea
                   value={assignmentForm.notes}
                   onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                     rows={3}
                   placeholder="Add any notes about this assignment..."
                                         className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
                 </div>
               </div>

             <div className="flex space-x-3 p-6 border-t border-gray-200">
                 <button
                 onClick={() => setShowAssignmentModal(false)}
                   className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                 >
                   Cancel
                 </button>
                 <button
                 onClick={handleSaveAssignment}
                   className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium"
                 >
                 Assign Assets
                 </button>
                </div>
           </div>
         </div>
       )}

       {/* Edit Asset Modal */}
       {showEditModal && editingAsset && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                 <h2 className="text-xl font-semibold text-gray-900">Edit Asset</h2>
                 <p className="text-sm text-gray-800">{editingAsset.assetName}</p>
               </div>
               <button
                 onClick={() => setShowEditModal(false)}
                 className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
               >
                 <X className="h-5 w-5" />
               </button>
             </div>

             <div className="p-6 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                     Asset Name
                  </label>
                  <input
                    type="text"
<<<<<<< HEAD
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
=======
                     value={editForm.assetName}
                     onChange={(e) => setEditForm(prev => ({ ...prev, assetName: e.target.value }))}
                                         className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>>>>>>> dinesh
                  />
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <select
                    value={editForm.assignedTo}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        assignedTo: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
<<<<<<< HEAD
=======
=======
                  Assign to User
                  </label>
                  <select
                  value={assignmentForm.selectedUser}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, selectedUser: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                  <option value="">Select a user</option>
                  {users?.map(user => (
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                    Model
                  </label>
                  <input
                    type="text"
                    value={editForm.model}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        model: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
=======
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                     Tag ID
                  </label>
                  <input
                    type="text"
                     value={editForm.tagId}
                     onChange={(e) => setEditForm(prev => ({ ...prev, tagId: e.target.value }))}
                                         className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>>>>>>> dinesh
                  />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                     Category
                  </label>
<<<<<<< HEAD
                  <input
                    type="text"
                    value={editForm.serialNumber}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        serialNumber: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={editForm.vendor}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        vendor: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
=======
                   <select
                     value={editForm.category}
                     onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                         className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                     <option value="Hardware">Hardware</option>
                     <option value="Software">Software</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                     Sub Category
                   </label>
                   <select
                     value={editForm.subCategory}
                     onChange={(e) => setEditForm(prev => ({ ...prev, subCategory: e.target.value }))}
                     className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                     <option value="Desktop">Desktop</option>
                     <option value="Laptop">Laptop</option>
                     <option value="Server">Server</option>
                     <option value="Mobile">Mobile</option>
                   </select>
                 </div>
>>>>>>> dinesh


                 <div>
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                     Status
                   </label>
                   <select
                     value={editForm.status}
                     onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                     className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                     <option value="Available">Available</option>
                     <option value="Assigned">Assigned</option>
                     <option value="Maintenance">Maintenance</option>
                     <option value="Retired">Retired</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={editForm.purchaseDate}
<<<<<<< HEAD
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        purchaseDate: e.target.value,
                      }))
                    }
<<<<<<< HEAD
=======
=======
                  Assignment Date
                  </label>
                  <input
                    type="date"
                  value={assignmentForm.assignmentDate}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignmentDate: e.target.value }))}
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
=======
                    onChange={(e) => setEditForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                                         className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>>>>>>> dinesh
                  />
                </div>

                <div>
<<<<<<< HEAD
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                     Asset Location
=======
                  <label className="block text-sm font-medium text-gray-700 mb-2">
<<<<<<< HEAD
                    Purchase Price
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                  </label>
                  <input
<<<<<<< HEAD
                    type="number"
                    step="0.01"
                    value={editForm.purchasePrice}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        purchasePrice: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
=======
                     type="text"
                     value={editForm.assetLocation}
                     onChange={(e) => setEditForm(prev => ({ ...prev, assetLocation: e.target.value }))}
                                         className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>>>>>>> dinesh
                  />
                </div>

                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                     Assigned To
                   </label>
                   <select
                     value={editForm.assignedTo}
                     onChange={(e) => setEditForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                     className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                     <option value="">Unassigned</option>
                     {users?.map(user => (
                       <option key={user.id} value={user.id}>
                         {user.firstName} {user.lastName} ({user.email})
                       </option>
                     ))}
                   </select>
                 </div>

                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
<<<<<<< HEAD
=======
=======
                  Notes (Optional)
                  </label>
                  <textarea
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
>>>>>>> dinesh
>>>>>>> 16a0ac706f555c8d0895988fc4fa892f101c69fa
                    rows={3}
                     placeholder="Add any notes about this asset..."
                                         className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                 </div>
                </div>
              </div>

             <div className="flex space-x-3 p-6 border-t border-gray-200">
                <button
                 onClick={() => setShowEditModal(false)}
                 className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                 onClick={handleSaveEdit}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium"
                >
                  Save Changes
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsManagement;