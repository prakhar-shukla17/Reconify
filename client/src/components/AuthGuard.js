"use client";

import { useState, useEffect } from "react";
import {
  getValidToken,
  refreshToken,
  isAuthenticated,
} from "../utils/authUtils";

export default function AuthGuard({ children, fallback }) {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("AuthGuard: Checking authentication...");

      if (isAuthenticated()) {
        console.log("AuthGuard: User is authenticated");
        setIsAuth(true);
      } else {
        console.log(
          "AuthGuard: User not authenticated, attempting auto-refresh..."
        );
        // Try to refresh token automatically
        try {
          await refreshToken();
          console.log("AuthGuard: Auto-refresh successful");
          setIsAuth(true);
        } catch (refreshError) {
          console.log("AuthGuard: Auto-refresh failed:", refreshError);
          setIsAuth(false);
        }
      }
    } catch (error) {
      console.error("AuthGuard: Authentication check failed:", error);
      setError("Authentication failed");
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      await refreshToken();
      setIsAuth(true);
    } catch (error) {
      setError("Failed to refresh token. Please create a new account.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Authentication Required
              </h2>
              <p className="text-gray-600 mb-6">
                Your session has expired. Please refresh your authentication to
                continue.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {loading ? "Refreshing..." : "Refresh Authentication"}
              </button>
              <a
                href="/auth-test"
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-semibold inline-block"
              >
                Create New Account
              </a>
              <a
                href="/subscription"
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-semibold inline-block"
              >
                Back to Plans
              </a>
            </div>
          </div>
        </div>
      )
    );
  }

  return children;
}
