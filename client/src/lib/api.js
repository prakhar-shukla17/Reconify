
import axios from "axios";
import Cookies from "js-cookie";
import { createCache, createRequestBatcher, debounce } from "../utils/performance.js";

const API_BASE_URL = "/api";

// Create performance-optimized caches
const apiCache = createCache({
  maxSize: 200,
  ttl: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000
});

// Create request batcher for bulk operations
const requestBatcher = createRequestBatcher(20, 100);

// Create axios instance with performance optimizations
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
  // Note: HTTP agents are not needed in browser environment
});

// Enhanced error handling wrapper
const handleApiError = (error) => {
  console.log("handleApiError called with:", error);
  console.log("error.response:", error.response);
  console.log("error.request:", error.request);
  console.log("error.message:", error.message);
  
  // Handle different types of errors
  if (error.response) {
    // Server responded with error status
    const errorData = error.response.data;
    console.log("Server error response data:", errorData);
    return {
      userMessage: errorData?.error || errorData?.message || `Server error (${error.response.status})`,
      status: error.response.status,
      data: errorData
    };
  } else if (error.request) {
    // Request was made but no response received
    console.log("No response received from server");
    return {
      userMessage: "No response from server. Please check your connection.",
      status: null,
      data: null
    };
  } else {
    // Something else happened
    console.log("Other type of error:", error.message);
    return {
      userMessage: error.message || "An unexpected error occurred",
      status: null,
      data: null
    };
  }
};

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("API Request:", {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers,
      token: token ? "Present" : "Missing"
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log("API Response Success:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    // Use enhanced error handling
    const errorInfo = handleApiError(error);
    
    console.error("API Error:", {
      status: errorInfo.status,
      url: error.config?.url,
      data: errorInfo.data,
      message: errorInfo.userMessage,
      fullError: error
    });
    
    // Add enhanced error information to the error object
    error.userMessage = errorInfo.userMessage;
    error.errorStatus = errorInfo.status;
    error.errorData = errorInfo.data;
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove("token");
      Cookies.remove("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Optimized API wrapper with caching
const createOptimizedAPI = (endpoint, options = {}) => {
  const { cacheKey, ttl = 5 * 60 * 1000, enableCache = true } = options;
  
  return {
    get: async (params = {}) => {
      const key = cacheKey ? `${endpoint}_${JSON.stringify(params)}` : null;
      
      if (enableCache && key && apiCache.has(key)) {
        return apiCache.get(key);
      }
      
      const response = await api.get(endpoint, { params });
      
      if (enableCache && key) {
        apiCache.set(key, response);
      }
      
      return response;
    },
    
    post: async (data) => {
      const response = await api.post(endpoint, data);
      
      // Invalidate related caches
      if (enableCache) {
        const keysToInvalidate = Array.from(apiCache.keys()).filter(key => 
          key.includes(endpoint.split('/')[0])
        );
        keysToInvalidate.forEach(key => apiCache.delete(key));
      }
      
      return response;
    },
    
    put: async (data) => {
      const response = await api.put(endpoint, data);
      
      // Invalidate related caches
      if (enableCache) {
        const keysToInvalidate = Array.from(apiCache.keys()).filter(key => 
          key.includes(endpoint.split('/')[0])
        );
        keysToInvalidate.forEach(key => apiCache.delete(key));
      }
      
      return response;
    },
    
    delete: async () => {
      const response = await api.delete(endpoint);
      
      // Invalidate related caches
      if (enableCache) {
        const keysToInvalidate = Array.from(apiCache.keys()).filter(key => 
          key.includes(endpoint.split('/')[0])
        );
        keysToInvalidate.forEach(key => apiCache.delete(key));
      }
      
      return response;
    }
  };
};

// Auth API calls with caching
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => createOptimizedAPI("/auth/profile", { 
    cacheKey: "profile", 
    ttl: 15 * 60 * 1000 
  }).get(),
  updateProfile: (userData) => api.put("/auth/profile", userData),
  getAllUsers: () => createOptimizedAPI("/auth/users", { 
    cacheKey: "users", 
    ttl: 10 * 60 * 1000 
  }).get(),
  assignAsset: (userId, macAddress) =>
    api.post("/auth/assign-asset", { userId, macAddress }),
  assignMultipleAssets: (userId, macAddresses) =>
    api.post("/auth/assign-asset", { userId, macAddresses }),
  removeAsset: (userId, macAddress) =>
    api.post("/auth/remove-asset", { userId, macAddress }),
  removeMultipleAssets: (userId, macAddresses) =>
    api.post("/auth/remove-asset", { userId, macAddresses }),
  bulkAssignAssets: (assignments) =>
    api.post("/auth/bulk-assign", { assignments }),
  getAssignmentStatistics: () => createOptimizedAPI("/auth/assignment-stats", { 
    cacheKey: "assignment_stats", 
    ttl: 5 * 60 * 1000 
  }).get(),
  getUnassignedAssets: () => createOptimizedAPI("/auth/unassigned-assets", { 
    cacheKey: "unassigned_assets", 
    ttl: 2 * 60 * 1000 
  }).get(),
  createUser: (userData) => api.post("/auth/create-user", userData),
  sendEmailToUsers: (emailData) => api.post("/auth/send-email", emailData),
  sendWarrantyAlertEmail: (alertData) => api.post("/auth/send-warranty-alert-email", alertData),
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/auth/users/${userId}`, userData),
};

// Hardware API calls with caching
export const hardwareAPI = {
  getAll: (params = {}) => createOptimizedAPI("/hardware", { 
    cacheKey: "hardware_all", 
    ttl: 10 * 60 * 1000 
  }).get(params),
  getById: (id) => createOptimizedAPI(`/hardware/${id}`, { 
    cacheKey: `hardware_${id}`, 
    ttl: 15 * 60 * 1000 
  }).get(),
  create: (hardwareData) => api.post("/hardware", hardwareData),
  updateAssetInfo: (id, assetInfo) =>
    api.put(`/hardware/${id}/asset-info`, assetInfo),
  updateUserAssetInfo: (id, assetInfo) =>
    api.put(`/hardware/${id}/user-asset-info`, assetInfo),
  updateComponentWarranty: (id, componentType, componentIndex, warrantyInfo) =>
    api.put(`/hardware/${id}/component-warranty`, {
      componentType,
      componentIndex,
      warrantyInfo,
    }),
  updateUserComponentWarranty: (
    id,
    componentType,
    componentIndex,
    warrantyInfo
  ) =>
    api.put(`/hardware/${id}/user-component-warranty`, {
      componentType,
      componentIndex,
      warrantyInfo,
    }),
  getExpiringWarranties: (days = 30) =>
    createOptimizedAPI(`/hardware/admin/expiring-warranties?days=${days}`, { 
      cacheKey: `warranties_${days}`, 
      ttl: 5 * 60 * 1000 
    }).get(),
  getWarrantyStats: () => createOptimizedAPI("/hardware/admin/warranty-stats", { 
    cacheKey: "warranty_stats", 
    ttl: 10 * 60 * 1000 
  }).get(),
  getStats: () => createOptimizedAPI("/hardware/stats", { 
    cacheKey: "hardware_stats", 
    ttl: 5 * 60 * 1000 
  }).get(),
  // Manual asset entry functions
  createManualAsset: (assetData) => api.post("/hardware/manual", assetData),
  getManualEntries: () => createOptimizedAPI("/hardware/admin/manual-entries", { 
    cacheKey: "manual_entries", 
    ttl: 10 * 60 * 1000 
  }).get(),
  getUnassignedAssets: () => createOptimizedAPI("/hardware/admin/unassigned", { 
    cacheKey: "hardware_unassigned", 
    ttl: 5 * 60 * 1000 
  }).get(),
};

// Software API calls with caching
export const softwareAPI = {
  getAll: (params = {}) => createOptimizedAPI("/software", { 
    cacheKey: "software_all", 
    ttl: 10 * 60 * 1000 
  }).get(params),
  getById: (id) => createOptimizedAPI(`/software/${id}`, { 
    cacheKey: `software_${id}`, 
    ttl: 15 * 60 * 1000 
  }).get(),
  create: (softwareData) => api.post("/software", softwareData),
  getStatistics: () => createOptimizedAPI("/software/admin/statistics", { 
    cacheKey: "software_stats", 
    ttl: 10 * 60 * 1000 
  }).get(),
  search: (params) => createOptimizedAPI("/software/admin/search", { 
    cacheKey: `software_search_${JSON.stringify(params)}`, 
    ttl: 5 * 60 * 1000 
  }).get(params),
  getByVendor: (vendor) => createOptimizedAPI(`/software/admin/vendor/${vendor}`, { 
    cacheKey: `software_vendor_${vendor}`, 
    ttl: 15 * 60 * 1000 
  }).get(),
  getOutdated: () => createOptimizedAPI("/software/admin/outdated", { 
    cacheKey: "software_outdated", 
    ttl: 5 * 60 * 1000 
  }).get(),
  delete: (id) => api.delete(`/software/${id}`),
};

// Alerts API calls with caching
export const alertsAPI = {
  getWarrantyAlerts: (days = 30, page = 1, limit = 20, filter = "all") =>
    createOptimizedAPI(`/alerts/warranty?days=${days}&page=${page}&limit=${limit}&filter=${filter}`, { 
      cacheKey: `alerts_warranty_${days}_${page}_${limit}_${filter}`, 
      ttl: 2 * 60 * 1000 
    }).get(),
  getStatistics: () => createOptimizedAPI("/alerts/statistics", { 
    cacheKey: "alerts_stats", 
    ttl: 5 * 60 * 1000 
  }).get(),
};

// Tickets API calls with caching
export const ticketsAPI = {
  create: (ticketData) => api.post("/tickets", ticketData),
  getAll: (params = {}, forceRefresh = false) => {
    if (forceRefresh) {
      // Clear tickets cache before making the request
      const keysToInvalidate = Array.from(apiCache.keys()).filter(key => 
        key.includes('tickets')
      );
      keysToInvalidate.forEach(key => apiCache.delete(key));
    }
    return createOptimizedAPI("/tickets", { 
      cacheKey: `tickets_all_${JSON.stringify(params)}`, 
      ttl: 2 * 60 * 1000 
    }).get(params);
  },
  getById: (id) => createOptimizedAPI(`/tickets/${id}`, { 
    cacheKey: `ticket_${id}`, 
    ttl: 5 * 60 * 1000 
  }).get(),
  update: (id, updateData) => api.put(`/tickets/${id}`, updateData),
  addComment: (id, commentData) =>
    api.post(`/tickets/${id}/comments`, commentData),
  getStatistics: () => createOptimizedAPI("/tickets/admin/statistics", { 
    cacheKey: "tickets_stats", 
    ttl: 5 * 60 * 1000 
  }).get(),
  getUserAssets: () => createOptimizedAPI("/tickets/user-assets", { 
    cacheKey: "tickets_user_assets", 
    ttl: 10 * 60 * 1000 
  }).get(),

  // Admin management endpoints
  updateStatus: (id, statusData) =>
    api.patch(`/tickets/${id}/status`, statusData),
  assignTicket: (id, assignmentData) =>
    api.patch(`/tickets/${id}/assign`, assignmentData),
  closeTicket: (id, closeData) => api.post(`/tickets/${id}/close`, closeData),
  getAdminUsers: () => createOptimizedAPI("/tickets/admin/users", { 
    cacheKey: "tickets_admin_users", 
    ttl: 15 * 60 * 1000 
  }).get(),
};

// Telemetry API calls with caching
export const telemetryAPI = {
  getTelemetry: (macAddress) => createOptimizedAPI(`/telemetry/${macAddress}`, { 
    cacheKey: `telemetry_${macAddress}`, 
    ttl: 1 * 60 * 1000 
  }).get(),
  getHealthSummary: () => createOptimizedAPI("/telemetry/health-summary", { 
    cacheKey: "telemetry_health", 
    ttl: 2 * 60 * 1000 
  }).get(),
};

// Scanner API calls
export const scannerAPI = {
  getPlatforms: () => createOptimizedAPI("/scanner/platforms", { 
    cacheKey: "scanner_platforms", 
    ttl: 60 * 60 * 1000 // 1 hour - platforms don't change often
  }).get(),
  downloadScanner: (platform) =>
    api.get(`/scanner/download?platform=${platform}`, {
      responseType: "blob",
    }),
};

// Cache management utilities
export const cacheUtils = {
  clearAll: () => apiCache.clear(),
  clearByPattern: (pattern) => {
    const keysToDelete = Array.from(apiCache.keys()).filter(key => 
      key.includes(pattern)
    );
    keysToDelete.forEach(key => apiCache.delete(key));
  },
  getCacheStats: () => ({
    size: apiCache.size,
    keys: Array.from(apiCache.keys())
  })
};

export default api;
