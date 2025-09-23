import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
  {
    // Tenant ID for multi-tenancy
    tenant_id: { type: String, required: true, index: true },
    
    // User who owns the subscription
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    // Subscription plan details
    plan_id: { type: String, required: true },
    plan_name: { type: String, required: true },
    plan_type: { 
      type: String, 
      enum: ["free", "basic", "professional", "enterprise"], 
      required: true 
    },
    
    // Pricing information
    amount: { type: Number, required: true }, // Amount in cents
    currency: { type: String, default: "USD" },
    billing_cycle: { 
      type: String, 
      enum: ["monthly", "yearly"], 
      default: "monthly" 
    },
    
    // Subscription status
    status: { 
      type: String, 
      enum: ["active", "inactive", "cancelled", "past_due", "trialing"], 
      default: "active" 
    },
    
    // Subscription dates
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date },
    trial_end_date: { type: Date },
    cancelled_at: { type: Date },
    
    // Payment gateway information
    payment_gateway: { 
      type: String, 
      enum: ["stripe", "paypal", "razorpay"], 
      required: true 
    },
    gateway_subscription_id: { type: String }, // External subscription ID
    gateway_customer_id: { type: String }, // External customer ID
    
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
      compliance_reporting: { type: Boolean, default: false }
    },
    
    // Usage tracking
    usage: {
      current_assets: { type: Number, default: 0 },
      current_users: { type: Number, default: 1 },
      scans_this_month: { type: Number, default: 0 },
      last_reset_date: { type: Date, default: Date.now }
    },
    
    // Auto-renewal settings
    auto_renew: { type: Boolean, default: true },
    
    // Additional metadata
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SubscriptionSchema.index({ tenant_id: 1, status: 1 });
SubscriptionSchema.index({ user_id: 1 });
SubscriptionSchema.index({ gateway_subscription_id: 1 });

// Virtual for checking if subscription is active
SubscriptionSchema.virtual("isActive").get(function() {
  return this.status === "active" && 
         (!this.end_date || this.end_date > new Date());
});

// Virtual for checking if subscription is in trial
SubscriptionSchema.virtual("isTrial").get(function() {
  return this.status === "trialing" && 
         this.trial_end_date && 
         this.trial_end_date > new Date();
});

// Method to check if user can perform action based on plan limits
SubscriptionSchema.methods.canPerformAction = function(action, currentCount = 0) {
  const limits = this.features;
  
  switch(action) {
    case "add_asset":
      return currentCount < limits.max_assets;
    case "add_user":
      return currentCount < limits.max_users;
    case "perform_scan":
      return this.usage.scans_this_month < limits.max_scans_per_month;
    case "use_api":
      return limits.api_access;
    default:
      return true;
  }
};

// Method to update usage
SubscriptionSchema.methods.updateUsage = function(action) {
  switch(action) {
    case "asset_added":
      this.usage.current_assets += 1;
      break;
    case "asset_removed":
      this.usage.current_assets = Math.max(0, this.usage.current_assets - 1);
      break;
    case "user_added":
      this.usage.current_users += 1;
      break;
    case "user_removed":
      this.usage.current_users = Math.max(1, this.usage.current_users - 1);
      break;
    case "scan_performed":
      this.usage.scans_this_month += 1;
      break;
  }
  
  return this.save();
};

// Static method to reset monthly usage
SubscriptionSchema.statics.resetMonthlyUsage = async function() {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  await this.updateMany(
    { last_reset_date: { $lt: firstOfMonth } },
    { 
      $set: { 
        "usage.scans_this_month": 0,
        last_reset_date: now 
      } 
    }
  );
};

export default mongoose.model("Subscription", SubscriptionSchema);


