import Stripe from "stripe";
import Subscription from "../models/subscription.models.js";
import User from "../models/user.models.js";
import Payment from "../models/payment.models.js";
import SubscriptionPlan from "../models/subscriptionPlan.models.js";
import { generateTenantId } from "../utils/tenantUtils.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create or retrieve Stripe customer for tenant
export const createOrGetStripeCustomer = async (req, res) => {
  try {
    const { email, name, organization_name } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    // Check if customer already exists for this tenant
    const existingSubscription = await Subscription.findOne({
      tenant_id: tenantId,
      gateway_customer_id: { $exists: true },
    });

    if (existingSubscription?.gateway_customer_id) {
      // Retrieve existing customer
      const customer = await stripe.customers.retrieve(
        existingSubscription.gateway_customer_id
      );

      return res.json({
        success: true,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          metadata: customer.metadata,
        },
      });
    }

    // Create new Stripe customer with tenant information
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        tenant_id: tenantId,
        user_id: userId,
        organization_name: organization_name || name,
        created_via: "itam_platform",
      },
    });

    // Update any existing subscriptions with the customer ID
    await Subscription.updateMany(
      { tenant_id: tenantId },
      { gateway_customer_id: customer.id }
    );

    res.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        metadata: customer.metadata,
      },
    });
  } catch (error) {
    console.error("Error creating/retrieving Stripe customer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create/retrieve customer",
    });
  }
};

// Create subscription with Stripe
export const createStripeSubscription = async (req, res) => {
  try {
    console.log("🔧 DEBUG - createStripeSubscription called");
    console.log("🔧 DEBUG - Request body:", req.body);
    console.log("🔧 DEBUG - User:", { userId: req.user.userId, tenantId: req.user.tenant_id });
    
    const { plan_id, billing_cycle = "monthly", payment_method_id } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user_id: userId,
      tenant_id: tenantId,
      status: { $in: ["active", "trialing"] },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: "User already has an active subscription",
      });
    }

    // Get the subscription plan
    console.log("🔧 DEBUG - Looking for plan:", plan_id);
    const plan = await SubscriptionPlan.findOne({ plan_id, is_active: true });
    console.log("🔧 DEBUG - Plan found:", plan ? "✅ Yes" : "❌ No");
    if (!plan) {
      console.log("🔧 DEBUG - Available plans:");
      const allPlans = await SubscriptionPlan.find({});
      console.log(allPlans.map(p => ({ plan_id: p.plan_id, is_active: p.is_active })));
      
      return res.status(404).json({
        success: false,
        error: "Subscription plan not found",
      });
    }

    // Get or create Stripe customer
    const user = await User.findById(userId);
    let customerId = existingSubscription?.gateway_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          tenant_id: tenantId,
          user_id: userId,
          organization_name:
            user.organization_name || `${user.firstName} ${user.lastName}`,
          created_via: "itam_platform",
        },
      });
      customerId = customer.id;
    }

    // Create Stripe product first
    const product = await stripe.products.create({
      name: plan.display_name,
      description: plan.description,
      metadata: {
        plan_id: plan.plan_id,
        tenant_id: tenantId,
      },
    });

    // Create Stripe price for the plan
    const price = await stripe.prices.create({
      unit_amount: plan.getPricing(billing_cycle).amount,
      currency: plan.getPricing(billing_cycle).currency,
      recurring: {
        interval: billing_cycle === "yearly" ? "year" : "month",
      },
      product: product.id,
    });

    // Attach payment method to customer if provided
    if (payment_method_id) {
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: payment_method_id,
        },
      });
    }

    // Create Stripe subscription
    const subscriptionParams = {
      customer: customerId,
      items: [{ price: price.id }],
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        tenant_id: tenantId,
        user_id: userId,
        plan_id: plan.plan_id,
      },
      trial_period_days: plan.trial_days,
    };

    // If payment method is provided, set payment behavior and settings
    if (payment_method_id) {
      subscriptionParams.default_payment_method = payment_method_id;
      subscriptionParams.payment_behavior = "default_incomplete";
      subscriptionParams.payment_settings = { 
        save_default_payment_method: "on_subscription" 
      };
    }

    const stripeSubscription = await stripe.subscriptions.create(subscriptionParams);
    console.log("🔧 DEBUG - Stripe subscription created:", {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      latest_invoice: stripeSubscription.latest_invoice ? "exists" : "null",
      payment_intent: stripeSubscription.latest_invoice?.payment_intent ? "exists" : "null"
    });

    // Create local subscription record
    const now = new Date();
    const trialEndDate = new Date(
      now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000
    );

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
      payment_gateway: "stripe",
      gateway_subscription_id: stripeSubscription.id,
      gateway_customer_id: customerId,
      features: plan.features,
      usage: {
        current_assets: 0,
        current_users: 1,
        scans_this_month: 0,
        last_reset_date: now,
      },
    });

    await subscription.save();

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      subscription_status: "trial",
      current_subscription: subscription._id,
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
        isTrial: subscription.isTrial,
      },
      stripe_subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        client_secret:
          stripeSubscription.latest_invoice?.payment_intent?.client_secret || null,
      },
    });
  } catch (error) {
    console.error("🔧 DEBUG - Error creating Stripe subscription:", error);
    console.error("🔧 DEBUG - Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create subscription",
    });
  }
};

