#!/usr/bin/env node

/**
 * Subscription Plans Seeder
 * Creates default subscription plans for the ITAM platform
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import SubscriptionPlan from "../models/subscriptionPlan.models.js";

// Load environment variables
dotenv.config();

const plans = [
  {
    plan_id: "free",
    name: "Free",
    display_name: "Free Plan",
    plan_type: "free",
    category: "individual",
    pricing: {
      monthly: { amount: 0, currency: "USD" },
      yearly: { amount: 0, currency: "USD" },
    },
    features: {
      max_assets: 100,
      max_users: 5,
      max_scans_per_month: 1000,
      api_access: false,
      priority_support: false,
      custom_branding: false,
      advanced_analytics: false,
      data_export: true,
      patch_management: false,
      compliance_reporting: false,
      sso_integration: false,
      custom_integrations: false,
      white_label: false,
      dedicated_support: false,
    },
    description:
      "Perfect for small teams getting started with IT asset management",
    short_description: "Free plan for small teams",
    features_list: [
      "Up to 100 assets",
      "Up to 5 users",
      "1,000 scans per month",
      "Basic reporting",
      "Email support",
    ],
    trial_days: 0,
    is_active: true,
    is_public: true,
    sort_order: 1,
  },
  {
    plan_id: "basic",
    name: "Basic",
    display_name: "Basic Plan",
    plan_type: "basic",
    category: "small_business",
    pricing: {
      monthly: { amount: 2900, currency: "USD" }, // $29.00
      yearly: { amount: 29000, currency: "USD" }, // $290.00 (2 months free)
    },
    features: {
      max_assets: 500,
      max_users: 25,
      max_scans_per_month: 10000,
      api_access: true,
      priority_support: true,
      custom_branding: false,
      advanced_analytics: false,
      data_export: true,
      patch_management: true,
      compliance_reporting: false,
      sso_integration: false,
      custom_integrations: false,
      white_label: false,
      dedicated_support: false,
    },
    description:
      "Ideal for growing businesses that need more advanced features",
    short_description: "Perfect for growing businesses",
    features_list: [
      "Up to 500 assets",
      "Up to 25 users",
      "10,000 scans per month",
      "API access",
      "Patch management",
      "Priority support",
      "Advanced reporting",
    ],
    popular: true,
    trial_days: 14,
    is_active: true,
    is_public: true,
    sort_order: 2,
  },
  {
    plan_id: "professional",
    name: "Professional",
    display_name: "Professional Plan",
    plan_type: "professional",
    category: "small_business",
    pricing: {
      monthly: { amount: 7900, currency: "USD" }, // $79.00
      yearly: { amount: 79000, currency: "USD" }, // $790.00 (2 months free)
    },
    features: {
      max_assets: 2000,
      max_users: 100,
      max_scans_per_month: 50000,
      api_access: true,
      priority_support: true,
      custom_branding: true,
      advanced_analytics: true,
      data_export: true,
      patch_management: true,
      compliance_reporting: true,
      sso_integration: true,
      custom_integrations: false,
      white_label: false,
      dedicated_support: false,
    },
    description: "Advanced features for established organizations",
    short_description: "Advanced features for established teams",
    features_list: [
      "Up to 2,000 assets",
      "Up to 100 users",
      "50,000 scans per month",
      "Custom branding",
      "Advanced analytics",
      "Compliance reporting",
      "SSO integration",
      "API access",
      "Priority support",
    ],
    trial_days: 14,
    is_active: true,
    is_public: true,
    sort_order: 3,
  },
  {
    plan_id: "enterprise",
    name: "Enterprise",
    display_name: "Enterprise Plan",
    plan_type: "enterprise",
    category: "enterprise",
    pricing: {
      monthly: { amount: 19900, currency: "USD" }, // $199.00
      yearly: { amount: 199000, currency: "USD" }, // $1,990.00 (2 months free)
    },
    features: {
      max_assets: 10000,
      max_users: 500,
      max_scans_per_month: 200000,
      api_access: true,
      priority_support: true,
      custom_branding: true,
      advanced_analytics: true,
      data_export: true,
      patch_management: true,
      compliance_reporting: true,
      sso_integration: true,
      custom_integrations: true,
      white_label: true,
      dedicated_support: true,
    },
    description: "Complete solution for large enterprises with custom needs",
    short_description: "Complete enterprise solution",
    features_list: [
      "Unlimited assets",
      "Up to 500 users",
      "200,000 scans per month",
      "White-label solution",
      "Custom integrations",
      "Dedicated support",
      "All Professional features",
      "Custom SLA",
      "On-premise deployment option",
    ],
    trial_days: 30,
    is_active: true,
    is_public: true,
    sort_order: 4,
    restrictions: {
      requires_approval: true,
      min_contract_period: 12,
      cancellation_policy: "custom",
    },
  },
];

async function seedPlans() {
  try {
    console.log("🌱 Seeding subscription plans...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log("🧹 Cleared existing plans");

    // Insert new plans
    const createdPlans = await SubscriptionPlan.insertMany(plans);
    console.log(`✅ Created ${createdPlans.length} subscription plans`);

    // Display created plans
    console.log("\n📋 Created Plans:");
    createdPlans.forEach((plan) => {
      console.log(`  • ${plan.display_name} (${plan.plan_id})`);
      console.log(`    Monthly: $${plan.pricing.monthly.amount / 100}`);
      console.log(`    Yearly: $${plan.pricing.yearly.amount / 100}`);
      console.log(`    Assets: ${plan.features.max_assets}`);
      console.log(`    Users: ${plan.features.max_users}`);
      console.log("");
    });

    console.log("🎉 Subscription plans seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding plans:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

// Run the seeder
seedPlans();
