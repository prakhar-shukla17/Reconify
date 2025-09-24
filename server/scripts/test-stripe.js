#!/usr/bin/env node

/**
 * Stripe Integration Test Script
 * This script helps test the Stripe integration setup
 */

import Stripe from "stripe";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
  console.log("🔍 Testing Stripe Connection...");

  try {
    // Test API connection
    const account = await stripe.accounts.retrieve();
    console.log("✅ Stripe connection successful!");
    console.log(`📧 Account: ${account.email}`);
    console.log(`🌍 Country: ${account.country}`);
    console.log(`💰 Currency: ${account.default_currency}`);

    return true;
  } catch (error) {
    console.error("❌ Stripe connection failed:", error.message);
    return false;
  }
}

async function testCustomerCreation() {
  console.log("\n👤 Testing Customer Creation...");

  try {
    const customer = await stripe.customers.create({
      email: "test@example.com",
      name: "Test Customer",
      metadata: {
        tenant_id: "test-tenant-123",
        created_via: "itam_platform_test",
      },
    });

    console.log("✅ Customer created successfully!");
    console.log(`🆔 Customer ID: ${customer.id}`);
    console.log(`📧 Email: ${customer.email}`);

    // Clean up - delete test customer
    await stripe.customers.del(customer.id);
    console.log("🧹 Test customer cleaned up");

    return true;
  } catch (error) {
    console.error("❌ Customer creation failed:", error.message);
    return false;
  }
}

async function testProductCreation() {
  console.log("\n📦 Testing Product Creation...");

  try {
    const product = await stripe.products.create({
      name: "ITAM Basic Plan",
      description: "Basic ITAM subscription plan for testing",
      metadata: {
        plan_id: "basic",
        tenant_id: "test-tenant-123",
      },
    });

    console.log("✅ Product created successfully!");
    console.log(`🆔 Product ID: ${product.id}`);
    console.log(`📝 Name: ${product.name}`);

    // Clean up - delete test product
    await stripe.products.del(product.id);
    console.log("🧹 Test product cleaned up");

    return true;
  } catch (error) {
    console.error("❌ Product creation failed:", error.message);
    return false;
  }
}

async function testPriceCreation() {
  console.log("\n💰 Testing Price Creation...");

  try {
    // First create a product
    const product = await stripe.products.create({
      name: "ITAM Test Product",
      description: "Test product for price creation",
    });

    // Create a price
    const price = await stripe.prices.create({
      unit_amount: 2900, // $29.00
      currency: "usd",
      recurring: {
        interval: "month",
      },
      product: product.id,
      metadata: {
        plan_id: "basic",
        billing_cycle: "monthly",
      },
    });

    console.log("✅ Price created successfully!");
    console.log(`🆔 Price ID: ${price.id}`);
    console.log(`💰 Amount: $${price.unit_amount / 100}`);
    console.log(`🔄 Interval: ${price.recurring.interval}`);

    // Clean up
    await stripe.prices.update(price.id, { active: false });
    await stripe.products.del(product.id);
    console.log("🧹 Test price and product cleaned up");

    return true;
  } catch (error) {
    console.error("❌ Price creation failed:", error.message);
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log("🔧 Checking Environment Variables...");

  const requiredVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "LICENSE_SECRET_KEY",
  ];

  const missing = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      console.log(`✅ ${varName}: ${process.env[varName].substring(0, 10)}...`);
    }
  }

  if (missing.length > 0) {
    console.log(`❌ Missing environment variables: ${missing.join(", ")}`);
    console.log("📝 Please add these to your .env file");
    return false;
  }

  console.log("✅ All required environment variables are set");
  return true;
}

async function main() {
  console.log("🚀 ITAM Stripe Integration Test\n");
  console.log("=" * 50);

  // Check environment variables
  const envCheck = await checkEnvironmentVariables();
  if (!envCheck) {
    console.log("\n❌ Environment check failed. Please fix the issues above.");
    process.exit(1);
  }

  // Test Stripe connection
  const connectionTest = await testStripeConnection();
  if (!connectionTest) {
    console.log("\n❌ Stripe connection failed. Please check your API keys.");
    process.exit(1);
  }

  // Test customer creation
  const customerTest = await testCustomerCreation();

  // Test product creation
  const productTest = await testProductCreation();

  // Test price creation
  const priceTest = await testPriceCreation();

  console.log("\n" + "=" * 50);
  console.log("📊 Test Results Summary:");
  console.log(`🔗 Connection: ${connectionTest ? "✅" : "❌"}`);
  console.log(`👤 Customer: ${customerTest ? "✅" : "❌"}`);
  console.log(`📦 Product: ${productTest ? "✅" : "❌"}`);
  console.log(`💰 Price: ${priceTest ? "✅" : "❌"}`);

  const allPassed = connectionTest && customerTest && productTest && priceTest;

  if (allPassed) {
    console.log("\n🎉 All tests passed! Your Stripe integration is ready.");
    console.log("\n📋 Next steps:");
    console.log("1. Set up webhook endpoints in Stripe Dashboard");
    console.log("2. Create subscription plans in your database");
    console.log("3. Test the full subscription flow");
    console.log("4. Implement frontend payment forms");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the errors above.");
  }
}

// Run the tests
main().catch(console.error);

