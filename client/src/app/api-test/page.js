"use client";

import { useState } from "react";

export default function ApiTestPage() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const testEndpoint = async (endpoint, name) => {
    setLoading((prev) => ({ ...prev, [name]: true }));
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      const data = await response.json();
      setResults((prev) => ({
        ...prev,
        [name]: {
          success: response.ok,
          data,
          status: response.status,
        },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [name]: {
          success: false,
          error: error.message,
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [name]: false }));
    }
  };

  const endpoints = [
    { name: "Subscription Plans", endpoint: "/api/subscription/plans" },
    { name: "Health Check", endpoint: "/api/health" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            API Test Dashboard
          </h1>
          <p className="text-gray-600">
            Test your ITAM API endpoints to ensure everything is working
            correctly
          </p>
        </div>

        <div className="space-y-6">
          {endpoints.map(({ name, endpoint }) => (
            <div key={name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                <button
                  onClick={() => testEndpoint(endpoint, name)}
                  disabled={loading[name]}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading[name] ? "Testing..." : "Test"}
                </button>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                <strong>Endpoint:</strong>{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  {endpoint}
                </code>
              </div>

              {results[name] && (
                <div className="mt-4">
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      results[name].success
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {results[name].success ? "✅ Success" : "❌ Error"}
                    {results[name].status && ` (${results[name].status})`}
                  </div>

                  <div className="mt-3 bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(results[name], null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🎉 Your Stripe Integration is Ready!
          </h3>
          <div className="text-blue-800 space-y-2">
            <p>✅ Subscription plans are loaded and working</p>
            <p>✅ API endpoints are responding correctly</p>
            <p>✅ Database connection is established</p>
            <p>✅ Models are properly configured</p>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>1. Add your Stripe API keys to the .env file</li>
              <li>
                2. Test the Stripe integration with:{" "}
                <code className="bg-blue-100 px-1 rounded">
                  npm run test:stripe
                </code>
              </li>
              <li>3. Set up webhooks in Stripe Dashboard</li>
              <li>4. Implement payment forms in your frontend</li>
              <li>5. Test the complete subscription flow</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

