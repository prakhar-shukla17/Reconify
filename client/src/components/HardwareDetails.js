"use client";

import { useState } from "react";
import {
  Monitor,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Battery,
  Thermometer,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  Package,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Plus,
  Save,
  X,
  Activity,
} from "lucide-react";
import { hardwareAPI } from "../lib/api";
import toast from "react-hot-toast";
import MLPredictionsPanel from "./MLPredictionsPanel";

const HardwareDetails = ({ hardware }) => {
  const [expandedSections, setExpandedSections] = useState({
    system: true,
    asset_info: true,
    ml_predictions: false,
    cpu: false,
    memory: false,
    storage: false,
    graphics: false,
    network: false,
    motherboard: false,
    power: false,
  });

  const [editingComponent, setEditingComponent] = useState(null);
  const [editingAssetInfo, setEditingAssetInfo] = useState(false);
  const [warrantyForm, setWarrantyForm] = useState({
    purchase_date: "",
    warranty_expiry: "",
    serial_number: "",
    model_number: "",
    vendor: "",
    cost: 0,
    currency: "USD",
  });
  const [assetInfoForm, setAssetInfoForm] = useState({
    vendor: undefined,
    model: undefined,
    serial_number: undefined,
    asset_tag: undefined,
    location: undefined,
    department: undefined,
    purchase_date: "",
    warranty_expiry: "",
    cost: 0,
    currency: "USD",
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const InfoCard = ({ title, children, icon: Icon, sectionKey }) => (
    <div className="bg-white rounded-lg shadow-sm border">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-6 pb-4">{children}</div>
      )}
    </div>
  );

  const DataRow = ({ label, value, className = "" }) => (
    <div className={`flex justify-between py-2 ${className}`}>
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium text-gray-900">{value || "Unknown"}</span>
    </div>
  );

  // Helper function to get warranty status
  const getWarrantyStatus = (warrantyExpiry) => {
    if (!warrantyExpiry) {
      return {
        status: "unknown",
        text: "Unknown",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        icon: Clock,
      };
    }

    const today = new Date();
    const expiry = new Date(warrantyExpiry);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        status: "expired",
        text: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
        color: "text-red-600",
        bgColor: "bg-red-100",
        icon: AlertTriangle,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring_soon",
        text: `Expires in ${daysUntilExpiry} days`,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        icon: AlertTriangle,
      };
    } else {
      return {
        status: "active",
        text: `${daysUntilExpiry} days remaining`,
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: CheckCircle,
      };
    }
  };

  // Helper function to calculate asset age
  const getAssetAge = (purchaseDate) => {
    if (!purchaseDate) return "Unknown";

    const today = new Date();
    const purchase = new Date(purchaseDate);
    const ageInDays = Math.floor((today - purchase) / (1000 * 60 * 60 * 24));
    const ageInYears = Math.floor(ageInDays / 365);
    const remainingDays = ageInDays % 365;
    const ageInMonths = Math.floor(remainingDays / 30);

    if (ageInYears > 0) {
      return `${ageInYears} year${ageInYears > 1 ? "s" : ""}${
        ageInMonths > 0
          ? ` ${ageInMonths} month${ageInMonths > 1 ? "s" : ""}`
          : ""
      }`;
    } else if (ageInMonths > 0) {
      return `${ageInMonths} month${ageInMonths > 1 ? "s" : ""}`;
    } else {
      return `${ageInDays} day${ageInDays > 1 ? "s" : ""}`;
    }
  };

  const warrantyInfo = getWarrantyStatus(hardware.asset_info?.warranty_expiry);
  const assetAge = getAssetAge(hardware.asset_info?.purchase_date);

  // Handle warranty editing
  const startEditingComponent = (
    componentType,
    componentIndex,
    existingData = {}
  ) => {
    setEditingComponent({ type: componentType, index: componentIndex });
    setWarrantyForm({
      purchase_date: existingData.purchase_date
        ? new Date(existingData.purchase_date).toISOString().split("T")[0]
        : "",
      warranty_expiry: existingData.warranty_expiry
        ? new Date(existingData.warranty_expiry).toISOString().split("T")[0]
        : "",
      serial_number: existingData.serial_number || "",
      model_number: existingData.model_number || "",
      vendor: existingData.vendor || "",
      cost: existingData.cost || 0,
      currency: existingData.currency || "USD",
    });
  };

  const cancelEditing = () => {
    setEditingComponent(null);
    setWarrantyForm({
      purchase_date: "",
      warranty_expiry: "",
      serial_number: "",
      model_number: "",
      vendor: "",
      cost: 0,
      currency: "USD",
    });
  };

  const startEditingAssetInfo = () => {
    const assetInfo = hardware.asset_info || {};
    setAssetInfoForm({
      vendor: assetInfo.vendor || undefined,
      model: assetInfo.model || undefined,
      serial_number: assetInfo.serial_number || undefined,
      asset_tag: assetInfo.asset_tag || undefined,
      location: assetInfo.location || undefined,
      department: assetInfo.department || undefined,
      purchase_date: assetInfo.purchase_date
        ? new Date(assetInfo.purchase_date).toISOString().split("T")[0]
        : "",
      warranty_expiry: assetInfo.warranty_expiry
        ? new Date(assetInfo.warranty_expiry).toISOString().split("T")[0]
        : "",
      cost: assetInfo.cost || 0,
      currency: assetInfo.currency || "USD",
    });
    setEditingAssetInfo(true);
  };

  const cancelAssetInfoEditing = () => {
    setEditingAssetInfo(false);
    setAssetInfoForm({
      vendor: undefined,
      model: undefined,
      serial_number: undefined,
      asset_tag: undefined,
      location: undefined,
      department: undefined,
      purchase_date: "",
      warranty_expiry: "",
      cost: 0,
      currency: "USD",
    });
  };

  const saveAssetInfo = async () => {
    try {
      const assetInfoData = {
        ...assetInfoForm,
        cost: parseFloat(assetInfoForm.cost) || 0,
      };

      await hardwareAPI.updateAssetInfo(hardware._id, assetInfoData);
      toast.success("Asset information updated successfully");
      setEditingAssetInfo(false);

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating asset information:", error);
      toast.error("Failed to update asset information");
    }
  };

  const saveComponentWarranty = async () => {
    try {
      await hardwareAPI.updateComponentWarranty(
        hardware._id,
        editingComponent.type,
        editingComponent.index,
        warrantyForm
      );
      toast.success("Component warranty updated successfully!");
      cancelEditing();
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating component warranty:", error);
      toast.error("Failed to update component warranty");
    }
  };

  // Component warranty status component
  const ComponentWarranty = ({
    component,
    componentName,
    index,
    componentType,
  }) => {
    const hasWarrantyInfo = component?.component_info?.warranty_expiry;

    if (hasWarrantyInfo) {
      const componentWarranty = getWarrantyStatus(
        component.component_info.warranty_expiry
      );
      const ComponentIcon = componentWarranty.icon;

      return (
        <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-l-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ComponentIcon className={`h-4 w-4 ${componentWarranty.color}`} />
              <span className="text-sm font-medium text-gray-700">
                {componentName} {index !== undefined ? `#${index + 1}` : ""}{" "}
                Warranty
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${componentWarranty.color}`}>
                {componentWarranty.text}
              </span>
              <button
                onClick={() =>
                  startEditingComponent(
                    componentType,
                    index,
                    component.component_info
                  )
                }
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-600 space-y-1">
            {component.component_info.purchase_date && (
              <div>
                Purchased:{" "}
                {new Date(
                  component.component_info.purchase_date
                ).toLocaleDateString()}
              </div>
            )}
            <div>
              Expires:{" "}
              {new Date(
                component.component_info.warranty_expiry
              ).toLocaleDateString()}
            </div>
            {component.component_info.serial_number &&
              component.component_info.serial_number !== "Unknown" && (
                <div>S/N: {component.component_info.serial_number}</div>
              )}
            {component.component_info.model_number &&
              component.component_info.model_number !== "Unknown" && (
                <div>Model: {component.component_info.model_number}</div>
              )}
          </div>
        </div>
      );
    }

    // Show "Add Warranty" button if no warranty info exists
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-l-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {componentName} {index !== undefined ? `#${index + 1}` : ""} - No
            warranty info
          </span>
          <button
            onClick={() => startEditingComponent(componentType, index)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
          >
            <Plus className="h-3 w-3" />
            <span>Add Warranty</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Warranty Editing Modal */}
      {editingComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Component Warranty
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingComponent?.type === "cpu" && "CPU"}
                    {editingComponent?.type === "memory" &&
                      `Memory Slot #${editingComponent.index + 1}`}
                    {editingComponent?.type === "storage" &&
                      `Storage Drive #${editingComponent.index + 1}`}
                    {editingComponent?.type === "gpu" &&
                      `GPU #${editingComponent.index + 1}`}
                  </p>
                </div>
                <button
                  onClick={cancelEditing}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-5">
              {/* Purchase & Warranty Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={warrantyForm.purchase_date}
                    onChange={(e) =>
                      setWarrantyForm({
                        ...warrantyForm,
                        purchase_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Warranty Expiry <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={warrantyForm.warranty_expiry}
                    onChange={(e) =>
                      setWarrantyForm({
                        ...warrantyForm,
                        warranty_expiry: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Component Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={warrantyForm.serial_number}
                    onChange={(e) =>
                      setWarrantyForm({
                        ...warrantyForm,
                        serial_number: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter serial number (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Model Number
                  </label>
                  <input
                    type="text"
                    value={warrantyForm.model_number}
                    onChange={(e) =>
                      setWarrantyForm({
                        ...warrantyForm,
                        model_number: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter model number (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Vendor/Manufacturer
                  </label>
                  <input
                    type="text"
                    value={warrantyForm.vendor}
                    onChange={(e) =>
                      setWarrantyForm({
                        ...warrantyForm,
                        vendor: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter vendor name (optional)"
                  />
                </div>
              </div>

              {/* Cost Information */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Cost Information
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      value={warrantyForm.cost}
                      onChange={(e) =>
                        setWarrantyForm({
                          ...warrantyForm,
                          cost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <select
                      value={warrantyForm.currency}
                      onChange={(e) =>
                        setWarrantyForm({
                          ...warrantyForm,
                          currency: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Required Field Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Note:</p>
                    <p>
                      Only warranty expiry date is required. Other fields are
                      optional but help with better asset tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelEditing}
                  className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveComponentWarranty}
                  disabled={!warrantyForm.warranty_expiry}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors font-medium"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Warranty Info</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Information Editing Modal */}
      {editingAssetInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Edit Asset Information
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Update asset details and warranty information
                  </p>
                </div>
                <button
                  onClick={cancelAssetInfoEditing}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Vendor
                    </label>
                    <input
                      type="text"
                      value={assetInfoForm.vendor || ""}
                      onChange={(e) =>
                        setAssetInfoForm({
                          ...assetInfoForm,
                          vendor: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Unknown"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      value={assetInfoForm.model || ""}
                      onChange={(e) =>
                        setAssetInfoForm({
                          ...assetInfoForm,
                          model: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Unknown"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={assetInfoForm.serial_number || ""}
                      onChange={(e) =>
                        setAssetInfoForm({
                          ...assetInfoForm,
                          serial_number: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Unknown"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Asset Tag
                    </label>
                    <input
                      type="text"
                      value={assetInfoForm.asset_tag || ""}
                      onChange={(e) =>
                        setAssetInfoForm({
                          ...assetInfoForm,
                          asset_tag: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Unknown"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Location & Department
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={assetInfoForm.location || ""}
                      onChange={(e) =>
                        setAssetInfoForm({
                          ...assetInfoForm,
                          location: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Unknown"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={assetInfoForm.department || ""}
                      onChange={(e) =>
                        setAssetInfoForm({
                          ...assetInfoForm,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Unknown"
                    />
                  </div>
                </div>
              </div>

              {/* Purchase & Warranty Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Purchase & Warranty
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={assetInfoForm.purchase_date}
                      onChange={(e) =>
                        setAssetInfoForm({
                          ...assetInfoForm,
                          purchase_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      value={assetInfoForm.warranty_expiry}
                      onChange={(e) =>
                        setAssetInfoForm({
                          ...assetInfoForm,
                          warranty_expiry: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={assetInfoForm.cost}
                      onChange={(e) =>
                        setAssetInfoForm({
                          ...assetInfoForm,
                          cost: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Currency
                    </label>
                    <select
                      value={assetInfoForm.currency}
                      onChange={(e) =>
                        setAssetInfoForm({
                          ...assetInfoForm,
                          currency: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelAssetInfoEditing}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAssetInfo}
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Monitor className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {hardware.system?.hostname || "Unknown Device"}
            </h1>
            <p className="text-gray-600">
              {hardware.system?.platform} {hardware.system?.platform_release} •
              MAC: {hardware.system?.mac_address}
            </p>
          </div>
        </div>
      </div>

      {/* System Information */}
      <InfoCard title="System Information" icon={Info} sectionKey="system">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DataRow label="Platform" value={hardware.system?.platform} />
            <DataRow
              label="Release"
              value={hardware.system?.platform_release}
            />
            <DataRow
              label="Version"
              value={hardware.system?.platform_version}
            />
            <DataRow
              label="Architecture"
              value={hardware.system?.architecture}
            />
          </div>
          <div>
            <DataRow label="Hostname" value={hardware.system?.hostname} />
            <DataRow label="Processor" value={hardware.system?.processor} />
            <DataRow label="Boot Time" value={hardware.system?.boot_time} />
            <DataRow label="Uptime" value={hardware.system?.uptime} />
          </div>
        </div>
      </InfoCard>

      {/* Asset Information */}
      <InfoCard
        title="Asset Information"
        icon={Package}
        sectionKey="asset_info"
      >
        <div className="space-y-4">
          {/* Warranty Status Banner */}
          {hardware.asset_info?.warranty_expiry && (
            <div className={`${warrantyInfo.bgColor} rounded-lg p-4 border`}>
              <div className="flex items-center space-x-3">
                <warrantyInfo.icon
                  className={`h-5 w-5 ${warrantyInfo.color}`}
                />
                <div>
                  <p className={`font-medium ${warrantyInfo.color}`}>
                    Warranty Status: {warrantyInfo.text}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expires:{" "}
                    {new Date(
                      hardware.asset_info.warranty_expiry
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DataRow
                label="Purchase Date"
                value={
                  hardware.asset_info?.purchase_date
                    ? new Date(
                        hardware.asset_info.purchase_date
                      ).toLocaleDateString()
                    : "Not set"
                }
              />
              <DataRow
                label="Warranty Expiry"
                value={
                  hardware.asset_info?.warranty_expiry
                    ? new Date(
                        hardware.asset_info.warranty_expiry
                      ).toLocaleDateString()
                    : "Not set"
                }
              />
              <DataRow label="Asset Age" value={assetAge} />
              <DataRow label="Vendor" value={hardware.asset_info?.vendor} />
              <DataRow label="Model" value={hardware.asset_info?.model} />
            </div>
            <div>
              <DataRow
                label="Serial Number"
                value={hardware.asset_info?.serial_number}
              />
              <DataRow
                label="Asset Tag"
                value={hardware.asset_info?.asset_tag}
              />
              <DataRow label="Location" value={hardware.asset_info?.location} />
              <DataRow
                label="Department"
                value={hardware.asset_info?.department}
              />
              <DataRow
                label="Cost"
                value={
                  hardware.asset_info?.cost
                    ? `${hardware.asset_info.currency || "USD"} ${
                        hardware.asset_info.cost
                      }`
                    : "Not set"
                }
              />
            </div>
          </div>

          {/* Edit Asset Info Button (for admins) */}
          <div className="pt-4 border-t">
            <button
              onClick={startEditingAssetInfo}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Asset Information</span>
            </button>
          </div>
        </div>
      </InfoCard>

      {/* ML Predictions */}
      <InfoCard
        title="ML Predictions & Analytics"
        icon={Activity}
        sectionKey="ml_predictions"
      >
        <MLPredictionsPanel macAddress={hardware.system?.mac_address} />
      </InfoCard>

      {/* CPU Information */}
      <InfoCard title="CPU Information" icon={Cpu} sectionKey="cpu">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DataRow label="Name" value={hardware.cpu?.name} />
            <DataRow label="Manufacturer" value={hardware.cpu?.manufacturer} />
            <DataRow label="Architecture" value={hardware.cpu?.architecture} />
            <DataRow
              label="Physical Cores"
              value={hardware.cpu?.physical_cores}
            />
            <DataRow
              label="Logical Cores"
              value={hardware.cpu?.logical_cores}
            />
          </div>
          <div>
            <DataRow
              label="Max Frequency"
              value={hardware.cpu?.max_frequency}
            />
            <DataRow
              label="Min Frequency"
              value={hardware.cpu?.min_frequency}
            />
            <DataRow
              label="Current Frequency"
              value={hardware.cpu?.current_frequency}
            />
            <DataRow label="L2 Cache" value={hardware.cpu?.l2_cache} />
            <DataRow label="L3 Cache" value={hardware.cpu?.l3_cache} />
          </div>
        </div>

        {/* CPU Warranty Information */}
        <ComponentWarranty
          component={hardware.cpu}
          componentName="CPU"
          componentType="cpu"
        />
      </InfoCard>

      {/* Memory Information */}
      <InfoCard
        title="Memory Information"
        icon={MemoryStick}
        sectionKey="memory"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <DataRow label="Total" value={hardware.memory?.total} />
            <DataRow label="Available" value={hardware.memory?.available} />
            <DataRow label="Used" value={hardware.memory?.used} />
            <DataRow label="Usage" value={hardware.memory?.percentage} />
          </div>
          <div>
            <DataRow label="Type" value={hardware.memory?.type} />
            <DataRow label="Speed" value={hardware.memory?.speed} />
            <DataRow label="Slot Count" value={hardware.memory?.slot_count} />
            <DataRow label="Swap Total" value={hardware.memory?.swap_total} />
          </div>
        </div>

        {hardware.memory?.slots?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Memory Slots</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hardware.memory.slots.map((slot, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm">
                    <DataRow
                      label="Capacity"
                      value={slot.capacity}
                      className="text-xs"
                    />
                    <DataRow
                      label="Speed"
                      value={slot.speed}
                      className="text-xs"
                    />
                    <DataRow
                      label="Type"
                      value={slot.type}
                      className="text-xs"
                    />
                    <DataRow
                      label="Manufacturer"
                      value={slot.manufacturer}
                      className="text-xs"
                    />
                  </div>

                  {/* Memory Slot Warranty Information */}
                  <ComponentWarranty
                    component={slot}
                    componentName="Memory Slot"
                    index={index}
                    componentType="memory"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </InfoCard>

      {/* Storage Information */}
      <InfoCard
        title="Storage Information"
        icon={HardDrive}
        sectionKey="storage"
      >
        <div className="mb-4">
          <DataRow
            label="Total Capacity"
            value={hardware.storage?.total_capacity}
          />
        </div>

        {hardware.storage?.drives?.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Storage Drives</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hardware.storage.drives.map((drive, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <DataRow label="Model" value={drive.model} />
                  <DataRow label="Size" value={drive.size} />
                  <DataRow label="Media Type" value={drive.media_type} />
                  <DataRow label="Interface" value={drive.interface} />

                  {/* Storage Drive Warranty Information */}
                  <ComponentWarranty
                    component={drive}
                    componentName="Storage Drive"
                    index={index}
                    componentType="storage"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {hardware.storage?.partitions?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Partitions</h4>
            <div className="space-y-3">
              {hardware.storage.partitions.map((partition, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DataRow label="Device" value={partition.device} />
                    <DataRow label="Mount Point" value={partition.mountpoint} />
                    <DataRow label="Filesystem" value={partition.filesystem} />
                    <DataRow label="Usage" value={partition.percentage} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </InfoCard>

      {/* Graphics Information */}
      {hardware.graphics?.gpus?.length > 0 && (
        <InfoCard
          title="Graphics Information"
          icon={Monitor}
          sectionKey="graphics"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hardware.graphics.gpus.map((gpu, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  GPU {index + 1}
                </h4>
                <DataRow label="Name" value={gpu.name} />
                <DataRow
                  label="Memory"
                  value={gpu.memory || gpu.memory_total}
                />
                <DataRow label="Driver Version" value={gpu.driver_version} />
                <DataRow label="Temperature" value={gpu.temperature} />
                <DataRow label="Load" value={gpu.load} />

                {/* GPU Warranty Information */}
                <ComponentWarranty
                  component={gpu}
                  componentName="GPU"
                  index={index}
                  componentType="gpu"
                />
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Network Information */}
      <InfoCard title="Network Information" icon={Wifi} sectionKey="network">
        {hardware.network?.interfaces?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hardware.network.interfaces.map((networkInterface, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {networkInterface.name}
                </h4>
                <DataRow
                  label="Status"
                  value={networkInterface.is_up ? "Up" : "Down"}
                />
                <DataRow label="Speed" value={networkInterface.speed} />
                <DataRow
                  label="MAC Address"
                  value={networkInterface.mac_address}
                />
                {networkInterface.addresses?.map((addr, addrIndex) => (
                  <DataRow
                    key={addrIndex}
                    label={addr.type}
                    value={addr.address}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No network interfaces found</p>
        )}
      </InfoCard>

      {/* Motherboard Information */}
      <InfoCard
        title="Motherboard Information"
        icon={Zap}
        sectionKey="motherboard"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DataRow
              label="Manufacturer"
              value={hardware.motherboard?.manufacturer}
            />
            <DataRow label="Model" value={hardware.motherboard?.model} />
            <DataRow label="Version" value={hardware.motherboard?.version} />
            <DataRow
              label="Serial Number"
              value={hardware.motherboard?.serial_number}
            />
          </div>
          {hardware.motherboard?.bios && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                BIOS Information
              </h4>
              <DataRow
                label="Manufacturer"
                value={hardware.motherboard.bios.manufacturer}
              />
              <DataRow
                label="Version"
                value={hardware.motherboard.bios.version}
              />
              <DataRow
                label="Release Date"
                value={hardware.motherboard.bios.release_date}
              />
            </div>
          )}
        </div>
      </InfoCard>

      {/* Power & Thermal Information */}
      {(hardware.power_thermal?.battery ||
        hardware.power_thermal?.temperatures) && (
        <InfoCard
          title="Power & Thermal Information"
          icon={Battery}
          sectionKey="power"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hardware.power_thermal.battery && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Battery</h4>
                <DataRow
                  label="Charge"
                  value={hardware.power_thermal.battery.percent}
                />
                <DataRow
                  label="Power"
                  value={
                    hardware.power_thermal.battery.power_plugged
                      ? "Plugged In"
                      : "On Battery"
                  }
                />
                <DataRow
                  label="Time Left"
                  value={hardware.power_thermal.battery.time_left}
                />
              </div>
            )}

            {hardware.power_thermal.temperatures && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Temperature Sensors
                </h4>
                {Object.entries(hardware.power_thermal.temperatures).map(
                  ([sensor, readings]) => (
                    <div key={sensor} className="mb-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">
                        {sensor}
                      </h5>
                      {readings.map((reading, index) => (
                        <div key={index} className="text-sm">
                          <DataRow
                            label={reading.label}
                            value={`${reading.current} (High: ${reading.high}, Critical: ${reading.critical})`}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </InfoCard>
      )}
    </div>
  );
};

export default HardwareDetails;
