import express from "express";
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  createSubscription,
  cancelSubscription,
  updateSubscription,
  getSubscriptionUsage,
  updateSubscriptionUsage,
  getBillingHistory
} from "../controllers/subscription.controller.js";
import {
  createPaymentIntent,
  createPayPalPayment,
  createRazorpayPayment,
  handlePaymentWebhook,
  getPaymentMethods,
  processRefund
} from "../controllers/payment.controller.js";
import { verifyToken } from "../middleware/auth.js";
import { 
  requireActiveSubscription,
  checkSubscriptionLimits,
  requireFeature,
  updateUsageAfterAction,
  checkTrialStatus
} from "../middleware/subscription.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/plans", getSubscriptionPlans);

// Payment webhook (no auth required, verified by webhook signature)
router.post("/webhook", handlePaymentWebhook);

// Protected routes (auth required)
router.use(verifyToken);

// Subscription management routes
router.get("/current", getCurrentSubscription);
router.post("/create", createSubscription);
router.put("/:subscription_id/cancel", cancelSubscription);
router.put("/:subscription_id/update", updateSubscription);
router.get("/usage", getSubscriptionUsage);
router.post("/usage", updateSubscriptionUsage);

// Payment routes
router.post("/payment/stripe", createPaymentIntent);
router.post("/payment/paypal", createPayPalPayment);
router.post("/payment/razorpay", createRazorpayPayment);
router.get("/payment/methods", getPaymentMethods);
router.post("/payment/:payment_id/refund", processRefund);

// Billing routes
router.get("/billing/history", getBillingHistory);

// Feature-specific routes with subscription checks
router.get("/api/status", requireFeature("api_access"), (req, res) => {
  res.json({ success: true, message: "API access granted" });
});

router.get("/analytics/advanced", requireFeature("advanced_analytics"), (req, res) => {
  res.json({ success: true, message: "Advanced analytics access granted" });
});

router.get("/branding/custom", requireFeature("custom_branding"), (req, res) => {
  res.json({ success: true, message: "Custom branding access granted" });
});

router.get("/patches/management", requireFeature("patch_management"), (req, res) => {
  res.json({ success: true, message: "Patch management access granted" });
});

router.get("/compliance/reports", requireFeature("compliance_reporting"), (req, res) => {
  res.json({ success: true, message: "Compliance reporting access granted" });
});

router.get("/sso/integration", requireFeature("sso_integration"), (req, res) => {
  res.json({ success: true, message: "SSO integration access granted" });
});

router.get("/integrations/custom", requireFeature("custom_integrations"), (req, res) => {
  res.json({ success: true, message: "Custom integrations access granted" });
});

router.get("/white-label", requireFeature("white_label"), (req, res) => {
  res.json({ success: true, message: "White label access granted" });
});

router.get("/support/dedicated", requireFeature("dedicated_support"), (req, res) => {
  res.json({ success: true, message: "Dedicated support access granted" });
});

// Example routes with usage tracking
router.post("/assets", 
  checkSubscriptionLimits("add_asset"),
  updateUsageAfterAction("asset_added"),
  (req, res) => {
    // Asset creation logic would go here
    res.json({ success: true, message: "Asset created successfully" });
  }
);

router.post("/users", 
  checkSubscriptionLimits("add_user"),
  updateUsageAfterAction("user_added"),
  (req, res) => {
    // User creation logic would go here
    res.json({ success: true, message: "User created successfully" });
  }
);

router.post("/scans", 
  checkSubscriptionLimits("perform_scan"),
  updateUsageAfterAction("scan_performed"),
  (req, res) => {
    // Scan execution logic would go here
    res.json({ success: true, message: "Scan performed successfully" });
  }
);

export default router;






