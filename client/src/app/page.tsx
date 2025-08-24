"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Monitor, Shield, Users, Package, ArrowRight, Activity, Lock } from "lucide-react"

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousemove", handleMouseMove)

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in-up")
          entry.target.classList.remove("opacity-0", "translate-y-8")
        }
      })
    }, observerOptions)

    const elementsToObserve = document.querySelectorAll(".fade-in")
    elementsToObserve.forEach((el, index) => {
      el.classList.add("opacity-0", "translate-y-8")
      setTimeout(() => observer.observe(el), index * 50)
    })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
        }}
      />

      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-gray-100/50 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-sm">AM</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                Asset Manager
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="pt-24 pb-20 text-center relative">
            <div className="fade-in opacity-0 translate-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600 mb-8 hover:bg-gray-200 transition-colors cursor-default">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Trusted by modern IT organizations
              </div>

              <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8 leading-[0.9] tracking-tight">
                IT Asset Management
                <br />
                <span className="bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                Comprehensive hardware tracking, user management, and asset monitoring for modern IT organizations. Keep
                track of every device, every user, every detail.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/register"
                  className="group inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  Start Managing Assets
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center px-8 py-4 border border-gray-200 text-gray-900 rounded-2xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-105"
                >
                  Sign In to Dashboard
                </Link>
              </div>
            </div>
          </div>

          <div className="py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Monitor,
                  title: "Hardware Tracking",
                  description:
                    "Automatically discover and track all hardware components including CPU, memory, storage, and network interfaces across your organization.",
                  color: "from-blue-500 to-blue-600",
                },
                {
                  icon: Users,
                  title: "User Management",
                  description:
                    "Manage user accounts, assign assets, and control access with role-based permissions for users and administrators.",
                  color: "from-green-500 to-green-600",
                },
                {
                  icon: Shield,
                  title: "Admin Controls",
                  description:
                    "Comprehensive admin dashboard to manage all assets, assign devices to users, and monitor system-wide statistics and performance.",
                  color: "from-purple-500 to-purple-600",
                },
                {
                  icon: Package,
                  title: "Asset Assignment",
                  description:
                    "Easily assign and track which devices belong to which users, with detailed hardware specifications and usage monitoring.",
                  color: "from-orange-500 to-orange-600",
                },
                {
                  icon: Activity,
                  title: "Real-time Monitoring",
                  description:
                    "Monitor system health, performance metrics, and hardware status in real-time with automated scanning and reporting.",
                  color: "from-red-500 to-red-600",
                },
                {
                  icon: Lock,
                  title: "Secure Access",
                  description:
                    "Role-based authentication ensures users only see their assigned assets while administrators have full system visibility and control.",
                  color: "from-gray-500 to-gray-600",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="fade-in opacity-0 translate-y-8 group cursor-pointer"
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="p-8 rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/50 backdrop-blur-sm">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-gray-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="py-24">
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-[2rem] p-16 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <div className="relative">
                  <h2 className="text-5xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
                  <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Join organizations already using our IT Asset Management system to streamline their operations.
                  </p>
                  <Link
                    href="/register"
                    className="group inline-flex items-center px-10 py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    Create Your Account
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AM</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">Asset Manager</span>
          </div>
          <p className="text-gray-500 text-lg">&copy; 2024 IT Asset Management System. All rights reserved.</p>
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
    </div>
  )
}
