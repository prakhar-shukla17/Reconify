"use client";

import { useState, useEffect } from "react";
import { getValidToken, authenticatedFetch } from "../../utils/authUtils";

export default function DebugStripePage() {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check environment variables
    setDebugInfo({
      stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      hasToken: !!localStorage.getItem("token"),
      tokenPreview: localStorage.getItem("token")?.substring(0, 50) + "...",
    });
  }, []);

  const testAuth = async () => {
    setLoading(true);
    try {
      console.log("Testing authentication...");
      const token = await getValidToken();
      console.log("Token obtained:", token ? "✅ Valid" : "❌ Invalid");
      
      // Test API call
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/auth/profile`
      );
      
      const result = await response.json();
      console.log("Profile API response:", result);
      
      setDebugInfo(prev => ({
        ...prev,
        authTest: response.status === 200 ? "✅ Success" : `❌ Failed (${response.status})`,
        profileData: result
      }));
    } catch (error) {
      console.error("Auth test failed:", error);
      setDebugInfo(prev => ({
        ...prev,
        authTest: `❌ Error: ${error.message}`
      }));
    }
    setLoading(false);
  };

  const createTestUser = async () => {
    setLoading(true);
    try {
      console.log("Creating test user...");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/test-auth/create-test-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      const result = await response.json();
      console.log("Test user creation response:", result);
      
      if (result.success && result.token) {
        localStorage.setItem("token", result.token);
        setDebugInfo(prev => ({
          ...prev,
          testUser: "✅ Created and token stored",
          hasToken: true,
          tokenPreview: result.token.substring(0, 50) + "..."
        }));
      } else {
        setDebugInfo(prev => ({
          ...prev,
          testUser: `❌ Failed: ${result.error || "Unknown error"}`
        }));
      }
    } catch (error) {
      console.error("Test user creation failed:", error);
      setDebugInfo(prev => ({
        ...prev,
        testUser: `❌ Error: ${error.message}`
      }));
    }
    setLoading(false);
  };

  const testStripeEndpoint = async () => {
    setLoading(true);
    try {
      console.log("Testing Stripe endpoint...");
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/stripe/customer`,
        {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            name: "Test User",
            organization_name: "Test Org"
          }),
        }
      );
      
      const result = await response.json();
      console.log("Stripe customer API response:", result);
      
      setDebugInfo(prev => ({
        ...prev,
        stripeTest: response.status === 200 ? "✅ Success" : `❌ Failed (${response.status})`,
        stripeResponse: result
      }));
    } catch (error) {
      console.error("Stripe test failed:", error);
      setDebugInfo(prev => ({
        ...prev,
        stripeTest: `❌ Error: ${error.message}`
      }));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Stripe Debug Dashboard</h1>
        
        {/* Environment Variables */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="font-semibold">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:</span>{" "}
              <span className={debugInfo.stripeKey ? "text-green-600" : "text-red-600"}>
                {debugInfo.stripeKey ? `${debugInfo.stripeKey.substring(0, 20)}...` : "❌ Missing"}
              </span>
            </div>
            <div>
              <span className="font-semibold">NEXT_PUBLIC_API_URL:</span>{" "}
              <span className={debugInfo.apiUrl ? "text-green-600" : "text-orange-600"}>
                {debugInfo.apiUrl || "Using default: http://localhost:3000/api"}
              </span>
            </div>
            <div>
              <span className="font-semibold">Has Token:</span>{" "}
              <span className={debugInfo.hasToken ? "text-green-600" : "text-red-600"}>
                {debugInfo.hasToken ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            {debugInfo.tokenPreview && (
              <div>
                <span className="font-semibold">Token Preview:</span>{" "}
                <span className="text-gray-600">{debugInfo.tokenPreview}</span>
              </div>
            )}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tests</h2>
          <div className="space-y-4">
            <button
              onClick={createTestUser}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "1. Create Test User & Token"}
            </button>
            
            <button
              onClick={testAuth}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 ml-4"
            >
              {loading ? "Loading..." : "2. Test Authentication"}
            </button>
            
            <button
              onClick={testStripeEndpoint}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 ml-4"
            >
              {loading ? "Loading..." : "3. Test Stripe Endpoint"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-4">
            {debugInfo.testUser && (
              <div>
                <span className="font-semibold">Test User Creation:</span> {debugInfo.testUser}
              </div>
            )}
            {debugInfo.authTest && (
              <div>
                <span className="font-semibold">Authentication Test:</span> {debugInfo.authTest}
              </div>
            )}
            {debugInfo.stripeTest && (
              <div>
                <span className="font-semibold">Stripe Endpoint Test:</span> {debugInfo.stripeTest}
              </div>
            )}
            {debugInfo.profileData && (
              <div>
                <span className="font-semibold">Profile Data:</span>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.profileData, null, 2)}
                </pre>
              </div>
            )}
            {debugInfo.stripeResponse && (
              <div>
                <span className="font-semibold">Stripe Response:</span>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.stripeResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
