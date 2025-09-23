"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { 
  CreditCard, 
  Download, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  const { user, isAuthenticated } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  useEffect(() => {
    if (isAuthenticated) {
      fetchBillingData();
    }
  }, [isAuthenticated]);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch current subscription
      const subscriptionResponse = await fetch("/api/subscription/current", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const subscriptionData = await subscriptionResponse.json();
      if (subscriptionData.success) {
        setCurrentSubscription(subscriptionData.subscription);
      }

      // Fetch billing history
      const historyResponse = await fetch("/api/subscription/billing/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const historyData = await historyResponse.json();
      if (historyData.success) {
        setBillingHistory(historyData.payments);
      }

      // Fetch usage
      const usageResponse = await fetch("/api/subscription/usage", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const usageData = await usageResponse.json();
      if (usageData.success) {
        setUsage(usageData.usage);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    if (confirm("Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/subscription/${currentSubscription.id}/cancel`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          alert("Subscription cancelled successfully");
          fetchBillingData();
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        alert("Failed to cancel subscription. Please try again.");
      }
    }
  };

  const handleDownloadInvoice = async (paymentId) => {
    // This would typically generate and download an invoice
    alert("Invoice download functionality would be implemented here");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
              <p className="mt-2 text-gray-600">
                Manage your subscription, view usage, and download invoices
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/subscription"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Change Plan
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Subscription */}
        {currentSubscription ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
              {currentSubscription.status === "active" && (
                <button
                  onClick={handleCancelSubscription}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{currentSubscription.plan_name}</h3>
                <p className="text-gray-600">
                  {formatPrice(currentSubscription.amount, currentSubscription.currency)} / 
                  {currentSubscription.billing_cycle === "yearly" ? "year" : "month"}
                </p>
                {currentSubscription.isTrial && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Trial ends {formatDate(currentSubscription.trial_end_date)}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Billing Cycle</h4>
                <p className="text-gray-600 capitalize">{currentSubscription.billing_cycle}</p>
                {currentSubscription.end_date && (
                  <p className="text-sm text-gray-500 mt-1">
                    Next billing: {formatDate(currentSubscription.end_date)}
                  </p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(currentSubscription.status)}`}>
                  {getStatusIcon(currentSubscription.status)}
                  <span className="ml-1 capitalize">{currentSubscription.status}</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h2>
              <p className="text-gray-600 mb-4">
                You're currently on the free plan. Upgrade to unlock premium features.
              </p>
              <Link
                href="/subscription"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Plans
              </Link>
            </div>
          </div>
        )}

        {/* Usage Overview */}
        {usage && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Assets</h3>
                  <span className="text-sm text-gray-500">
                    {usage.current_assets} / {usage.limits.max_assets}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((usage.current_assets / usage.limits.max_assets) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Users</h3>
                  <span className="text-sm text-gray-500">
                    {usage.current_users} / {usage.limits.max_users}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((usage.current_users / usage.limits.max_users) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Scans This Month</h3>
                  <span className="text-sm text-gray-500">
                    {usage.scans_this_month} / {usage.limits.max_scans_per_month}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((usage.scans_this_month / usage.limits.max_scans_per_month) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
            <button
              onClick={fetchBillingData}
              className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
          
          {billingHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingHistory.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1 capitalize">{payment.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.status === "completed" && (
                          <button
                            onClick={() => handleDownloadInvoice(payment.id)}
                            className="flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No billing history</h3>
              <p className="text-gray-600">
                You haven't made any payments yet. Your billing history will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


