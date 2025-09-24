/**
 * Authentication Utilities
 * Handles token management, refresh, and validation
 */

const API_BASE_URL = "http://localhost:3000";

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) {
    console.log("No token found");
    return true;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    const isExpired = payload.exp < currentTime;
    console.log("Token expiration check:", {
      currentTime,
      exp: payload.exp,
      isExpired,
      timeUntilExpiry: payload.exp - currentTime,
    });
    return isExpired;
  } catch (error) {
    console.error("Error parsing token:", error);
    return true;
  }
};

// Get token from localStorage
export const getStoredToken = () => {
  return localStorage.getItem("token");
};

// Store token in localStorage
export const storeToken = (token) => {
  localStorage.setItem("token", token);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem("token");
};

// Refresh token automatically
export const refreshToken = async () => {
  try {
    console.log("Attempting to refresh token...");
    const response = await fetch(`${API_BASE_URL}/api/test-auth/auto-refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    console.log("Token refresh response:", result);

    if (result.success) {
      storeToken(result.token);
      console.log("Token refreshed and stored successfully");
      return result.token;
    } else {
      throw new Error(result.error || "Token refresh failed");
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
};

// Get valid token (refresh if needed)
export const getValidToken = async () => {
  let token = getStoredToken();

  if (!token) {
    throw new Error("No token found. Please authenticate first.");
  }

  if (isTokenExpired(token)) {
    console.log("Token expired, refreshing...");
    try {
      token = await refreshToken();
    } catch (error) {
      console.error("Failed to refresh token:", error);
      removeToken();
      throw new Error("Token expired and refresh failed. Please log in again.");
    }
  }

  return token;
};

// Make authenticated API calls with automatic token refresh
export const authenticatedFetch = async (url, options = {}) => {
  try {
    const token = await getValidToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // If token is invalid, try to refresh and retry once
    if (response.status === 401) {
      console.log("Token invalid, refreshing and retrying...");
      const newToken = await refreshToken();

      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
          "Content-Type": "application/json",
        },
      });

      return retryResponse;
    }

    return response;
  } catch (error) {
    console.error("Authenticated fetch failed:", error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getStoredToken();
  return token && !isTokenExpired(token);
};

// Get user info from token
export const getUserFromToken = (token) => {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      tenant_id: payload.tenant_id,
      organization_name: payload.organization_name,
    };
  } catch (error) {
    return null;
  }
};
