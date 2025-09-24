import Subscription from "../models/subscription.models.js";
import SubscriptionPlan from "../models/subscriptionPlan.models.js";
import Payment from "../models/payment.models.js";
import User from "../models/user.models.js";

// Get all available subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.getPublicPlans();
    
    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.plan_id,
        name: plan.name,
        display_name: plan.display_name,
        plan_type: plan.plan_type,
        category: plan.category,
        pricing: plan.pricing,
        features: plan.features,
        description: plan.description,
        short_description: plan.short_description,
        features_list: plan.features_list,
        popular: plan.popular,
        trial_days: plan.trial_days,
        yearlyDiscount: plan.yearlyDiscount,
        yearlyDiscountPercentage: plan.yearlyDiscountPercentage
      }))
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subscription plans"
    });
  }
};

// Get current user's subscription
export const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    const subscription = await Subscription.findOne({
      user_id: userId,
      tenant_id: tenantId,
      status: { $in: ["active", "trialing"] }
    }).populate("subscription_id");

    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
        status: "free"
      });
    }

    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        plan_id: subscription.plan_id,
        plan_name: subscription.plan_name,
        plan_type: subscription.plan_type,
        status: subscription.status,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        trial_end_date: subscription.trial_end_date,
        billing_cycle: subscription.billing_cycle,
        amount: subscription.amount,
        currency: subscription.currency,
        features: subscription.features,
        usage: subscription.usage,
        auto_renew: subscription.auto_renew,
        isActive: subscription.isActive,
        isTrial: subscription.isTrial
      }
    });
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subscription"
    });
  }
};

// Create new subscription (with trial)
export const createSubscription = async (req, res) => {
  try {
    const { plan_id, billing_cycle = "monthly" } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user_id: userId,
      tenant_id: tenantId,
      status: { $in: ["active", "trialing"] }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: "User already has an active subscription"
      });
    }

    // Get the subscription plan
    const plan = await SubscriptionPlan.findOne({ plan_id, is_active: true });
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: "Subscription plan not found"
      });
    }

    // Create subscription with trial
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + (plan.trial_days * 24 * 60 * 60 * 1000));

    const subscription = new Subscription({
      tenant_id: tenantId,
      user_id: userId,
      plan_id: plan.plan_id,
      plan_name: plan.name,
      plan_type: plan.plan_type,
      amount: plan.getPricing(billing_cycle).amount,
      currency: plan.getPricing(billing_cycle).currency,
      billing_cycle,
      status: "trialing",
      start_date: now,
      trial_end_date: trialEndDate,
      payment_gateway: "stripe", // Default, will be updated when payment is processed
      features: plan.features,
      usage: {
        current_assets: 0,
        current_users: 1,
        scans_this_month: 0,
        last_reset_date: now
      }
    });

    await subscription.save();

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      subscription_status: "trial",
      current_subscription: subscription._id
    });

    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        plan_id: subscription.plan_id,
        plan_name: subscription.plan_name,
        plan_type: subscription.plan_type,
        status: subscription.status,
        start_date: subscription.start_date,
        trial_end_date: subscription.trial_end_date,
        billing_cycle: subscription.billing_cycle,
        amount: subscription.amount,
        currency: subscription.currency,
        features: subscription.features,
        usage: subscription.usage,
        isActive: subscription.isActive,
        isTrial: subscription.isTrial
      }
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create subscription"
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { subscription_id } = req.params;
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    const subscription = await Subscription.findOne({
      _id: subscription_id,
      user_id: userId,
      tenant_id: tenantId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found"
      });
    }

    // Update subscription status
    subscription.status = "cancelled";
    subscription.cancelled_at = new Date();
    subscription.auto_renew = false;
    await subscription.save();

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      subscription_status: "cancelled"
    });

    res.json({
      success: true,
      message: "Subscription cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel subscription"
    });
  }
};

// Update subscription (upgrade/downgrade)
export const updateSubscription = async (req, res) => {
  try {
    const { subscription_id } = req.params;
    const { plan_id, billing_cycle } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    const subscription = await Subscription.findOne({
      _id: subscription_id,
      user_id: userId,
      tenant_id: tenantId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found"
      });
    }

    // Get the new plan
    const newPlan = await SubscriptionPlan.findOne({ plan_id, is_active: true });
    if (!newPlan) {
      return res.status(404).json({
        success: false,
        error: "Subscription plan not found"
      });
    }

    // Update subscription
    subscription.plan_id = newPlan.plan_id;
    subscription.plan_name = newPlan.name;
    subscription.plan_type = newPlan.plan_type;
    subscription.amount = newPlan.getPricing(billing_cycle || subscription.billing_cycle).amount;
    subscription.currency = newPlan.getPricing(billing_cycle || subscription.billing_cycle).currency;
    subscription.features = newPlan.features;
    
    if (billing_cycle) {
      subscription.billing_cycle = billing_cycle;
    }

    await subscription.save();

    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        plan_id: subscription.plan_id,
        plan_name: subscription.plan_name,
        plan_type: subscription.plan_type,
        status: subscription.status,
        billing_cycle: subscription.billing_cycle,
        amount: subscription.amount,
        currency: subscription.currency,
        features: subscription.features,
        usage: subscription.usage
      }
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update subscription"
    });
  }
};

// Get subscription usage
export const getSubscriptionUsage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    const subscription = await Subscription.findOne({
      user_id: userId,
      tenant_id: tenantId,
      status: { $in: ["active", "trialing"] }
    });

    if (!subscription) {
      return res.json({
        success: true,
        usage: {
          current_assets: 0,
          current_users: 1,
          scans_this_month: 0,
          limits: {
            max_assets: 100,
            max_users: 5,
            max_scans_per_month: 1000
          }
        }
      });
    }

    res.json({
      success: true,
      usage: {
        current_assets: subscription.usage.current_assets,
        current_users: subscription.usage.current_users,
        scans_this_month: subscription.usage.scans_this_month,
        limits: {
          max_assets: subscription.features.max_assets,
          max_users: subscription.features.max_users,
          max_scans_per_month: subscription.features.max_scans_per_month
        }
      }
    });
  } catch (error) {
    console.error("Error fetching subscription usage:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subscription usage"
    });
  }
};

// Update subscription usage
export const updateSubscriptionUsage = async (req, res) => {
  try {
    const { action } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    const subscription = await Subscription.findOne({
      user_id: userId,
      tenant_id: tenantId,
      status: { $in: ["active", "trialing"] }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "No active subscription found"
      });
    }

    // Update usage
    await subscription.updateUsage(action);

    res.json({
      success: true,
      message: "Usage updated successfully",
      usage: subscription.usage
    });
  } catch (error) {
    console.error("Error updating subscription usage:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update subscription usage"
    });
  }
};

// Get billing history
export const getBillingHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({
      user_id: userId,
      tenant_id: tenantId
    })
    .sort({ created_at: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("subscription_id", "plan_name plan_type");

    const total = await Payment.countDocuments({
      user_id: userId,
      tenant_id: tenantId
    });

    res.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment._id,
        amount: payment.amount,
        amountInDollars: payment.amountInDollars,
        currency: payment.currency,
        status: payment.status,
        payment_gateway: payment.payment_gateway,
        description: payment.description,
        receipt_url: payment.receipt_url,
        billing_period_start: payment.billing_period_start,
        billing_period_end: payment.billing_period_end,
        created_at: payment.created_at,
        subscription: payment.subscription_id
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error("Error fetching billing history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch billing history"
    });
  }
};