// Update subscription (upgrade/downgrade)
export const updateStripeSubscription = async (req, res) => {
  try {
    const { subscription_id } = req.params;
    const { plan_id, billing_cycle } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    const subscription = await Subscription.findOne({
      _id: subscription_id,
      user_id: userId,
      tenant_id: tenantId,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }

    // Get the new plan
    const newPlan = await SubscriptionPlan.findOne({
      plan_id,
      is_active: true,
    });
    if (!newPlan) {
      return res.status(404).json({
        success: false,
        error: "Subscription plan not found",
      });
    }

    // Create Stripe product first
    const product = await stripe.products.create({
      name: newPlan.display_name,
      description: newPlan.description,
      metadata: {
        plan_id: newPlan.plan_id,
        tenant_id: tenantId,
      },
    });

    // Create new Stripe price
    const price = await stripe.prices.create({
      unit_amount: newPlan.getPricing(
        billing_cycle || subscription.billing_cycle
      ).amount,
      currency: newPlan.getPricing(billing_cycle || subscription.billing_cycle)
        .currency,
      recurring: {
        interval:
          (billing_cycle || subscription.billing_cycle) === "yearly"
            ? "year"
            : "month",
      },
      product: product.id,
    });

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.gateway_subscription_id,
      {
        items: [
          {
            id: subscription.gateway_subscription_id,
            price: price.id,
          },
        ],
        proration_behavior: "create_prorations",
        metadata: {
          tenant_id: tenantId,
          user_id: userId,
          plan_id: newPlan.plan_id,
        },
      }
    );

    // Update local subscription
    subscription.plan_id = newPlan.plan_id;
    subscription.plan_name = newPlan.name;
    subscription.plan_type = newPlan.plan_type;
    subscription.amount = newPlan.getPricing(
      billing_cycle || subscription.billing_cycle
    ).amount;
    subscription.currency = newPlan.getPricing(
      billing_cycle || subscription.billing_cycle
    ).currency;
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
        usage: subscription.usage,
      },
      stripe_subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
      },
    });
  } catch (error) {
    console.error("Error updating Stripe subscription:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update subscription",
    });
  }
};

// Cancel Stripe subscription
export const cancelStripeSubscription = async (req, res) => {
  try {
    const { subscription_id } = req.params;
    const { cancel_immediately = false } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    const subscription = await Subscription.findOne({
      _id: subscription_id,
      user_id: userId,
      tenant_id: tenantId,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }

    // Cancel Stripe subscription
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.gateway_subscription_id,
      {
        cancel_at_period_end: !cancel_immediately,
        metadata: {
          tenant_id: tenantId,
          user_id: userId,
          cancelled_by: "user",
        },
      }
    );

    // Update local subscription
    subscription.status = cancel_immediately ? "cancelled" : "active";
    subscription.cancelled_at = new Date();
    subscription.auto_renew = false;
    await subscription.save();

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      subscription_status: cancel_immediately ? "cancelled" : "active",
    });

    res.json({
      success: true,
      message: cancel_immediately
        ? "Subscription cancelled immediately"
        : "Subscription will be cancelled at the end of the billing period",
      subscription: {
        id: subscription._id,
        status: subscription.status,
        cancelled_at: subscription.cancelled_at,
      },
      stripe_subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error("Error cancelling Stripe subscription:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel subscription",
    });
  }
};

// Get Stripe customer portal session
export const createCustomerPortalSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    const subscription = await Subscription.findOne({
      user_id: userId,
      tenant_id: tenantId,
      gateway_customer_id: { $exists: true },
    });

    if (!subscription?.gateway_customer_id) {
      return res.status(404).json({
        success: false,
        error: "No Stripe customer found",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.gateway_customer_id,
      return_url: `${process.env.CLIENT_URL}/dashboard/billing`,
    });

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create customer portal session",
    });
  }
};

// Handle Stripe webhooks
export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    res.status(500).json({
      success: false,
      error: "Failed to handle webhook",
    });
  }
};

