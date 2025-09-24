#!/usr/bin/env node

/**
 * Stripe Environment Setup Script
 * Creates the necessary environment files for Stripe integration
 */

import fs from "fs";
import path from "path";

console.log("🔧 Setting up Stripe environment configuration...\n");

// Create client .env.local file
const clientEnvPath = path.join(process.cwd(), "client", ".env.local");
const clientEnvContent = `# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
`;

try {
  fs.writeFileSync(clientEnvPath, clientEnvContent);
  console.log("✅ Created client/.env.local file");
} catch (error) {
  console.log("❌ Error creating client/.env.local:", error.message);
}

// Create server .env file if it doesn't exist
const serverEnvPath = path.join(process.cwd(), "server", ".env");
const serverEnvContent = `# Database
MONGODB_URI=mongodb://localhost:27017/itam

# JWT
JWT_SECRET=your-jwt-secret-key-change-this-in-production

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# License Configuration
LICENSE_SECRET_KEY=your-license-secret-key-change-this-in-production

# Application URLs
CLIENT_URL=http://localhost:3001
SERVER_URL=http://localhost:3000
`;

if (!fs.existsSync(serverEnvPath)) {
  try {
    fs.writeFileSync(serverEnvPath, serverEnvContent);
    console.log("✅ Created server/.env file");
  } catch (error) {
    console.log("❌ Error creating server/.env:", error.message);
  }
} else {
  console.log("✅ server/.env file already exists");
}

console.log("\n📋 Next Steps:");
console.log(
  "1. Get your Stripe API keys from: https://dashboard.stripe.com/apikeys"
);
console.log("2. Update the .env files with your actual keys");
console.log("3. Restart your development servers");
console.log("4. Test the payment integration");

console.log("\n🔑 Required Keys:");
console.log("• STRIPE_SECRET_KEY (starts with sk_test_)");
console.log("• STRIPE_PUBLISHABLE_KEY (starts with pk_test_)");
console.log("• STRIPE_WEBHOOK_SECRET (starts with whsec_)");

console.log("\n📖 Documentation:");
console.log("• Setup Guide: STRIPE_PAYMENT_SETUP.md");
console.log("• Integration Docs: STRIPE_LICENSE_INTEGRATION.md");

