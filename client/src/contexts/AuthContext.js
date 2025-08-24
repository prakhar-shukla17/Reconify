"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { authAPI } from "../lib/api";
import toast from "react-hot-toast";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = Cookies.get("token");
      const savedUser = Cookies.get("user");

      if (token && savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);

        // Verify token is still valid
        try {
          const response = await authAPI.getProfile();
          setUser(response.data.user);
        } catch (error) {
          // Token invalid, clear auth
          logout();
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      const { user: userData, token } = response.data;

      // Save to cookies
      Cookies.set("token", token, { expires: 7 }); // 7 days
      Cookies.set("user", JSON.stringify(userData), { expires: 7 });

      setUser(userData);
      setIsAuthenticated(true);

      toast.success("Login successful!");
      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Login failed";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      const { user: newUser, token } = response.data;

      // Save to cookies
      Cookies.set("token", token, { expires: 7 });
      Cookies.set("user", JSON.stringify(newUser), { expires: 7 });

      setUser(newUser);
      setIsAuthenticated(true);

      toast.success("Registration successful!");
      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Registration failed";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 7 });

      toast.success("Profile updated successfully!");
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Profile update failed";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
