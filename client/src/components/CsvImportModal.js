"use client";

import { useState, useRef } from "react";
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Cookies from "js-cookie";
import { useAuth } from "../contexts/AuthContext";

export default function CsvImportModal({ isOpen, onClose, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { user, logout } = useAuth();

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (
      selectedFile &&
      (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv"))
    ) {
      setFile(selectedFile);
      setError(null);
      setImportResults(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvContent = e.target.result;
        const lines = csvContent.split("\n").slice(0, 6); // Show first 6 lines
        setPreview(lines.join("\n"));
      };
      reader.readAsText(selectedFile);
    } else {
      setError("Please select a valid CSV file");
      setFile(null);
      setPreview(null);
    }
  };

  const generateRandomMacAddress = () => {
    const hexDigits = "0123456789ABCDEF";
    let mac = "";
    for (let i = 0; i < 6; i++) {
      if (i > 0) mac += ":";
      for (let j = 0; j < 2; j++) {
        mac += hexDigits[Math.floor(Math.random() * 16)];
      }
    }
    return mac;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResults(null);

    try {
      // Get token from cookies
      const token = Cookies.get("token");

      if (!token) {
        setError("Authentication required. Please log in again.");
        logout();
        return;
      }

      const formData = new FormData();
      formData.append("csvFile", file);

      console.log("Sending CSV import request...");
      const response = await fetch("/api/hardware/import/csv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 500));
        setError(
          `Server error: Expected JSON but got ${contentType}. Please check if the backend server is running.`
        );
        return;
      }

      const result = await response.json();

      if (response.ok) {
        setImportResults(result);
        if (onImportComplete) {
          onImportComplete(result);
        }
      } else if (response.status === 401) {
        setError("Session expired. Please log in again.");
        logout();
      } else {
        setError(result.error || "Import failed");
      }
    } catch (err) {
      console.error("CSV import error:", err);
      setError("Network error: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setImportResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Import Assets from CSV
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!importResults ? (
            <>
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to select or drag and drop your CSV file
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Choose File
                  </button>
                </div>
              </div>

              {/* File Preview */}
              {file && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    File Preview
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-mono whitespace-pre-wrap">
                      {preview}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selected file: {file.name} ({(file.size / 1024).toFixed(1)}{" "}
                    KB)
                  </p>
                </div>
              )}

              {/* Import Instructions */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Import Instructions
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Asset name will be created from "Asset Name" + "Model"
                      columns
                    </li>
                    <li>
                      • Serial number will be extracted from "Serial Number"
                      column
                    </li>
                    <li>
                      • Branch information will be extracted from "Branch"
                      column
                    </li>
                    <li>
                      • Random MAC addresses will be generated for assets
                      without them
                    </li>
                    <li>• Assets will be marked as "csv_import" entry type</li>
                  </ul>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Import Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || importing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>Import Assets</span>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Import Results */
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Import Completed Successfully!
              </h3>

              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">
                      Total Processed:
                    </span>
                    <div className="text-2xl font-bold text-green-600">
                      {importResults.totalProcessed || 0}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">
                      Successfully Imported:
                    </span>
                    <div className="text-2xl font-bold text-green-600">
                      {importResults.successCount || 0}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Failed:</span>
                    <div className="text-2xl font-bold text-red-600">
                      {importResults.errorCount || 0}
                    </div>
                  </div>
                </div>
              </div>

              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Import Errors:
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        Row {error.row}: {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
