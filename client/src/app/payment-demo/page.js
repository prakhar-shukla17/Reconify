"use client";

import { useState } from "react";

export default function PaymentDemoPage() {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "1. Choose Your Plan",
      description: "Select from Free, Basic, Professional, or Enterprise plans",
      image: "📋",
    },
    {
      title: "2. Enter Payment Details",
      description: "Secure card input powered by Stripe Elements",
      image: "💳",
    },
    {
      title: "3. Confirm Subscription",
      description: "Review and confirm your subscription details",
      image: "✅",
    },
    {
      title: "4. Access Premium Features",
      description: "Start using all the features included in your plan",
      image: "🚀",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Integration Demo
          </h1>
          <p className="text-xl text-gray-600">
            See how the Stripe payment integration works
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((stepItem, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg border-2 ${
                step === index + 1
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="text-4xl mb-4">{stepItem.image}</div>
              <h3 className="text-lg font-semibold mb-2">{stepItem.title}</h3>
              <p className="text-gray-600 text-sm">{stepItem.description}</p>
            </div>
          ))}
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Plan Selection</h3>
                <p className="text-gray-600">
                  Users can choose from 4 different plans with varying features
                  and pricing. The free plan requires no payment, while paid
                  plans open the payment form.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure Payment</h3>
                <p className="text-gray-600">
                  Stripe Elements provides a secure, PCI-compliant card input
                  form. Card details are never stored on your servers.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Subscription Creation
                </h3>
                <p className="text-gray-600">
                  The backend creates a Stripe subscription and links it to your
                  user account. All subscription data is stored in your
                  database.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Instant Access</h3>
                <p className="text-gray-600">
                  Users immediately get access to premium features based on
                  their subscription plan. Usage limits and feature access are
                  enforced automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Cards */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">
            🧪 Test Cards for Development
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-green-700 mb-2">✅ Success</h4>
              <p className="text-sm text-gray-600">Card: 4242 4242 4242 4242</p>
              <p className="text-sm text-gray-600">Any future date, any CVC</p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-red-700 mb-2">❌ Decline</h4>
              <p className="text-sm text-gray-600">Card: 4000 0000 0000 0002</p>
              <p className="text-sm text-gray-600">Any future date, any CVC</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <a
            href="/subscription"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Try Payment Integration
          </a>
          <a
            href="/api-test"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold"
          >
            Test API Endpoints
          </a>
        </div>
      </div>
    </div>
  );
}

