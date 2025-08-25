"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      if (requireAdmin && user?.role !== "admin") {
        router.push("/my-assets");
        return;
      }
    }
  }, [isAuthenticated, user, loading, router, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && user?.role !== "admin") {
    return null;
  }

  return children;
};

export default ProtectedRoute;
