"use client";

import { useState } from "react";

export default function SetupPage() {
  const [stripeKey, setStripeKey] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSaveKey = () => {
    if (stripeKey && stripeKey.startsWith("pk_test_")) {
      // In a real app, you'd save this to environment variables
      localStorage.setItem("stripe_publishable_key", stripeKey);
      alert(
        "Stripe key saved! Please restart your development server for changes to take effect."
      );
    } else {
      alert(
        "Please enter a valid Stripe publishable key (starts with pk_test_)"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Stripe Integration Setup
          </h1>
          <p className="text-gray-600">
            Configure your Stripe API keys to enable payment processing
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-6">
            Environment Configuration
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stripe Publishable Key
              </label>
              <input
                type="text"
                value={stripeKey}
                onChange={(e) => setStripeKey(e.target.value)}
                placeholder="pk_test_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your Stripe publishable key (starts with pk_test_)
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleSaveKey}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save Key
              </button>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                {showInstructions ? "Hide" : "Show"} Instructions
              </button>
            </div>
          </div>

          {showInstructions && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                📋 Setup Instructions
              </h3>

              <div className="space-y-4 text-blue-800">
                <div>
                  <h4 className="font-semibold">1. Get Your Stripe Keys</h4>
                  <p className="text-sm">
                    Go to{" "}
                    <a
                      href="https://dashboard.stripe.com/apikeys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Stripe Dashboard
                    </a>{" "}
                    and copy your publishable key
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">2. Create Environment File</h4>
                  <p className="text-sm">
                    Create a{" "}
                    <code className="bg-blue-100 px-1 rounded">.env.local</code>{" "}
                    file in your client directory:
                  </p>
                  <pre className="bg-blue-100 p-2 rounded mt-2 text-xs">
                    {`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
NEXT_PUBLIC_API_URL=http://localhost:3000`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold">
                    3. Restart Development Server
                  </h4>
                  <p className="text-sm">
                    Stop and restart your Next.js development server for
                    environment changes to take effect
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">4. Test the Integration</h4>
                  <p className="text-sm">
                    Visit the{" "}
                    <a href="/subscription" className="underline">
                      subscription page
                    </a>{" "}
                    and try selecting a paid plan
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">
            ⚠️ Current Status
          </h3>

          <div className="space-y-2 text-yellow-800">
            <p>
              <strong>Stripe Key:</strong>{" "}
              {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
                <span className="text-green-600">✅ Configured</span>
              ) : (
                <span className="text-red-600">❌ Not configured</span>
              )}
            </p>
            <p>
              <strong>Payment Integration:</strong>{" "}
              {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
                <span className="text-green-600">✅ Ready</span>
              ) : (
                <span className="text-red-600">❌ Needs configuration</span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/subscription"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Test Subscription Page
          </a>
        </div>
      </div>
    </div>
  );
}

