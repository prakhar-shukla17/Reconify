"use client";

import { useState, useEffect } from "react";
import {
  X,
  Search,
  User,
  Shield,
  Package,
  Plus,
  Minus,
  Users,
  CheckCircle,
  AlertCircle,
  Monitor,
  Building,
} from "lucide-react";
import { authAPI } from "../lib/api";
import toast from "react-hot-toast";

const EnhancedAssignmentModal = ({
  isOpen,
  onClose,
  selectedAssets = [],
  users = [],
  onAssignmentComplete,
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentMode, setAssignmentMode] = useState("single"); // single, multiple, bulk
  const [loading, setLoading] = useState(false);
  const [unassignedAssets, setUnassignedAssets] = useState([]);
  const [selectedUnassignedAssets, setSelectedUnassignedAssets] = useState([]);

  useEffect(() => {
    if (isOpen) {
      console.log("EnhancedAssignmentModal opened with users:", users);
      console.log("Users length:", users.length);
      fetchUnassignedAssets();
    }
  }, [isOpen, users]);

  const fetchUnassignedAssets = async () => {
    try {
      const response = await authAPI.getUnassignedAssets();
      setUnassignedAssets(response.data.unassignedAssets);
    } catch (error) {
      console.error("Error fetching unassigned assets:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug filtered users
  console.log("Filtered users:", filteredUsers);
  console.log("Search term:", searchTerm);

  const handleUserToggle = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAssetToggle = (asset) => {
    setSelectedUnassignedAssets((prev) => {
      const isSelected = prev.some((a) => a.id === asset.id);
      if (isSelected) {
        return prev.filter((a) => a.id !== asset.id);
      } else {
        return [...prev, asset];
      }
    });
  };

  const handleAssignment = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    const assetsToAssign =
      assignmentMode === "bulk"
        ? selectedUnassignedAssets.map((a) => a.macAddress)
        : selectedAssets;

    if (assetsToAssign.length === 0) {
      toast.error("Please select at least one asset");
      return;
    }

    setLoading(true);

    try {
      if (assignmentMode === "bulk" && selectedUsers.length > 1) {
        // Bulk assignment to multiple users
        const assignments = selectedUsers.map((user) => ({
          userId: user.id,
          macAddresses: assetsToAssign,
        }));

        const response = await authAPI.bulkAssignAssets(assignments);
        toast.success(response.data.message);
      } else {
        // Single user, multiple assets
        const user = selectedUsers[0];
        const response = await authAPI.assignMultipleAssets(
          user.id,
          assetsToAssign
        );
        toast.success(response.data.message);
      }

      onAssignmentComplete?.();
      onClose();
      resetModal();
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(error.response?.data?.error || "Failed to assign assets");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setSelectedUsers([]);
    setSelectedUnassignedAssets([]);
    setSearchTerm("");
    setAssignmentMode("single");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Enhanced Asset Assignment
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Assign assets to users and admins with advanced options
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Left Panel - Users */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  Select Users ({selectedUsers.length})
                </h4>
                <div className="text-xs text-gray-500">
                  Users: {filteredUsers.filter((u) => u.role === "user").length}{" "}
                  | Admins:{" "}
                  {filteredUsers.filter((u) => u.role === "admin").length}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.some(
                    (u) => u.id === user.id
                  );
                  const RoleIcon = user.role === "admin" ? Shield : User;

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleUserToggle(user)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <RoleIcon
                            className={`h-4 w-4 ${
                              user.role === "admin"
                                ? "text-purple-600"
                                : "text-blue-600"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.fullName || user.username}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {user.role.toUpperCase()}
                              </span>
                              {user.department && (
                                <span className="flex items-center">
                                  <Building className="h-3 w-3 mr-1" />
                                  {user.department}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {user.assignedAssets?.length || 0} assets
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-blue-600 mt-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel - Assets & Assignment Options */}
          <div className="w-1/2 flex flex-col">
            {/* Assignment Mode Selector */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2 text-green-600" />
                Assignment Mode
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAssignmentMode("single")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    assignmentMode === "single"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Selected Assets
                </button>
                <button
                  onClick={() => setAssignmentMode("multiple")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    assignmentMode === "multiple"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Multiple Assets
                </button>
                <button
                  onClick={() => setAssignmentMode("bulk")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    assignmentMode === "bulk"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Bulk Assign
                </button>
              </div>
            </div>

            {/* Assets List */}
            <div className="flex-1 overflow-y-auto p-4">
              {assignmentMode === "single" && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">
                    Selected Assets ({selectedAssets.length})
                  </h5>
                  {selectedAssets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No assets selected</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedAssets.map((assetId) => (
                        <div
                          key={assetId}
                          className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex items-center">
                            <Monitor className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {assetId}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {assignmentMode === "bulk" && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">
                    Unassigned Assets ({selectedUnassignedAssets.length}/
                    {unassignedAssets.length})
                  </h5>
                  {unassignedAssets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-300" />
                      <p>All assets are assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unassignedAssets.map((asset) => {
                        const isSelected = selectedUnassignedAssets.some(
                          (a) => a.id === asset.id
                        );
                        return (
                          <div
                            key={asset.id}
                            onClick={() => handleAssetToggle(asset)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Monitor className="h-4 w-4 text-gray-600 mr-2" />
                                <div>
                                  <p className="text-xs font-medium text-gray-900">
                                    {asset.hostname}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {asset.macAddress}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedUsers.length > 0 && (
                <div className="flex items-center space-x-4">
                  <span>
                    <strong>{selectedUsers.length}</strong> user
                    {selectedUsers.length !== 1 ? "s" : ""} selected
                  </span>
                  <span>
                    <strong>
                      {assignmentMode === "bulk"
                        ? selectedUnassignedAssets.length
                        : selectedAssets.length}
                    </strong>{" "}
                    asset
                    {(assignmentMode === "bulk"
                      ? selectedUnassignedAssets.length
                      : selectedAssets.length) !== 1
                      ? "s"
                      : ""}{" "}
                    to assign
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignment}
                disabled={loading || selectedUsers.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Assign Assets</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAssignmentModal;
