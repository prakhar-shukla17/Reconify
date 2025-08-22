"use client";

import { Loader2 } from "lucide-react";

const LoadingSkeleton = ({ 
  type = "default", 
  className = "",
  size = "default" 
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-6 w-6",
    large: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const typeVariants = {
    default: (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    ),
    card: (
      <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    ),
    table: (
      <div className={`bg-white rounded-lg shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-t-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 border-t border-gray-200"></div>
          ))}
        </div>
      </div>
    ),
    modal: (
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${className}`}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    ),
    spinner: (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      </div>
    )
  };

  return typeVariants[type] || typeVariants.default;
};

export default LoadingSkeleton;
