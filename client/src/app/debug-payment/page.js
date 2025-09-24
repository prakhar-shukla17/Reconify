"use client";

import { useState, useEffect } from "react";

export default function DebugPaymentPage() {
  const [planId, setPlanId] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get plan from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const planIdFromUrl = urlParams.get("plan_id");
    const planIdFromStorage = localStorage.getItem("selectedPlanId");

    console.log("URL params:", window.location.search);
    console.log("Plan ID from URL:", planIdFromUrl);
    console.log("Plan ID from localStorage:", planIdFromStorage);

    if (planIdFromUrl) {
      setPlanId(planIdFromUrl);
      fetchPlan(planIdFromUrl);
    } else if (planIdFromStorage) {
      setPlanId(planIdFromStorage);
      fetchPlan(planIdFromStorage);
    }
  }, []);

  const fetchPlan = async (planId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching plan with ID:", planId);
      const response = await fetch(
        `http://localhost:3000/api/subscription/plans/${planId}`
      );
      const result = await response.json();
      console.log("Plan fetch result:", result);

      if (result.success) {
        setPlan(result.plan);
      } else {
        setError("Plan not found");
      }
    } catch (err) {
      console.error("Error fetching plan:", err);
      setError("Failed to load plan details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testPlanId = (testId) => {
    setPlanId(testId);
    fetchPlan(testId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Debug Page
          </h1>
          <p className="text-gray-600">Debug the plan loading issue</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-6">Debug Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan ID
              </label>
              <input
                type="text"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                placeholder="Enter plan ID (e.g., basic, professional, enterprise)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => fetchPlan(planId)}
                disabled={loading || !planId}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Fetch Plan"}
              </button>

              <button
                onClick={() => testPlanId("basic")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Test Basic Plan
              </button>

              <button
                onClick={() => testPlanId("professional")}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Test Professional Plan
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Error</h3>
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {plan && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  Plan Found!
                </h3>
                <div className="text-green-800 space-y-1">
                  <p>
                    <strong>ID:</strong> {plan.id}
                  </p>
                  <p>
                    <strong>Name:</strong> {plan.name}
                  </p>
                  <p>
                    <strong>Display Name:</strong> {plan.display_name}
                  </p>
                  <p>
                    <strong>Type:</strong> {plan.plan_type}
                  </p>
                  <p>
                    <strong>Price:</strong> ${plan.pricing.monthly.amount / 100}
                    /month
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center space-x-4">
          <a
            href="/subscription"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Back to Subscription Page
          </a>
          <a
            href="/payment?plan_id=basic"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            Test Payment Page with Basic Plan
          </a>
        </div>
      </div>
    </div>
  );
}