// Helper functions for webhook handling
const handleSubscriptionCreated = async (stripeSubscription) => {
  try {
    const tenantId = stripeSubscription.metadata.tenant_id;
    const userId = stripeSubscription.metadata.user_id;

    const subscription = await Subscription.findOne({
      tenant_id: tenantId,
      user_id: userId,
      gateway_subscription_id: stripeSubscription.id,
    });

    if (subscription) {
      subscription.status = stripeSubscription.status;
      subscription.gateway_customer_id = stripeSubscription.customer;
      await subscription.save();
    }
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
};

const handleSubscriptionUpdated = async (stripeSubscription) => {
  try {
    const subscription = await Subscription.findOne({
      gateway_subscription_id: stripeSubscription.id,
    });

    if (subscription) {
      subscription.status = stripeSubscription.status;
      subscription.auto_renew = !stripeSubscription.cancel_at_period_end;

      if (stripeSubscription.canceled_at) {
        subscription.cancelled_at = new Date(
          stripeSubscription.canceled_at * 1000
        );
        subscription.status = "cancelled";
      }

      await subscription.save();

      // Update user subscription status
      await User.findByIdAndUpdate(subscription.user_id, {
        subscription_status: subscription.status,
      });
    }
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
};

const handleSubscriptionDeleted = async (stripeSubscription) => {
  try {
    const subscription = await Subscription.findOne({
      gateway_subscription_id: stripeSubscription.id,
    });

    if (subscription) {
      subscription.status = "cancelled";
      subscription.cancelled_at = new Date();
      subscription.auto_renew = false;
      await subscription.save();

      // Update user subscription status
      await User.findByIdAndUpdate(subscription.user_id, {
        subscription_status: "cancelled",
      });
    }
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
};

const handleInvoicePaymentSucceeded = async (invoice) => {
  try {
    const subscription = await Subscription.findOne({
      gateway_subscription_id: invoice.subscription,
    });

    if (subscription) {
      // Create payment record
      const payment = new Payment({
        tenant_id: subscription.tenant_id,
        subscription_id: subscription._id,
        user_id: subscription.user_id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        payment_gateway: "stripe",
        gateway_payment_id: invoice.payment_intent,
        status: "completed",
        description: `Payment for ${subscription.plan_name} subscription`,
        billing_period_start: new Date(invoice.period_start * 1000),
        billing_period_end: new Date(invoice.period_end * 1000),
        receipt_url: invoice.hosted_invoice_url,
      });

      await payment.save();

      // Update subscription status
      subscription.status = "active";
      await subscription.save();

      // Update user subscription status
      await User.findByIdAndUpdate(subscription.user_id, {
        subscription_status: "active",
      });
    }
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
  }
};

const handleInvoicePaymentFailed = async (invoice) => {
  try {
    const subscription = await Subscription.findOne({
      gateway_subscription_id: invoice.subscription,
    });

    if (subscription) {
      subscription.status = "past_due";
      await subscription.save();

      // Update user subscription status
      await User.findByIdAndUpdate(subscription.user_id, {
        subscription_status: "past_due",
      });
    }
  } catch (error) {
    console.error("Error handling invoice payment failed:", error);
  }
};

const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({
      gateway_payment_id: paymentIntent.id,
    });

    if (payment) {
      payment.status = "completed";
      payment.receipt_url = paymentIntent.receipt_url;
      await payment.save();
    }
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
  }
};

const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({
      gateway_payment_id: paymentIntent.id,
    });

    if (payment) {
      payment.status = "failed";
      payment.failure_reason = paymentIntent.last_payment_error?.message;
      payment.failure_code = paymentIntent.last_payment_error?.code;
      await payment.save();
    }
  } catch (error) {
    console.error("Error handling payment intent failed:", error);
  }
};

// Get tenant subscription analytics
export const getTenantSubscriptionAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    // Get subscription statistics
    const subscriptionStats = await Subscription.aggregate([
      { $match: { tenant_id: tenantId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    // Get payment statistics
    const paymentStats = await Payment.getPaymentStats(tenantId);

    // Get usage statistics
    const usageStats = await Subscription.aggregate([
      {
        $match: {
          tenant_id: tenantId,
          status: { $in: ["active", "trialing"] },
        },
      },
      {
        $group: {
          _id: null,
          totalAssets: { $sum: "$usage.current_assets" },
          totalUsers: { $sum: "$usage.current_users" },
          totalScans: { $sum: "$usage.scans_this_month" },
        },
      },
    ]);

    res.json({
      success: true,
      analytics: {
        subscriptions: subscriptionStats,
        payments: paymentStats,
        usage: usageStats[0] || {
          totalAssets: 0,
          totalUsers: 0,
          totalScans: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching subscription analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subscription analytics",
    });
  }
};
