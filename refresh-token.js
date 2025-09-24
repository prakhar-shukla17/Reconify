#!/usr/bin/env node

/**
 * Quick Token Refresh Script
 * Gets a fresh JWT token for testing
 */

const fetch = require("node-fetch");

async function refreshToken() {
  try {
    console.log("🔄 Refreshing JWT token...\n");

    const response = await fetch(
      "http://localhost:3000/api/test-auth/refresh-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log("✅ Token refreshed successfully!");
      console.log(`🔑 New Token: ${result.token.substring(0, 50)}...`);
      console.log(`👤 User: ${result.user.firstName} ${result.user.lastName}`);
      console.log(`🏢 Organization: ${result.user.organization_name}`);
      console.log(`🏷️  Tenant ID: ${result.user.tenant_id}`);
      console.log("\n📋 Next Steps:");
      console.log("1. Copy this token to your browser's localStorage");
      console.log(
        "2. Or visit http://localhost:3001/auth-test to get it automatically"
      );
      console.log(
        "3. Test the subscription page: http://localhost:3001/subscription"
      );
    } else {
      console.log("❌ Error:", result.error);
    }
  } catch (error) {
    console.log("❌ Network error:", error.message);
    console.log("💡 Make sure your server is running on port 3000");
  }
}

refreshToken();

