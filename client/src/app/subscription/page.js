"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useAuth } from "../../contexts/AuthContext";

export default function SubscriptionPage() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/subscription/plans");
      const result = await response.json();

      if (result.success) {
        setPlans(result.plans);
      } else {
        setError("Failed to fetch plans");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    console.log("Selected plan:", plan);
    console.log("Plan ID:", plan.id);
    
    if (plan.plan_type === "free") {
      alert(
        "Free plan selected! You can start using the platform immediately."
      );
      return;
    }

    // Require authentication
    const token = Cookies.get("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Store selected plan and redirect to payment page
    localStorage.setItem("selectedPlanId", plan.id);
    console.log("Redirecting to payment page with plan_id:", plan.id);
    window.location.href = `/payment?plan_id=${plan.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Plans</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPlans}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your IT asset management needs
          </p>

          {!isAuthenticated && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-yellow-800 font-medium">
                ⚠️ Authentication Required: Please log in to subscribe to paid plans. <a href="/login" className="underline">Go to login</a>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                plan.popular
                  ? "ring-2 ring-blue-500 transform scale-105"
                  : "hover:shadow-xl transition-shadow"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.display_name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    ${plan.pricing.monthly.amount / 100}
                  </span>
                  <span className="text-gray-600">/month</span>
                  {plan.pricing.yearly.amount > 0 && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">
                        or ${plan.pricing.yearly.amount / 100}/year
                      </span>
                      <span className="ml-2 text-sm text-green-600 font-semibold">
                        (Save {plan.yearlyDiscountPercentage}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features_list.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
                onClick={() => handlePlanSelect(plan)}
              >
                {plan.plan_type === "free"
                  ? "Get Started Free"
                  : `Choose ${plan.display_name}`}
                {plan.trial_days > 0 && (
                  <span className="block text-sm opacity-75">
                    {plan.trial_days}-day free trial
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need a custom solution?
          </h2>
          <p className="text-gray-600 mb-6">
            Contact us for enterprise pricing and custom features
          </p>
          <button className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}
