"use client";

import { useState } from "react";
import { X, Plus, Monitor, AlertCircle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { hardwareAPI } from "../lib/api";
import toast from "react-hot-toast";

const ManualAssetModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const categories = ["Computer", "Laptop", "Printer", "CCTV", "Router"];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await hardwareAPI.createManualAsset({
        macAddress: data.macAddress.toUpperCase(),
        modelName: data.modelName,
        category: data.category,
        hostname: data.hostname,
      });

      toast.success("Manual asset entry created successfully!");
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error creating manual asset:", error);
      toast.error(
        error.response?.data?.error || "Failed to create manual asset"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-green-600" />
                Manual Asset Entry
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Pre-register an asset before scanning
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* MAC Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MAC Address *
            </label>
            <input
              type="text"
              placeholder="e.g., AA:BB:CC:DD:EE:FF"
              {...register("macAddress", {
                required: "MAC address is required",
                pattern: {
                  value: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
                  message: "Invalid MAC address format",
                },
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.macAddress ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.macAddress && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.macAddress.message}
              </p>
            )}
          </div>

          {/* Model Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Dell OptiPlex 7090"
              {...register("modelName", {
                required: "Model name is required",
                minLength: {
                  value: 2,
                  message: "Model name must be at least 2 characters",
                },
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.modelName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.modelName && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.modelName.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              {...register("category", {
                required: "Category is required",
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                errors.category ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Hostname (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hostname (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., DESKTOP-ABC123"
              {...register("hostname")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to auto-generate based on model name
            </p>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Monitor className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  What happens next?
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  After creating this entry, run the hardware scanner on the
                  target device. It will automatically detect and update all
                  hardware specifications while preserving your manual
                  information.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualAssetModal;
