import mongoose from "mongoose";

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    // Plan identification
    plan_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    display_name: { type: String, required: true },
    
    // Plan type and category
    plan_type: { 
      type: String, 
      enum: ["free", "basic", "professional", "enterprise"], 
      required: true 
    },
    category: { 
      type: String, 
      enum: ["individual", "small_business", "enterprise"], 
      required: true 
    },
    
    // Pricing information
    pricing: {
      monthly: {
        amount: { type: Number, default: 0 }, // Amount in cents
        currency: { type: String, default: "USD" }
      },
      yearly: {
        amount: { type: Number, default: 0 }, // Amount in cents
        currency: { type: String, default: "USD" },
        discount_percentage: { type: Number, default: 0 }
      }
    },
    
    // Plan features and limits
    features: {
      max_assets: { type: Number, default: 100 },
      max_users: { type: Number, default: 5 },
      max_scans_per_month: { type: Number, default: 1000 },
      api_access: { type: Boolean, default: false },
      priority_support: { type: Boolean, default: false },
      custom_branding: { type: Boolean, default: false },
      advanced_analytics: { type: Boolean, default: false },
      data_export: { type: Boolean, default: true },
      patch_management: { type: Boolean, default: false },
      compliance_reporting: { type: Boolean, default: false },
      sso_integration: { type: Boolean, default: false },
      custom_integrations: { type: Boolean, default: false },
      white_label: { type: Boolean, default: false },
      dedicated_support: { type: Boolean, default: false }
    },
    
    // Plan description and marketing
    description: { type: String, required: true },
    short_description: { type: String },
    features_list: [{ type: String }], // Array of feature descriptions
    popular: { type: Boolean, default: false }, // Mark as popular plan
    
    // Trial settings
    trial_days: { type: Number, default: 14 },
    trial_features: {
      max_assets: { type: Number },
      max_users: { type: Number },
      max_scans_per_month: { type: Number },
      api_access: { type: Boolean, default: false },
      priority_support: { type: Boolean, default: false }
    },
    
    // Plan availability
    is_active: { type: Boolean, default: true },
    is_public: { type: Boolean, default: true }, // Available for public signup
    sort_order: { type: Number, default: 0 },
    
    // Plan restrictions
    restrictions: {
      requires_approval: { type: Boolean, default: false },
      min_contract_period: { type: Number, default: 1 }, // in months
      cancellation_policy: { 
        type: String, 
        enum: ["immediate", "end_of_period", "custom"],
        default: "end_of_period"
      }
    },
    
    // Additional metadata
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SubscriptionPlanSchema.index({ plan_type: 1, is_active: 1 });
SubscriptionPlanSchema.index({ category: 1, is_public: 1 });

// Virtual for yearly discount amount
SubscriptionPlanSchema.virtual("yearlyDiscount").get(function() {
  const monthly = this.pricing.monthly.amount * 12;
  const yearly = this.pricing.yearly.amount;
  return monthly - yearly;
});

// Virtual for yearly discount percentage
SubscriptionPlanSchema.virtual("yearlyDiscountPercentage").get(function() {
  const monthly = this.pricing.monthly.amount * 12;
  const yearly = this.pricing.yearly.amount;
  if (monthly === 0) return 0;
  return Math.round(((monthly - yearly) / monthly) * 100);
});

// Method to check if plan supports feature
SubscriptionPlanSchema.methods.supportsFeature = function(feature) {
  return this.features[feature] === true;
};

// Method to get pricing for billing cycle
SubscriptionPlanSchema.methods.getPricing = function(billingCycle = "monthly") {
  return billingCycle === "yearly" ? this.pricing.yearly : this.pricing.monthly;
};

// Static method to get active public plans
SubscriptionPlanSchema.statics.getPublicPlans = function() {
  return this.find({ is_active: true, is_public: true })
    .sort({ sort_order: 1, plan_type: 1 });
};

// Static method to get plans by category
SubscriptionPlanSchema.statics.getPlansByCategory = function(category) {
  return this.find({ 
    is_active: true, 
    is_public: true, 
    category 
  }).sort({ sort_order: 1 });
};

export default mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);


