import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { hardwareAPI, softwareAPI } from "../lib/api";
import toast from "react-hot-toast";

const AssetsManagement = ({ users }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, hardware, software
  const [filterStatus, setFilterStatus] = useState("all"); // all, assigned, unassigned
  const [sortBy, setSortBy] = useState("hostname"); // hostname, type, status, location
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const [expandedAsset, setExpandedAsset] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Fetch all assets (both hardware and software)
  const fetchAllAssets = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAssets();
  }, []);

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = assets.filter((asset) => {
      // Search filter
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
    });

    // Sort assets
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "hostname":
          aValue = a.hostname || "";
          bValue = b.hostname || "";
          break;
        case "type":
          aValue = a.type || "";
          bValue = b.type || "";
          break;
        case "status":
          aValue = a.assignedTo ? "assigned" : "unassigned";
          bValue = b.assignedTo ? "assigned" : "unassigned";
          break;
        case "location":
          aValue = a.location || "";
          bValue = b.location || "";
          break;
        default:
          aValue = a.hostname || "";
          bValue = b.hostname || "";
      }

      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [assets, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

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
  };

  // Save asset changes
  const handleSaveAsset = async () => {
    try {
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
    } catch (error) {
      console.error("Error updating asset:", error);
      toast.error("Failed to update asset");
    }
  };

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
  };

  // Get asset status color
  const getStatusColor = (asset) => {
    if (asset.assignedTo) {
      return "bg-green-100 text-green-800";
    }
    return "bg-gray-100 text-gray-800";
  };

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
                  </div>
                </div>

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
                      </div>

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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Asset
                </h2>
                <p className="text-sm text-gray-600">
                  {editingAsset.hostname || "Unknown Device"}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingAsset(null);
                  setEditForm({});
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
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
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hostname
                  </label>
                  <input
                    type="text"
                    value={editForm.hostname}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        hostname: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
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
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number
                  </label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={editForm.purchaseDate}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        purchaseDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Price
                  </label>
                  <input
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
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setEditingAsset(null);
                    setEditForm({});
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAsset}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsManagement;
