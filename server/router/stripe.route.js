import express from "express";
import {
  createOrGetStripeCustomer,
  createStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  createCustomerPortalSession,
  handleStripeWebhook,
  getTenantSubscriptionAnalytics,
  getCurrentSubscription,
  createPaymentIntent,
} from "../controllers/stripe.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Webhook route (no auth required, verified by webhook signature)
router.post("/webhook", handleStripeWebhook);

// Protected routes (auth required)
router.use(verifyToken);

// Customer management
router.post("/customer", createOrGetStripeCustomer);

// Subscription management
router.post("/subscription", createStripeSubscription);
router.put("/subscription/:subscription_id", updateStripeSubscription);
router.delete("/subscription/:subscription_id", cancelStripeSubscription);

// Customer portal
router.post("/portal", createCustomerPortalSession);

// Analytics
router.get("/analytics", getTenantSubscriptionAnalytics);

// Get current subscription
router.get("/current-subscription", getCurrentSubscription);

// Create payment intent for testing
router.post("/payment-intent", createPaymentIntent);

export default router;

