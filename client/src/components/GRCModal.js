"use client"

import { useEffect } from "react"
import { Shield, ArrowRight, X } from "lucide-react"

const GRCModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleGoToGRC = () => {
    window.open("https://staging-qs-grc-app-github-sync-ehh2.frontend.encr.app/", "_blank", "noopener,noreferrer")
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/98 backdrop-blur-sm rounded-xl shadow-lg max-w-md w-full mx-4 overflow-hidden border border-gray-200/30 relative">
        <div className="relative">
          <div className="p-6 border-b border-gray-200/40 bg-gray-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">GRC Platform</h2>
                  <p className="text-sm text-gray-600">Next-Gen Compliance Suite</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 bg-gray-50/20">
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  Access advanced governance, risk management, and compliance tools powered by AI-driven insights.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="text-xs font-medium text-purple-700 mb-1">Real-time</div>
                    <div className="text-xs text-gray-600">Risk Analytics</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="text-xs font-medium text-purple-700 mb-1">AI-Powered</div>
                    <div className="text-xs text-gray-600">Compliance</div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoToGRC}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>Launch Platform</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GRCModal
