"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Activity,
  Lock,
  Zap,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import GRCModal from "../../components/GRCModal";

export default function PatchMonitoringPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isGRCModalOpen, setIsGRCModalOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client-side flag to prevent hydration issues
    setIsClient(true);

    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in-up");
          entry.target.classList.remove("opacity-0", "translate-y-8");
        }
      });
    }, observerOptions);

    const elementsToObserve = document.querySelectorAll(".fade-in");
    elementsToObserve.forEach((el, index) => {
      el.classList.add("opacity-0", "translate-y-8");
      setTimeout(() => observer.observe(el), index * 50);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
        }}
      />

      {/* Sidebar */}
      <div className="fixed left-4 top-4 bottom-4 w-64 bg-blue-800 rounded-3xl z-40 shadow-2xl border border-blue-700/20">
        <div className="p-6 h-full flex flex-col">
          {/* App Icon */}
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <img src="/itam-logo.svg" alt="ITAM Logo" className="w-6 h-6" />
            </div>
            <span className="ml-3 text-white font-bold text-lg">ManageAssets</span>
          </div>

          {/* Navigation */}
          <div className="space-y-3 flex-1">
            {/* Asset Monitoring */}
            <Link href="/" className="block">
              <div className="flex items-center p-3 rounded-2xl hover:bg-gray-900/80 transition-colors duration-200">
                <Activity className="h-6 w-6 text-gray-400" />
                <span className="ml-3 text-gray-400 font-medium">
                  Asset Monitoring
                </span>
              </div>
            </Link>

            {/* Patch Monitoring */}
            <Link href="/patches" className="block">
              <div className="flex items-center p-3 rounded-2xl bg-blue-700/90 hover:bg-blue-700 transition-colors duration-200">
                <Shield className="h-6 w-6 text-white" />
                <span className="ml-3 text-white font-medium">
                  Patch Monitoring
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <header className="fixed top-0 left-72 right-0 bg-white/90 backdrop-blur-xl border-b border-gray-100/50 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/itam-logo-white.svg"
                  alt="ITAM Logo"
                  className="w-5 h-5"
                />
              </div>
              <span className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                Patch Manager
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() =>
                  (window.location.href = "http://localhost:5001/auth/login")
                }
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                Sign In
              </button>
              <button
                onClick={() =>
                  (window.location.href = "http://localhost:5001/auth/register")
                }
                className="group relative inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-900 transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16 relative ml-72">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="pt-24 pb-20 text-center relative">
            <div className="fade-in opacity-0 translate-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-sm text-blue-600 mb-8 hover:bg-blue-200 transition-colors cursor-default">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                Secure patch management for modern IT
              </div>

              <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8 leading-[0.9] tracking-tight">
                Patch Management
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Made Secure
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                Automated patch deployment, vulnerability scanning, and security
                updates for your entire IT infrastructure. Keep your systems
                secure and up-to-date with intelligent patch management.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() =>
                    (window.location.href =
                      "http://localhost:5001/auth/register")
                  }
                  className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-blue-900 transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    Start Patch Management
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
                <button
                  onClick={() =>
                    (window.location.href = "http://localhost:5001/auth/login")
                  }
                  className="inline-flex items-center px-8 py-4 border border-gray-200 text-gray-900 rounded-2xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-105"
                >
                  Sign In to Dashboard
                </button>
              </div>
            </div>
          </div>

          <div className="py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-items-center">
              {[
                {
                  icon: Shield,
                  title: "Vulnerability Scanning",
                  description:
                    "Automated scanning to identify security vulnerabilities and missing patches across all systems in your network infrastructure.",
                },
                {
                  icon: Download,
                  title: "Automated Deployment",
                  description:
                    "Intelligent patch deployment that automatically installs security updates and patches across multiple systems simultaneously.",
                },
                {
                  icon: AlertTriangle,
                  title: "Security Alerts",
                  description:
                    "Real-time notifications for critical security patches and vulnerability alerts with priority-based patch management.",
                },
                {
                  icon: CheckCircle,
                  title: "Compliance Tracking",
                  description:
                    "Track patch compliance across your organization with detailed reporting and audit trails for regulatory requirements.",
                },
                {
                  icon: Clock,
                  title: "Scheduled Updates",
                  description:
                    "Schedule patch deployments during maintenance windows to minimize disruption to business operations.",
                },
                {
                  icon: Zap,
                  title: "Rollback Protection",
                  description:
                    "Safe patch deployment with automatic rollback capabilities in case of compatibility issues or system conflicts.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="fade-in opacity-0 translate-y-8 group cursor-pointer h-full flex"
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="p-8 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white hover:bg-gray-50 w-full flex flex-col h-full">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:bg-blue-700">
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-black transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 flex-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="py-24">
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[2rem] p-16 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
                <div className="relative">
                  <h2 className="text-5xl font-bold text-gray-900 mb-6">
                    Ready to Secure Your Systems?
                  </h2>
                  <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Join organizations already using our Patch Management system
                    to keep their infrastructure secure and up-to-date.
                  </p>
                  <button
                    onClick={() =>
                      (window.location.href =
                        "http://localhost:5001/auth/register")
                    }
                    className="group relative inline-flex items-center px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-blue-900 transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Create Your Account
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Demo Section */}
          <div className="py-24">
            <div className="fade-in opacity-0 translate-y-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  See Patch Management In Action
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Watch how our Patch Management system keeps your
                  infrastructure secure and up-to-date with automated
                  vulnerability scanning and patch deployment.
                </p>
              </div>

              <div className="max-w-6xl mx-auto">
                <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50">
                  {/* Video Container */}
                  <div className="relative aspect-video bg-gray-900">
                    {!isClient ? (
                      /* Loading placeholder during SSR */
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
                            <svg
                              className="w-8 h-8 text-white animate-pulse"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-semibold text-white mb-2">
                            Loading Video...
                          </h3>
                          <p className="text-gray-300">
                            Preparing your patch management demo
                          </p>
                        </div>
                      </div>
                    ) : videoError ? (
                      /* Error Fallback */
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-red-500/30">
                            <svg
                              className="w-8 h-8 text-red-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-semibold text-white mb-2">
                            Video Format Not Supported
                          </h3>
                          <p className="text-gray-300 mb-6">
                            Please convert your video to MP4 format for web
                            compatibility
                          </p>
                          <div className="inline-flex items-center px-6 py-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-300">
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            Convert to MP4
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Video Player */
                      <video
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        poster="/videos/patch-demo-poster.jpg"
                        onError={() => {
                          console.error("Video error occurred");
                          setVideoError(true);
                        }}
                      >
                        <source src="/videos/patch_demo.mp4" type="video/mp4" />
                        <source
                          src="/videos/patch_demo.mkv"
                          type="video/x-matroska"
                        />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-16 bg-gray-50/50 ml-72">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <img src="/itam-logo.svg" alt="ITAM Logo" className="w-5 h-5" />
            </div>
            <span className="text-xl font-semibold text-gray-900">
              Patch Manager
            </span>
          </div>
          <p className="text-gray-500 text-lg">
            &copy; 2025 IT Asset Management System. All rights reserved.
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>

      {/* GRC Modal */}
      <GRCModal
        isOpen={isGRCModalOpen}
        onClose={() => setIsGRCModalOpen(false)}
      />
    </div>
  );
}
