"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  getValidToken,
  authenticatedFetch,
  isAuthenticated as checkAuth,
} from "../../utils/authUtils";
import AuthGuard from "../../components/AuthGuard";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51234567890abcdef"
);

// Payment Form Component
function PaymentForm({ plan, onSuccess, onError, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    setIsAuthenticated(checkAuth());
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe not loaded");
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setError(
        "Please authenticate first. Visit /auth-test to create a test user."
      );
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: pmError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        });

      if (pmError) {
        setError(pmError.message);
        setLoading(false);
        return;
      }

      // Create subscription with automatic token refresh
      const response = await authenticatedFetch(
        "http://localhost:3000/api/stripe/subscription",
        {
          method: "POST",
          body: JSON.stringify({
            plan_id: plan.id,
            billing_cycle: "monthly",
            payment_method_id: paymentMethod.id,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        if (result.stripe_subscription?.client_secret) {
          const { error: confirmError } = await stripe.confirmCardPayment(
            result.stripe_subscription.client_secret
          );

          if (confirmError) {
            setError(confirmError.message);
          } else {
            onSuccess(result);
          }
        } else {
          onSuccess(result);
        }
      } else {
        setError(result.error || "Subscription creation failed");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    }

    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to complete your subscription.
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="/auth-test"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold inline-block"
            >
              Create Test Account
            </a>
            <a
              href="/subscription"
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-semibold inline-block"
            >
              Back to Plans
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Complete Your Subscription
          </h1>
          <p className="text-lg text-gray-600">
            You're subscribing to the <strong>{plan.display_name}</strong> plan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6">Payment Information</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plan Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      {plan.display_name}
                    </h3>
                    <p className="text-sm text-blue-700">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">
                      $
                      {plan.pricing?.monthly?.amount
                        ? plan.pricing.monthly.amount / 100
                        : "0"}
                    </div>
                    <div className="text-sm text-blue-700">per month</div>
                  </div>
                </div>
              </div>

              {/* Card Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Information
                </label>
                <div className="p-4 border border-gray-300 rounded-lg">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: "#424770",
                          "::placeholder": {
                            color: "#aab7c4",
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold text-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  `Subscribe for $${
                    plan.pricing?.monthly?.amount
                      ? plan.pricing.monthly.amount / 100
                      : "0"
                  }/month`
                )}
              </button>
            </form>
          </div>

          {/* Plan Details */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6">Plan Details</h2>

            <div className="space-y-6">
              {/* Features */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  What's Included
                </h3>
                <ul className="space-y-2">
                  {plan.features_list &&
                    plan.features_list.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                      </li>
                    ))}
                </ul>
              </div>

              {/* Limits */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Usage Limits
                </h3>
                <div className="space-y-2">
                  {plan.features &&
                    Object.entries(plan.features).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">
                          {key.replace("_", " ")}:
                        </span>
                        <span className="font-medium">
                          {typeof value === "boolean"
                            ? value
                              ? "Yes"
                              : "No"
                            : value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">
                      Secure Payment
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Your payment information is encrypted and processed
                      securely by Stripe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Payment Page Component
export default function PaymentPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get plan from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const planId =
      urlParams.get("plan_id") || localStorage.getItem("selectedPlanId");

    console.log("URL params:", window.location.search);
    console.log("Plan ID from URL:", urlParams.get("plan_id"));
    console.log(
      "Plan ID from localStorage:",
      localStorage.getItem("selectedPlanId")
    );
    console.log("Final plan ID:", planId);

    if (planId) {
      fetchPlan(planId);
    } else {
      setError("No plan selected. Please go back and select a plan.");
      setLoading(false);
    }
  }, []);

  const fetchPlan = async (planId) => {
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
      setError("Failed to load plan details");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (result) => {
    setSuccess(true);
    // Redirect to success page or dashboard
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 3000);
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
  };

  const handlePaymentCancel = () => {
    window.location.href = "/subscription";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
          <a
            href="/subscription"
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-semibold inline-block"
          >
            Back to Plans
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your subscription to {plan?.display_name} has been activated.
              Redirecting to dashboard...
            </p>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <Elements stripe={stripePromise}>
        <PaymentForm
          plan={plan}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
        />
      </Elements>
    </AuthGuard>
  );
}
