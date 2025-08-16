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
  removeAsset: (userId, macAddress) =>
    api.post("/auth/remove-asset", { userId, macAddress }),
};

// Hardware API calls
export const hardwareAPI = {
  getAll: () => api.get("/hardware"),
  getById: (id) => api.get(`/hardware/${id}`),
  create: (hardwareData) => api.post("/hardware", hardwareData),
};

export default api;
