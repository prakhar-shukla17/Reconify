/**
 * AlertsPanel Component - Performance Optimized
 * 
 * Displays warranty alert statistics with component modal support.
 * Features:
 * - Lazy loading with skeleton states
 * - Smart caching to prevent unnecessary API calls
 * - Debounced filter changes
 * - Optimized re-renders
 * - Minimal API calls
 */
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  CheckCircle,
  AlertTriangle,
  BellRing,
  Cpu,
  MemoryStick,
  HardDrive,
  X,
  Zap,
  Mail,
} from "lucide-react";
import { alertsAPI } from "../lib/api";
import toast from "react-hot-toast";
import AlertEmailModal from "./AlertEmailModal";

const AlertsPanel = ({ className = "", users = [] }) => {
  // Core state
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  // Filter state
  const [filter, setFilter] = useState("all");
  const [alertDays, setAlertDays] = useState(30);
  
  // Modal state
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [selectedComponentType, setSelectedComponentType] = useState(null);
  const [componentModalAlerts, setComponentModalAlerts] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Performance optimizations
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  const filterTimeoutRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Cache configuration
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  const DEBOUNCE_DELAY = 300; // 300ms debounce for filter changes

  // Memoized cache key
  const cacheKey = useMemo(() => `${alertDays}-${filter}`, [alertDays, filter]);

  // Check if cache is valid
  const isCacheValid = useCallback((key) => {
    const cached = cacheRef.current.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, []);

  // Cleanup old cache entries
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    for (const [key, value] of cacheRef.current.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  // Handle email alert
  const handleEmailAlert = useCallback((alert) => {
    setSelectedAlert(alert);
    setShowEmailModal(true);
  }, []);

  // Fetch alerts with caching
  const fetchAlerts = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh && isCacheValid(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      setAlerts(cached.alerts);
      setSummary(cached.summary);
      setError(null);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await alertsAPI.getWarrantyAlerts(
        alertDays, 
        1, 
        50, // Reduced from 1000 to 50 for statistics only
        filter
      );

      // Cache the response
      cacheRef.current.set(cacheKey, {
        alerts: response.data.alerts,
        summary: response.data.summary,
        timestamp: Date.now()
      });

      setAlerts(response.data.alerts);
      setSummary(response.data.summary);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching alerts:", err);
        setError("Failed to fetch warranty alerts");
      }
    } finally {
      setLoading(false);
    }
  }, [alertDays, filter, cacheKey, isCacheValid]);

  // Debounced filter change handler
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    
    // Clear existing timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Debounce the API call
    filterTimeoutRef.current = setTimeout(() => {
      fetchAlerts(true); // Force refresh for filter changes
    }, DEBOUNCE_DELAY);
  }, [fetchAlerts]);

  // Debounced alert days change handler
  const handleAlertDaysChange = useCallback((newDays) => {
    setAlertDays(newDays);
    
    // Clear existing timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Debounce the API call
    filterTimeoutRef.current = setTimeout(() => {
      fetchAlerts(true); // Force refresh for days changes
    }, DEBOUNCE_DELAY);
  }, [fetchAlerts]);

  // Initial load effect
  useEffect(() => {
    if (isInitialLoad.current) {
      fetchAlerts();
      isInitialLoad.current = false;
    }
  }, []); // Only run once on mount

  // Cleanup effect
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupCache, 5 * 60 * 1000); // Clean every 5 minutes
    
    return () => {
      clearInterval(cleanupInterval);
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cleanupCache]);

  // Memoized component icon getter
  const getComponentIcon = useMemo(() => ({
    cpu: Cpu,
    gpu: Zap,
    memory: MemoryStick,
    storage: HardDrive,
    asset: HardDrive,
  }), []);

  // Memoized component counts
  const componentCounts = useMemo(() => {
    const counts = {
      cpu: 0,
      gpu: 0,
      memory: 0,
      storage: 0,
      asset: 0,
    };

    if (Array.isArray(alerts)) {
      alerts.forEach(alert => {
        if (alert?.type === "asset_warranty") {
          counts.asset++;
        } else if (alert?.component?.type && counts.hasOwnProperty(alert.component.type)) {
          counts[alert.component.type]++;
        }
      });
    }

    return counts;
  }, [alerts]);

  // Memoized component name getter
  const getComponentName = useMemo(() => ({
    cpu: "CPU",
    gpu: "GPU",
    memory: "Memory",
    storage: "Storage",
    asset: "Asset",
  }), []);

  // Open component modal with smart caching
  const openComponentModal = useCallback(async (componentType) => {
    try {
      setSelectedComponentType(componentType);
      setShowComponentModal(true);
      setModalLoading(true);
      
      // Try to use cached data first
      const allCacheKey = `${alertDays}-all`;
      let allAlerts = [];
      
      if (isCacheValid(allCacheKey)) {
        const cached = cacheRef.current.get(allCacheKey);
        allAlerts = cached.alerts;
      } else {
        // Fetch all alerts for this component type
        const response = await alertsAPI.getWarrantyAlerts(alertDays, 1, 1000, "all");
        allAlerts = response.data.alerts;
        
        // Cache this response
        cacheRef.current.set(allCacheKey, {
          alerts: response.data.alerts,
          summary: response.data.summary,
          timestamp: Date.now()
        });
      }
      
      // Filter alerts for the specific component type
      const componentAlerts = componentType === "asset" 
        ? allAlerts.filter(alert => alert.type === "asset_warranty")
        : allAlerts.filter(alert => alert.component?.type === componentType);
      
      setComponentModalAlerts(componentAlerts);
    } catch (error) {
      console.error("Error fetching component alerts:", error);
      toast.error("Failed to load component alerts");
    } finally {
      setModalLoading(false);
    }
  }, [alertDays, isCacheValid]);

  // Close component modal
  const closeComponentModal = useCallback(() => {
    setShowComponentModal(false);
    setSelectedComponentType(null);
    setComponentModalAlerts([]);
  }, []);

  // Memoized component alert tile
  const ComponentAlertTile = useCallback(({ componentType, count }) => {
    const ComponentIcon = getComponentIcon[componentType] || HardDrive;
    const safeCount = count || 0;
    
    const getTileColor = () => {
      if (safeCount === 0) return "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200";
      if (safeCount <= 2) return "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200";
      if (safeCount <= 5) return "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200";
      return "bg-gradient-to-br from-red-50 to-red-100 border-red-200";
    };

    const getTextColor = () => {
      if (safeCount === 0) return "text-gray-600";
      if (safeCount <= 2) return "text-yellow-700";
      if (safeCount <= 5) return "text-orange-700";
      return "text-red-700";
    };

    const getIconBgColor = () => {
      if (safeCount === 0) return "bg-gray-200";
      if (safeCount <= 2) return "bg-yellow-200";
      if (safeCount <= 5) return "bg-orange-200";
      return "bg-red-200";
    };

    return (
      <div className={`border-2 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer ${getTileColor()}`}>
        <button
          onClick={() => openComponentModal(componentType)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${getIconBgColor()} rounded-2xl flex items-center justify-center`}>
              <ComponentIcon className={`h-6 w-6 ${getTextColor()}`} />
            </div>
            <span className={`text-3xl font-bold ${getTextColor()}`}>
              {safeCount}
            </span>
          </div>
          <div>
            <h4 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
              {getComponentName[componentType]} Alerts
            </h4>
            <p className="text-sm text-gray-600">
              {safeCount === 0 ? 'No alerts' : `${safeCount} alert${safeCount !== 1 ? 's' : ''} detected`}
            </p>
          </div>
        </button>
      </div>
    );
  }, [getComponentIcon, getComponentName, openComponentModal]);

  const ComponentModal = () => {
    if (!showComponentModal || !selectedComponentType) return null;

    const componentAlerts = componentModalAlerts;
    const ComponentIcon = getComponentIcon[selectedComponentType] || HardDrive;

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        closeComponentModal();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeComponentModal();
      }
    };

    // Add keyboard event listener when modal is open
    useEffect(() => {
      if (showComponentModal) {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
          document.body.style.overflow = 'unset'; // Restore scrolling
        };
      }
    }, [showComponentModal]);

    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 ease-in-out"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100 animate-in fade-in-0 zoom-in-95">
          <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-black text-white px-8 py-6 rounded-t-3xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ComponentIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {getComponentName[selectedComponentType]} Warranty Alerts
                  </h3>
                  <p className="text-gray-300 text-sm mt-1">
                    {componentAlerts.length} PC{componentAlerts.length !== 1 ? 's' : ''} with expiring warranties
                  </p>
                </div>
              </div>
              <button
                onClick={closeComponentModal}
                className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-8 py-6">
            {modalLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded-2xl w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded-2xl w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded-2xl w-2/3 mt-2"></div>
              </div>
            ) : componentAlerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  No {getComponentName[selectedComponentType]} Warranty Alerts
                </h4>
                <p className="text-gray-500">
                  All {getComponentName[selectedComponentType].toLowerCase()} warranties are valid
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {componentAlerts.map((alert, index) => (
                  <div 
                    key={alert.id} 
                    className="bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-gray-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <HardDrive className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900 text-lg">
                            {alert.hostname || "Unknown Device"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            MAC: {alert.macAddress}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <HardDrive className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">Component</span>
                        </div>
                        <p className="text-gray-900">
                          {alert.component?.name || "Asset"}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-gray-700">Expires</span>
                        </div>
                        <p className="text-gray-900">
                          {new Date(alert.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-gray-700">Time Remaining</span>
                        </div>
                        <p className={`font-medium transition-colors duration-200 ${
                          alert.daysUntilExpiry <= 7 ? 'text-red-600' :
                          alert.daysUntilExpiry <= 14 ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          {alert.daysUntilExpiry === 0 ? 'Today' : `${alert.daysUntilExpiry} days`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Loading skeleton component
  const LoadingSkeleton = useCallback(() => (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Statistics skeleton */}
        <div className="mb-6">
          <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ), [className]);

  // Error state component
  const ErrorState = useCallback(() => (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-center h-32 text-red-600">
        <X className="h-8 w-8 mr-2" />
        <span>{error}</span>
      </div>
    </div>
  ), [error, className]);

  // Main content component
  const MainContent = useCallback(() => (
    <div className={`bg-white rounded-3xl border border-gray-200 shadow-sm ${className}`}>
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
              {alerts.length > 0 ? (
                <BellRing className="h-6 w-6 text-white" />
              ) : (
                <BellRing className="h-6 w-6 text-white opacity-80" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Warranty Alerts
              </h3>
              <p className="text-gray-600 text-sm">
                Monitor expiring warranties and critical alerts
              </p>
            </div>
            {(alerts && alerts.length > 0) && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold px-4 py-2 rounded-2xl shadow-lg">
                {summary.total || 0} Active Alerts
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={alertDays}
              onChange={(e) => handleAlertDaysChange(parseInt(e.target.value))}
              className="px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 bg-white hover:border-gray-400 transition-all duration-300 text-sm font-medium"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 90 days</option>
            </select>

            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 bg-white hover:border-gray-400 transition-all duration-300 text-sm font-medium"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              onClick={() => fetchAlerts(true)}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="font-medium">Loading...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-medium">Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">
            Component Alert Statistics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <ComponentAlertTile
              componentType="cpu"
              count={componentCounts.cpu || 0}
            />
            <ComponentAlertTile
              componentType="gpu"
              count={componentCounts.gpu || 0}
            />
            <ComponentAlertTile
              componentType="memory"
              count={componentCounts.memory || 0}
            />
            <ComponentAlertTile
              componentType="storage"
              count={componentCounts.storage || 0}
            />
            <ComponentAlertTile
              componentType="asset"
              count={componentCounts.asset || 0}
            />
          </div>
        </div>

        {/* Alerts List */}
        <div className="mt-8">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">
            Active Warranty Alerts ({alerts.length})
          </h4>
          
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h5 className="text-lg font-medium text-gray-900 mb-2">All Good!</h5>
              <p className="text-gray-600">No warranty alerts for the selected time period.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, index) => {
                const severityColor = alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                                    alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                                    alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                                    'border-blue-200 bg-blue-50';
                
                const severityTextColor = alert.severity === 'critical' ? 'text-red-800 bg-red-100' :
                                        alert.severity === 'high' ? 'text-orange-800 bg-orange-100' :
                                        alert.severity === 'medium' ? 'text-yellow-800 bg-yellow-100' :
                                        'text-blue-800 bg-blue-100';

                return (
                  <div
                    key={alert.id}
                    className={`${severityColor} rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:scale-[1.01]`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-lg">
                            {alert.hostname || "Unknown Device"}
                          </h4>
                          {alert.macAddress && (
                            <p className="text-sm text-gray-600 font-mono">
                              MAC: {alert.macAddress}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${severityTextColor}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleEmailAlert(alert)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Send alert email to users"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <HardDrive className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">Component</span>
                        </div>
                        <p className="text-gray-900">
                          {alert.component?.name || "Asset"}
                        </p>
                        {alert.component?.type && (
                          <p className="text-xs text-gray-500 capitalize">
                            Type: {alert.component.type}
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-gray-700">Expires</span>
                        </div>
                        <p className="text-gray-900">
                          {new Date(alert.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-gray-700">Time Remaining</span>
                        </div>
                        <p className={`font-medium ${
                          alert.daysUntilExpiry <= 7 ? 'text-red-600' :
                          alert.daysUntilExpiry <= 14 ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          {alert.daysUntilExpiry === 0 ? 'Today' : `${alert.daysUntilExpiry} days`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ComponentModal />
      
      {/* Alert Email Modal */}
      <AlertEmailModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setSelectedAlert(null);
        }}
        alert={selectedAlert}
        users={users}
      />
    </div>
  ), [alerts, summary, componentCounts, ComponentAlertTile, ComponentModal, handleAlertDaysChange, handleFilterChange, className, loading, fetchAlerts, showEmailModal, selectedAlert, users, handleEmailAlert]);

  // Render based on state
  if (loading && alerts.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState />;
  }

  return <MainContent />;
};

export default AlertsPanel;


