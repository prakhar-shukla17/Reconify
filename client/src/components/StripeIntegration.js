import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// Payment Form Component
function PaymentForm({ onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe not loaded");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      // Create payment method
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

      // Create subscription
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/stripe/subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          plan_id: "basic",
          billing_cycle: "monthly",
          payment_method_id: paymentMethod.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Confirm payment if needed
        if (result.stripe_subscription.client_secret) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
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

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Subscribe to Basic Plan ($29/month)"}
      </button>
    </form>
  );
}

// Subscription Plans Component
function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/subscription/plans`);
      const result = await response.json();

      if (result.success) {
        setPlans(result.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading plans...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`p-6 border rounded-lg ${
            plan.popular ? "border-blue-500 bg-blue-50" : "border-gray-200"
          }`}
        >
          {plan.popular && (
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-4">
              Most Popular
            </div>
          )}

          <h3 className="text-xl font-bold mb-2">{plan.display_name}</h3>
          <p className="text-gray-600 mb-4">{plan.description}</p>

          <div className="mb-4">
            <span className="text-3xl font-bold">
              ${plan.pricing.monthly.amount / 100}
            </span>
            <span className="text-gray-600">/month</span>
          </div>

          <ul className="space-y-2 mb-6">
            {plan.features_list.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => setSelectedPlan(plan)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Choose {plan.display_name}
          </button>
        </div>
      ))}
    </div>
  );
}

// Main Stripe Integration Component
export default function StripeIntegration() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePaymentSuccess = (result) => {
    console.log("Payment successful:", result);
    setSuccess(true);
    setShowPaymentForm(false);
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold mb-2">Subscription Active!</h2>
        <p className="text-gray-600">
          Your subscription has been successfully created. You can now access
          all premium features.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Choose Your Plan</h1>

      <SubscriptionPlans />

      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              Complete Your Subscription
            </h2>

            <Elements stripe={stripePromise}>
              <PaymentForm
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>

            <button
              onClick={() => setShowPaymentForm(false)}
              className="w-full mt-4 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

