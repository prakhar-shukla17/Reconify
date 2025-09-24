"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import ItamLogo from "../../components/ItamLogo";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { login, isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      // Redirect based on user role
      if (user?.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/my-assets");
      }
    }
  }, [isAuthenticated, loading, router, user]);

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      // Redirect based on user role
      if (result.user?.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/my-assets");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black"></div>
          <div className="absolute inset-0 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 animate-slide-left">
      {/* Left Side - Login Form */}
      <div className="w-1/2 bg-white flex items-center justify-center p-8 border-r border-gray-200">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="h-10 w-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center p-1">
                <ItamLogo variant="white" width={24} height={24} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Reconify</h1>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Enter your email and password to access your account.
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Please enter a valid email address",
                  },
                })}
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember Me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  href="#"
                  className="font-medium text-gray-600 hover:text-gray-800"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-b from-gray-800 to-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:from-gray-900 hover:to-black focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Log In"
              )}
            </button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-gray-800 hover:text-black"
                >
                  Register Now.
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Promotional Content */}
      <div className="w-1/2 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gray-400 rounded-full"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-gray-300 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-gray-500 rounded-full"></div>
          <div className="absolute bottom-32 right-10 w-28 h-28 bg-gray-400 rounded-full"></div>
        </div>

        <div className="relative z-10 text-center text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-4">
            Effortlessly manage your team and operations.
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Log in to access your IT asset management dashboard and manage your
            team.
          </p>

          {/* Dashboard Preview */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">189,374</div>
                <div className="text-sm opacity-80">Total Assets</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">1,247</div>
                <div className="text-sm opacity-80">Active Users</div>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Asset Categories</div>
              <div className="flex justify-between text-sm">
                <span>Hardware</span>
                <span>Software</span>
                <span>Network</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-sm text-gray-500">
        <span>Copyright © 2025 Reconify Enterprises LTD.</span>
        <Link href="#" className="hover:text-gray-700">
          Privacy Policy
        </Link>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-left {
          animation: fade-in-left 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
