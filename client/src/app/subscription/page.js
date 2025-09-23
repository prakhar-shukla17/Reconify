"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Check, X, Star, CreditCard, Shield, Zap, Users, HardDrive, BarChart3 } from "lucide-react";
import Link from "next/link";
import PaymentModal from "../../components/PaymentModal";

export default function SubscriptionPage() {
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) {
      fetchCurrentSubscription();
    }
  }, [isAuthenticated]);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/subscription/plans");
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/subscription/current", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCurrentSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Error fetching current subscription:", error);
    }
  };

  const handleSelectPlan = (plan) => {
    if (plan.plan_type === "free") {
      return; // Free plan doesn't need selection
    }
    setSelectedPlan(plan);
  };

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = "/login";
      return;
    }

    if (plan.plan_type === "free") {
      // Handle free plan signup
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/subscription/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan_id: plan.id,
            billing_cycle: billingCycle,
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert("Free plan activated successfully!");
          fetchCurrentSubscription();
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error("Error creating subscription:", error);
        alert("Failed to create subscription. Please try again.");
      }
      return;
    }

    // For paid plans, show payment modal
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      const token = localStorage.getItem("token");
      
      // Create subscription with trial
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          billing_cycle: billingCycle,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Subscription created successfully! ${selectedPlan.trial_days}-day trial started.`);
        fetchCurrentSubscription();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      alert("Failed to create subscription. Please try again.");
    }
  };

  const getFeatureIcon = (feature) => {
    switch (feature) {
      case "max_assets":
        return <HardDrive className="w-4 h-4" />;
      case "max_users":
        return <Users className="w-4 h-4" />;
      case "max_scans_per_month":
        return <Zap className="w-4 h-4" />;
      case "advanced_analytics":
        return <BarChart3 className="w-4 h-4" />;
      case "priority_support":
        return <Shield className="w-4 h-4" />;
      default:
        return <Check className="w-4 h-4" />;
    }
  };

  const formatPrice = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const getPlanFeatures = (plan) => {
    const features = [];
    
    if (plan.features.max_assets) {
      features.push({
        name: `${plan.features.max_assets} Assets`,
        icon: "max_assets",
        value: plan.features.max_assets
      });
    }
    
    if (plan.features.max_users) {
      features.push({
        name: `${plan.features.max_users} Users`,
        icon: "max_users",
        value: plan.features.max_users
      });
    }
    
    if (plan.features.max_scans_per_month) {
      features.push({
        name: `${plan.features.max_scans_per_month.toLocaleString()} Scans/Month`,
        icon: "max_scans_per_month",
        value: plan.features.max_scans_per_month
      });
    }

    if (plan.features.api_access) {
      features.push({
        name: "API Access",
        icon: "api_access",
        value: true
      });
    }

    if (plan.features.advanced_analytics) {
      features.push({
        name: "Advanced Analytics",
        icon: "advanced_analytics",
        value: true
      });
    }

    if (plan.features.patch_management) {
      features.push({
        name: "Patch Management",
        icon: "patch_management",
        value: true
      });
    }

    if (plan.features.compliance_reporting) {
      features.push({
        name: "Compliance Reporting",
        icon: "compliance_reporting",
        value: true
      });
    }

    if (plan.features.sso_integration) {
      features.push({
        name: "SSO Integration",
        icon: "sso_integration",
        value: true
      });
    }

    if (plan.features.custom_branding) {
      features.push({
        name: "Custom Branding",
        icon: "custom_branding",
        value: true
      });
    }

    if (plan.features.white_label) {
      features.push({
        name: "White Label",
        icon: "white_label",
        value: true
      });
    }

    if (plan.features.dedicated_support) {
      features.push({
        name: "Dedicated Support",
        icon: "dedicated_support",
        value: true
      });
    }

    return features;
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
              <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
              <p className="mt-2 text-gray-600">
                Select the perfect plan for your IT asset management needs
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <div className="flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "yearly"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                Current Plan: {currentSubscription.plan_name} 
                {currentSubscription.isTrial && (
                  <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Trial
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isPopular = plan.popular;
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;
            const price = plan.pricing[billingCycle];
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                  isPopular
                    ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${isCurrentPlan ? "ring-2 ring-green-500 ring-opacity-50" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {plan.display_name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(price.amount, price.currency)}
                      </span>
                      <span className="text-gray-600 ml-1">
                        /{billingCycle === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    {plan.trial_days > 0 && (
                      <p className="text-sm text-blue-600 font-medium">
                        {plan.trial_days}-day free trial
                      </p>
                    )}
                  </div>

                  {/* Plan Description */}
                  <p className="text-gray-600 text-sm mb-6 text-center">
                    {plan.short_description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {getPlanFeatures(plan).map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="flex-shrink-0 w-5 h-5 text-green-500 mr-3">
                          {getFeatureIcon(feature.icon)}
                        </div>
                        <span className="text-sm text-gray-700">{feature.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isCurrentPlan
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : isPopular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    {isCurrentPlan
                      ? "Current Plan"
                      : plan.plan_type === "free"
                      ? "Get Started"
                      : "Start Free Trial"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            All plans include basic asset tracking, user management, and email support.
          </p>
          <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Secure & Compliant
            </div>
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Multiple Payment Methods
            </div>
            <div className="flex items-center">
              <X className="w-4 h-4 mr-2" />
              Cancel Anytime
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          subscription={{
            id: selectedPlan.id,
            plan_name: selectedPlan.display_name,
            amount: selectedPlan.pricing[billingCycle].amount,
            currency: selectedPlan.pricing[billingCycle].currency,
            description: `Payment for ${selectedPlan.display_name} subscription`,
            trial_days: selectedPlan.trial_days
          }}
          billingCycle={billingCycle}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
