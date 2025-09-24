#!/usr/bin/env node

/**
 * Stripe Setup Script
 * Complete setup for Stripe integration
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 ITAM Stripe Integration Setup\n");

// Check if .env file exists
const envPath = path.join(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  console.log("📝 Creating .env file...");

  const envContent = `# Database
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

  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env file created");
} else {
  console.log("✅ .env file already exists");
}

console.log("\n📋 Setup Checklist:");
console.log("1. ✅ Environment file created");
console.log("2. ⏳ Add your Stripe API keys to .env file");
console.log("3. ⏳ Run: npm run seed:plans");
console.log("4. ⏳ Run: npm run test:stripe");
console.log("5. ⏳ Start your server: npm run dev");

console.log("\n🔑 Required Stripe Keys:");
console.log("• STRIPE_SECRET_KEY (starts with sk_test_)");
console.log("• STRIPE_PUBLISHABLE_KEY (starts with pk_test_)");
console.log("• STRIPE_WEBHOOK_SECRET (starts with whsec_)");

console.log("\n📚 Next Steps:");
console.log(
  "1. Get your Stripe API keys from: https://dashboard.stripe.com/apikeys"
);
console.log("2. Update the .env file with your keys");
console.log("3. Run the test script to verify everything works");
console.log("4. Set up webhooks in Stripe Dashboard");
console.log("5. Start building your payment UI!");

console.log("\n📖 Documentation:");
console.log("• Setup Guide: STRIPE_SETUP_GUIDE.md");
console.log("• Integration Docs: STRIPE_LICENSE_INTEGRATION.md");

