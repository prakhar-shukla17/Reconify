import mongoose from "mongoose";
import SubscriptionPlan from "../models/subscriptionPlan.models.js";
import { configDotenv } from "dotenv";

configDotenv();

const subscriptionPlans = [
  {
    plan_id: "free",
    name: "free",
    display_name: "Free",
    plan_type: "free",
    category: "individual",
    pricing: {
      monthly: { amount: 0, currency: "USD" },
      yearly: { amount: 0, currency: "USD" }
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
      dedicated_support: false
    },
    description: "Perfect for individuals and small teams getting started with IT asset management",
    short_description: "Free plan for basic asset tracking",
    features_list: [
      "Up to 100 assets",
      "Up to 5 users",
      "1,000 scans per month",
      "Basic reporting",
      "Email support"
    ],
    trial_days: 0,
    is_active: true,
    is_public: true,
    sort_order: 1
  },
  {
    plan_id: "basic",
    name: "basic",
    display_name: "Basic",
    plan_type: "basic",
    category: "small_business",
    pricing: {
      monthly: { amount: 2900, currency: "USD" }, // $29.00
      yearly: { amount: 29000, currency: "USD", discount_percentage: 17 } // $290.00
    },
    features: {
      max_assets: 500,
      max_users: 25,
      max_scans_per_month: 10000,
      api_access: true,
      priority_support: true,
      custom_branding: false,
      advanced_analytics: true,
      data_export: true,
      patch_management: true,
      compliance_reporting: false,
      sso_integration: false,
      custom_integrations: false,
      white_label: false,
      dedicated_support: false
    },
    description: "Ideal for growing businesses that need more advanced features and higher limits",
    short_description: "Perfect for small to medium businesses",
    features_list: [
      "Up to 500 assets",
      "Up to 25 users",
      "10,000 scans per month",
      "API access",
      "Advanced analytics",
      "Patch management",
      "Priority support",
      "14-day free trial"
    ],
    trial_days: 14,
    is_active: true,
    is_public: true,
    popular: true,
    sort_order: 2
  },
  {
    plan_id: "professional",
    name: "professional",
    display_name: "Professional",
    plan_type: "professional",
    category: "small_business",
    pricing: {
      monthly: { amount: 9900, currency: "USD" }, // $99.00
      yearly: { amount: 99000, currency: "USD", discount_percentage: 17 } // $990.00
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
      custom_integrations: true,
      white_label: false,
      dedicated_support: false
    },
    description: "Comprehensive solution for organizations that need advanced features and compliance capabilities",
    short_description: "Advanced features for growing organizations",
    features_list: [
      "Up to 2,000 assets",
      "Up to 100 users",
      "50,000 scans per month",
      "API access",
      "Advanced analytics",
      "Patch management",
      "Compliance reporting",
      "SSO integration",
      "Custom integrations",
      "Custom branding",
      "Priority support",
      "14-day free trial"
    ],
    trial_days: 14,
    is_active: true,
    is_public: true,
    sort_order: 3
  },
  {
    plan_id: "enterprise",
    name: "enterprise",
    display_name: "Enterprise",
    plan_type: "enterprise",
    category: "enterprise",
    pricing: {
      monthly: { amount: 29900, currency: "USD" }, // $299.00
      yearly: { amount: 299000, currency: "USD", discount_percentage: 17 } // $2,990.00
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
      dedicated_support: true
    },
    description: "Enterprise-grade solution with unlimited features, white-label options, and dedicated support",
    short_description: "Enterprise solution with unlimited features",
    features_list: [
      "Up to 10,000 assets",
      "Up to 500 users",
      "200,000 scans per month",
      "API access",
      "Advanced analytics",
      "Patch management",
      "Compliance reporting",
      "SSO integration",
      "Custom integrations",
      "Custom branding",
      "White-label solution",
      "Dedicated support",
      "14-day free trial"
    ],
    trial_days: 14,
    is_active: true,
    is_public: true,
    sort_order: 4
  }
];

async function seedSubscriptionPlans() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log("Cleared existing subscription plans");

    // Insert new plans
    const createdPlans = await SubscriptionPlan.insertMany(subscriptionPlans);
    console.log(`Created ${createdPlans.length} subscription plans:`);
    
    createdPlans.forEach(plan => {
      console.log(`- ${plan.display_name} (${plan.plan_id})`);
    });

    console.log("Subscription plans seeded successfully!");
  } catch (error) {
    console.error("Error seeding subscription plans:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the seeding function
seedSubscriptionPlans();


