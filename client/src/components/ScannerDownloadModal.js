import React, { useState, useEffect } from "react";
import {
  Download,
  Monitor,
  Shield,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { scannerAPI } from "../lib/api";
import Cookies from "js-cookie";

const ScannerDownloadModal = ({ isOpen, onClose }) => {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState("windows");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlatforms();
    }
  }, [isOpen]);

  const fetchPlatforms = async () => {
    try {
      const response = await scannerAPI.getPlatforms();
      setPlatforms(response.data.platforms);
    } catch (error) {
      console.error("Error fetching platforms:", error);
      setError("Failed to load available platforms");
    }
  };

  const testServerConnection = async () => {
    try {
      const response = await fetch("/api/scanner/test");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Server test response:", data);
      alert(
        `✅ Server is running!\n\nResponse: ${JSON.stringify(data, null, 2)}`
      );
    } catch (error) {
      console.error("Server test failed:", error);
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        alert(
          `❌ Backend server is not running!\n\nPlease start the backend server:\n1. Open terminal\n2. cd ITAM/server\n3. npm start\n\nError: ${error.message}`
        );
      } else {
        alert(`❌ Server test failed: ${error.message}`);
      }
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      setDownloadProgress(0);

      // First, check if backend is running
      try {
        const testResponse = await fetch("/api/scanner/test");
        if (!testResponse.ok) {
          throw new Error(`Backend server error: ${testResponse.status}`);
        }
      } catch (error) {
        console.error("Backend check failed:", error);
        setError(
          "Backend server is not running. Please start the server first."
        );
        setIsDownloading(false);
        setDownloadProgress(0);
        return;
      }

      // Get the authentication token using js-cookie (same method as AuthContext)
      let token = null;

      try {
        token = Cookies.get("token");
        console.log(
          "Token found using js-cookie:",
          token ? "Yes" : "No",
          "Length:",
          token ? token.length : 0
        );
      } catch (e) {
        console.log("Failed to get token using js-cookie:", e);
      }

      if (!token) {
        console.log(
          "No token found, proceeding with download without authentication"
        );
        // Continue without token - the backend will use default user
      }

      // Use relative URL for production compatibility
      let downloadUrl = `/api/scanner/download?platform=${selectedPlatform}&t=${Date.now()}`;

      if (token) {
        downloadUrl += `&token=${encodeURIComponent(token)}`;
      }

      console.log("Download URL:", downloadUrl);

      // Create a temporary link element for direct browser download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `ITAM_Scanner_${selectedPlatform}.zip`;
      link.target = "_blank"; // Open in new tab/window
      link.rel = "noopener noreferrer";

      // Add additional attributes to prevent download manager interception
      link.setAttribute(
        "data-downloadurl",
        `application/zip:${link.download}:${link.href}`
      );
      link.style.display = "none";

      // Add to DOM, click, and remove
      document.body.appendChild(link);

      // Small delay to ensure proper setup
      setTimeout(() => {
        console.log("Clicking download link...");
        link.click();
        document.body.removeChild(link);
      }, 100);

      // Show download started message
      setDownloadProgress(50);
      setTimeout(() => {
        setDownloadProgress(100);
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadProgress(0);
          onClose();
        }, 1000);
      }, 1500);
    } catch (error) {
      console.error("Download error:", error);
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        setError(
          "Backend server is not running. Please start the server first."
        );
      } else {
        setError("Failed to download scanner package");
      }
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const getPlatformIcon = (platformId) => {
    switch (platformId) {
      case "windows":
        return <Monitor className="w-6 h-6" />;
      case "linux":
        return <Activity className="w-6 h-6" />;
      case "macos":
        return <Shield className="w-6 h-6" />;
      default:
        return <Monitor className="w-6 h-6" />;
    }
  };

  const getPlatformName = (platformId) => {
    switch (platformId) {
      case "windows":
        return "Windows (Executable)";
      case "linux":
        return "Linux (Coming Soon)";
      case "macos":
        return "macOS (Coming Soon)";
      default:
        return "Unknown";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Download ITAM Scanner Executable
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isDownloading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Platform
          </label>
          <div className="space-y-2">
            {platforms.map((platform) => {
              const isWindows = platform.id === "windows";
              const isDisabled = !isWindows;

              return (
                <label
                  key={platform.id}
                  className={`flex items-center p-3 border rounded-lg transition-colors ${
                    isDisabled
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                      : selectedPlatform === platform.id
                      ? "border-blue-500 bg-blue-50 cursor-pointer"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="platform"
                    value={platform.id}
                    checked={selectedPlatform === platform.id}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="sr-only"
                    disabled={isDownloading || isDisabled}
                  />
                  <div className="flex items-center flex-1">
                    {getPlatformIcon(platform.id)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {getPlatformName(platform.id)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isDisabled
                          ? "Executable generation coming soon"
                          : platform.description}
                      </div>
                    </div>
                  </div>
                  {selectedPlatform === platform.id && isWindows && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                  {isDisabled && (
                    <div className="text-xs text-gray-400 px-2 py-1 bg-gray-200 rounded">
                      Soon
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            What's Included:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              • <strong>Standalone executable</strong> - includes all Python
              dependencies
            </li>
            <li>
              • <strong>No Python required</strong> - runs on any Windows
              machine
            </li>
            <li>• Pre-configured for your organization</li>
            <li>• Hardware and software detection modules</li>
            <li>• System monitoring and telemetry</li>
            <li>• Runs automatically in the background</li>
            <li>• Configuration file with secure authentication</li>
            <li>• Windows installer script included</li>
            <li>
              • <strong>ZIP package</strong> - contains executable + config +
              installer
            </li>
          </ul>
        </div>

        {isDownloading && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Preparing download...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isDownloading}
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isDownloading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Executable
                </>
              )}
            </button>
          </div>
          <button
            onClick={testServerConnection}
            className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Test Server Connection
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>• The package is pre-configured for your organization</p>
          <p>
            • <strong>Completely standalone</strong> - includes all Python
            dependencies
          </p>
          <p>
            • <strong>No Python installation required</strong> - runs on any
            Windows machine
          </p>
          <p>
            • Extract the ZIP file and run the installer or executable directly
          </p>
          <p>• Keep the downloaded package secure and do not share it</p>
        </div>
      </div>
    </div>
  );
};

export default ScannerDownloadModal;
