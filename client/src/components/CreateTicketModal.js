"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Monitor, Plus, Ticket } from "lucide-react";
import { useForm } from "react-hook-form";
import { ticketsAPI } from "../lib/api";
import toast from "react-hot-toast";

const CreateTicketModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [userAssets, setUserAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const selectedAsset = watch("asset_id");

  const priorities = [
    { value: "Low", label: "Low", color: "text-green-600" },
    { value: "Medium", label: "Medium", color: "text-yellow-600" },
    { value: "High", label: "High", color: "text-orange-600" },
    { value: "Critical", label: "Critical", color: "text-red-600" },
  ];

  const categories = [
    "Hardware Issue",
    "Software Issue",
    "Network Issue",
    "Performance Issue",
    "Maintenance Request",
    "Access Request",
    "Other",
  ];

  useEffect(() => {
    if (isOpen) {
      fetchUserAssets();
    }
  }, [isOpen]);

  const fetchUserAssets = async () => {
    try {
      setLoadingAssets(true);
      const response = await ticketsAPI.getUserAssets();
      setUserAssets(response.data.data || []);
    } catch (error) {
      console.error("Error fetching user assets:", error);
      toast.error("Failed to fetch your assets");
    } finally {
      setLoadingAssets(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await ticketsAPI.create({
        title: data.title.trim(),
        description: data.description.trim(),
        priority: data.priority,
        category: data.category,
        asset_id: data.asset_id,
      });

      onSuccess?.(response.data.data);
      handleClose();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error(error.response?.data?.error || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getSelectedAssetInfo = () => {
    if (!selectedAsset) return null;
    return userAssets.find((asset) => asset.id === selectedAsset);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Ticket className="h-5 w-5 mr-2 text-blue-600" />
                Create Support Ticket
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Report an issue or request assistance for your assets
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
        >
          {/* Asset Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Asset *
            </label>
            {loadingAssets ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
            ) : (
              <select
                {...register("asset_id", {
                  required: "Please select an asset",
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                  errors.asset_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Choose an asset...</option>
                {userAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.hostname} - {asset.model} ({asset.category})
                  </option>
                ))}
              </select>
            )}
            {errors.asset_id && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.asset_id.message}
              </p>
            )}

            {/* Selected Asset Info */}
            {getSelectedAssetInfo() && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <Monitor className="h-4 w-4 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {getSelectedAssetInfo().hostname}
                    </p>
                    <p className="text-xs text-blue-700">
                      {getSelectedAssetInfo().model} •{" "}
                      {getSelectedAssetInfo().category} •{" "}
                      {getSelectedAssetInfo().macAddress}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Title *
            </label>
            <input
              type="text"
              placeholder="Brief description of the issue"
              {...register("title", {
                required: "Title is required",
                minLength: {
                  value: 5,
                  message: "Title must be at least 5 characters",
                },
                maxLength: {
                  value: 200,
                  message: "Title cannot exceed 200 characters",
                },
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.title.message}
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

          {/* Priority */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              {...register("priority", {
                required: "Priority is required",
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                errors.priority ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select priority level</option>
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.priority.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              rows={5}
              placeholder="Please provide detailed information about the issue, including steps to reproduce, error messages, and any other relevant details..."
              {...register("description", {
                required: "Description is required",
                minLength: {
                  value: 20,
                  message: "Description must be at least 20 characters",
                },
                maxLength: {
                  value: 2000,
                  message: "Description cannot exceed 2000 characters",
                },
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white resize-none ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900">
                  Before submitting your ticket:
                </h4>
                <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                  <li>Ensure you've tried basic troubleshooting steps</li>
                  <li>Include any error messages or screenshots if possible</li>
                  <li>Specify when the issue started occurring</li>
                  <li>Mention if this affects your work productivity</li>
                </ul>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
