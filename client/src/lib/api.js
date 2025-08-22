import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove("token");
      Cookies.remove("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (userData) => api.put("/auth/profile", userData),
  getAllUsers: () => api.get("/auth/users"),
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
  getAssignmentStatistics: () => api.get("/auth/assignment-stats"),
  getUnassignedAssets: () => api.get("/auth/unassigned-assets"),
};

// Hardware API calls
export const hardwareAPI = {
  getAll: (params = {}) => api.get("/hardware", { params }),
  getById: (id) => api.get(`/hardware/${id}`),
  create: (hardwareData) => api.post("/hardware", hardwareData),
  updateAssetInfo: (id, assetInfo) =>
    api.put(`/hardware/${id}/asset-info`, assetInfo),
  updateComponentWarranty: (id, componentType, componentIndex, warrantyInfo) =>
    api.put(`/hardware/${id}/component-warranty`, {
      componentType,
      componentIndex,
      warrantyInfo,
    }),
  getExpiringWarranties: (days = 30) =>
    api.get(`/hardware/admin/expiring-warranties?days=${days}`),
  getWarrantyStats: () => api.get("/hardware/admin/warranty-stats"),
  getStats: () => api.get("/hardware/stats"),
  // Manual asset entry functions
  createManualAsset: (assetData) => api.post("/hardware/manual", assetData),
  getManualEntries: () => api.get("/hardware/admin/manual-entries"),
  getUnassignedAssets: () => api.get("/hardware/admin/unassigned"),
};

// Software API calls
export const softwareAPI = {
  getAll: (params = {}) => api.get("/software", { params }),
  getById: (id) => api.get(`/software/${id}`),
  create: (softwareData) => api.post("/software", softwareData),
  getStatistics: () => api.get("/software/admin/statistics"),
  search: (params) => api.get("/software/admin/search", { params }),
  getByVendor: (vendor) => api.get(`/software/admin/vendor/${vendor}`),
  getOutdated: () => api.get("/software/admin/outdated"),
  delete: (id) => api.delete(`/software/${id}`),
};

// Alerts API calls
export const alertsAPI = {
  getWarrantyAlerts: (days = 30) => api.get(`/alerts/warranty?days=${days}`),
  getStatistics: () => api.get("/alerts/statistics"),
};

// Tickets API calls
export const ticketsAPI = {
  create: (ticketData) => api.post("/tickets", ticketData),
  getAll: (params = {}) => api.get("/tickets", { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  update: (id, updateData) => api.put(`/tickets/${id}`, updateData),
  addComment: (id, commentData) =>
    api.post(`/tickets/${id}/comments`, commentData),
  getStatistics: () => api.get("/tickets/admin/statistics"),
  getUserAssets: () => api.get("/tickets/user-assets"),

  // Admin management endpoints
  updateStatus: (id, statusData) =>
    api.patch(`/tickets/${id}/status`, statusData),
  assignTicket: (id, assignmentData) =>
    api.patch(`/tickets/${id}/assign`, assignmentData),
  closeTicket: (id, closeData) => api.post(`/tickets/${id}/close`, closeData),
  getAdminUsers: () => api.get("/tickets/admin/users"),
};

// Telemetry API calls
export const telemetryAPI = {
  getTelemetry: (macAddress) => api.get(`/telemetry/${macAddress}`),
  getHealthSummary: () => api.get("/telemetry/health-summary"),
};

export default api;
