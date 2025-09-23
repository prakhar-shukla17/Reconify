import Payment from "../models/payment.models.js";
import Subscription from "../models/subscription.models.js";
import User from "../models/user.models.js";
import SubscriptionPlan from "../models/subscriptionPlan.models.js";

// Stripe integration
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for subscription
export const createPaymentIntent = async (req, res) => {
  try {
    const { subscription_id, payment_method_id } = req.body;
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

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: subscription.amount,
      currency: subscription.currency,
      payment_method: payment_method_id,
      confirmation_method: "manual",
      confirm: true,
      metadata: {
        subscription_id: subscription._id.toString(),
        user_id: userId,
        tenant_id: tenantId
      }
    });

    // Create payment record
    const payment = new Payment({
      tenant_id: tenantId,
      subscription_id: subscription._id,
      user_id: userId,
      amount: subscription.amount,
      currency: subscription.currency,
      payment_gateway: "stripe",
      gateway_payment_id: paymentIntent.id,
      status: paymentIntent.status === "succeeded" ? "completed" : "pending",
      description: `Payment for ${subscription.plan_name} subscription`,
      billing_period_start: subscription.start_date,
      billing_period_end: subscription.end_date
    });

    await payment.save();

    // If payment succeeded, activate subscription
    if (paymentIntent.status === "succeeded") {
      subscription.status = "active";
      subscription.payment_gateway = "stripe";
      subscription.gateway_subscription_id = paymentIntent.id;
      subscription.gateway_customer_id = paymentIntent.customer;
      await subscription.save();

      // Update user subscription status
      await User.findByIdAndUpdate(userId, {
        subscription_status: "active"
      });
    }

    res.json({
      success: true,
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret
      },
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status
      }
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create payment intent"
    });
  }
};

// Create PayPal payment
export const createPayPalPayment = async (req, res) => {
  try {
    const { subscription_id } = req.body;
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

    // PayPal SDK integration would go here
    // For now, we'll create a placeholder payment
    const payment = new Payment({
      tenant_id: tenantId,
      subscription_id: subscription._id,
      user_id: userId,
      amount: subscription.amount,
      currency: subscription.currency,
      payment_gateway: "paypal",
      status: "pending",
      description: `Payment for ${subscription.plan_name} subscription`,
      billing_period_start: subscription.start_date,
      billing_period_end: subscription.end_date
    });

    await payment.save();

    res.json({
      success: true,
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        payment_url: `https://paypal.com/checkout/${payment._id}` // Placeholder
      }
    });
  } catch (error) {
    console.error("Error creating PayPal payment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create PayPal payment"
    });
  }
};

// Create Razorpay payment
export const createRazorpayPayment = async (req, res) => {
  try {
    const { subscription_id } = req.body;
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

    // Razorpay SDK integration would go here
    // For now, we'll create a placeholder payment
    const payment = new Payment({
      tenant_id: tenantId,
      subscription_id: subscription._id,
      user_id: userId,
      amount: subscription.amount,
      currency: subscription.currency,
      payment_gateway: "razorpay",
      status: "pending",
      description: `Payment for ${subscription.plan_name} subscription`,
      billing_period_start: subscription.start_date,
      billing_period_end: subscription.end_date
    });

    await payment.save();

    res.json({
      success: true,
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        razorpay_order_id: `order_${payment._id}` // Placeholder
      }
    });
  } catch (error) {
    console.error("Error creating Razorpay payment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create Razorpay payment"
    });
  }
};

// Handle payment webhook
export const handlePaymentWebhook = async (req, res) => {
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
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSuccess(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error handling payment webhook:", error);
    res.status(500).json({
      success: false,
      error: "Failed to handle webhook"
    });
  }
};

// Helper function to handle successful payment
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({
      gateway_payment_id: paymentIntent.id
    });

    if (payment) {
      payment.status = "completed";
      payment.receipt_url = paymentIntent.receipt_url;
      await payment.save();

      // Update subscription status
      const subscription = await Subscription.findById(payment.subscription_id);
      if (subscription) {
        subscription.status = "active";
        subscription.payment_gateway = "stripe";
        subscription.gateway_subscription_id = paymentIntent.id;
        await subscription.save();

        // Update user subscription status
        await User.findByIdAndUpdate(payment.user_id, {
          subscription_status: "active"
        });
      }
    }
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
};

// Helper function to handle failed payment
const handlePaymentFailure = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({
      gateway_payment_id: paymentIntent.id
    });

    if (payment) {
      payment.status = "failed";
      payment.failure_reason = paymentIntent.last_payment_error?.message;
      payment.failure_code = paymentIntent.last_payment_error?.code;
      await payment.save();

      // Update subscription status
      const subscription = await Subscription.findById(payment.subscription_id);
      if (subscription) {
        subscription.status = "past_due";
        await subscription.save();
      }
    }
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
};

// Helper function to handle invoice payment success
const handleInvoicePaymentSuccess = async (invoice) => {
  try {
    // Handle recurring payment success
    console.log("Invoice payment succeeded:", invoice.id);
  } catch (error) {
    console.error("Error handling invoice payment success:", error);
  }
};

// Helper function to handle invoice payment failure
const handleInvoicePaymentFailure = async (invoice) => {
  try {
    // Handle recurring payment failure
    console.log("Invoice payment failed:", invoice.id);
  } catch (error) {
    console.error("Error handling invoice payment failure:", error);
  }
};

// Get payment methods
export const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    // This would integrate with payment gateways to get saved payment methods
    // For now, return placeholder data
    const paymentMethods = [
      {
        id: "pm_1",
        type: "card",
        brand: "visa",
        last4: "4242",
        exp_month: 12,
        exp_year: 2025,
        is_default: true
      }
    ];

    res.json({
      success: true,
      payment_methods: paymentMethods
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment methods"
    });
  }
};

// Process refund
export const processRefund = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenant_id;

    const payment = await Payment.findOne({
      _id: payment_id,
      user_id: userId,
      tenant_id: tenantId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found"
      });
    }

    // Process refund through Stripe
    if (payment.payment_gateway === "stripe") {
      const refund = await stripe.refunds.create({
        payment_intent: payment.gateway_payment_id,
        amount: amount || payment.amount
      });

      await payment.processRefund(refund.amount, reason);
    }

    res.json({
      success: true,
      message: "Refund processed successfully",
      refund_amount: amount || payment.amount
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process refund"
    });
  }
};


