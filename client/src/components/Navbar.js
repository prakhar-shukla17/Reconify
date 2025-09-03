"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, User, Settings, Shield, Menu, X, Package } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center min-w-0">
            <Link 
              href="/" 
              className="flex-shrink-0 flex items-center"
            >
              <div className="h-8 w-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IT</span>
              </div>
              <span className="ml-2 text-lg sm:text-xl font-semibold text-gray-900 hidden sm:block">
                Asset Manager
              </span>
              <span className="ml-2 text-lg font-semibold text-gray-900 sm:hidden">
                ITAM
              </span>
            </Link>
            
            {/* Main Navigation Links */}
            <div className="hidden md:flex items-center space-x-6 ml-8">
              {/* Navigation links can be added here in the future */}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <div className="hidden sm:flex items-center space-x-2 min-w-0 max-w-xs lg:max-w-sm">
              <span className="text-sm text-gray-700 truncate">
                Welcome, {user?.firstName || user?.username}
              </span>
              {user?.role === "admin" && (
                <Shield
                  className="h-4 w-4 text-blue-600 flex-shrink-0"
                  title="Administrator"
                />
              )}
            </div>

            {/* Mobile welcome - shorter version */}
            <div className="sm:hidden flex items-center space-x-1">
              <span className="text-xs text-gray-700 truncate max-w-20">
                {user?.firstName || user?.username}
              </span>
              {user?.role === "admin" && (
                <Shield
                  className="h-3 w-3 text-blue-600 flex-shrink-0"
                  title="Administrator"
                />
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Link>

                  {user?.role === "admin" && (
                    <>
                      <Link
                        href="/assets-management"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Assets Management
                      </Link>
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Link>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

                 {/* Mobile Navigation Menu */}
         {isMobileMenuOpen && (
           <div className="md:hidden">
             <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
               {/* Mobile navigation links can be added here in the future */}
             </div>
           </div>
         )}
      </div>
    </nav>
  );
};

export default Navbar;
