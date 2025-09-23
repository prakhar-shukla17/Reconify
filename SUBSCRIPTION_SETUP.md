# ITAM Subscription System Setup

This document provides instructions for setting up the subscription and payment system for the ITAM platform.

## Features

- **Multiple Subscription Plans**: Free, Basic, Professional, and Enterprise tiers
- **Multiple Payment Gateways**: Stripe, PayPal, and Razorpay integration
- **Trial Periods**: 14-day free trials for paid plans
- **Usage Tracking**: Monitor assets, users, and scans against plan limits
- **Billing Management**: View billing history and manage subscriptions
- **Webhook Support**: Handle payment events and subscription updates

## Database Models

### Subscription Plans (`subscriptionPlan.models.js`)
- Defines available plans with features and pricing
- Supports monthly and yearly billing cycles
- Includes trial periods and feature limitations

### Subscriptions (`subscription.models.js`)
- Tracks user subscriptions with status and usage
- Links to payment gateway subscription IDs
- Monitors usage against plan limits

### Payments (`payment.models.js`)
- Records all payment transactions
- Supports multiple payment gateways
- Tracks payment status and refunds

## API Endpoints

### Subscription Management
- `GET /api/subscription/plans` - Get available subscription plans
- `GET /api/subscription/current` - Get current user subscription
- `POST /api/subscription/create` - Create new subscription
- `PUT /api/subscription/:id/cancel` - Cancel subscription
- `PUT /api/subscription/:id/update` - Update subscription plan

### Payment Processing
- `POST /api/subscription/payment/stripe` - Process Stripe payment
- `POST /api/subscription/payment/paypal` - Process PayPal payment
- `POST /api/subscription/payment/razorpay` - Process Razorpay payment
- `POST /api/subscription/webhook` - Handle payment webhooks

### Billing & Usage
- `GET /api/subscription/billing/history` - Get billing history
- `GET /api/subscription/usage` - Get current usage statistics
- `POST /api/subscription/usage` - Update usage counters

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_MODE=sandbox  # or 'live' for production

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install stripe razorpay paypal-rest-sdk
```

### 2. Seed Subscription Plans

```bash
cd server
node scripts/seed-subscription-plans.js
```

This will create the default subscription plans in your database.

### 3. Configure Payment Gateways

#### Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Add them to your environment variables
4. Set up webhook endpoints for payment events

#### PayPal Setup
1. Create a PayPal Developer account
2. Create an application and get client ID/secret
3. Add them to your environment variables

#### Razorpay Setup
1. Create a Razorpay account at https://razorpay.com
2. Get your API keys from the Razorpay Dashboard
3. Add them to your environment variables

### 4. Update Frontend Environment

Add these to your client `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

### 5. Webhook Configuration

For Stripe webhooks:
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://yourdomain.com/api/subscription/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. Copy the webhook secret to your environment variables

## Usage

### Frontend Components

- **Subscription Page** (`/subscription`): Display plans and handle signups
- **Billing Dashboard** (`/billing`): Manage subscriptions and view history
- **Payment Modal**: Handle payment processing with multiple gateways

### Middleware Integration

Use the subscription middleware to protect routes:

```javascript
import { requireActiveSubscription, checkSubscriptionLimits, requireFeature } from '../middleware/subscription.js';

// Require active subscription
router.get('/protected', requireActiveSubscription, handler);

// Check specific limits
router.post('/assets', checkSubscriptionLimits('add_asset'), handler);

// Require specific feature
router.get('/analytics', requireFeature('advanced_analytics'), handler);
```

### Usage Tracking

Update usage when actions are performed:

```javascript
import { updateUsageAfterAction } from '../middleware/subscription.js';

router.post('/assets', 
  checkSubscriptionLimits('add_asset'),
  updateUsageAfterAction('asset_added'),
  handler
);
```

## Subscription Plans

### Free Plan
- 100 assets
- 5 users
- 1,000 scans/month
- Basic reporting
- Email support

### Basic Plan ($29/month)
- 500 assets
- 25 users
- 10,000 scans/month
- API access
- Advanced analytics
- Patch management
- Priority support

### Professional Plan ($99/month)
- 2,000 assets
- 100 users
- 50,000 scans/month
- All Basic features
- Compliance reporting
- SSO integration
- Custom integrations
- Custom branding

### Enterprise Plan ($299/month)
- 10,000 assets
- 500 users
- 200,000 scans/month
- All Professional features
- White-label solution
- Dedicated support

## Testing

### Test Cards (Stripe)
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Requires 3D Secure: 4000 0025 0000 3155

### Test PayPal
Use sandbox PayPal accounts for testing payments.

### Test Razorpay
Use test mode with test cards for development.

## Security Considerations

1. **Environment Variables**: Never commit API keys to version control
2. **Webhook Verification**: Always verify webhook signatures
3. **Input Validation**: Validate all payment-related inputs
4. **HTTPS**: Use HTTPS in production for all payment operations
5. **PCI Compliance**: Follow PCI DSS guidelines for card data handling

## Monitoring

- Monitor payment success/failure rates
- Track subscription metrics (MRR, churn, etc.)
- Set up alerts for failed payments
- Monitor usage against plan limits

## Support

For issues with the subscription system:
1. Check server logs for payment gateway errors
2. Verify webhook endpoints are receiving events
3. Ensure environment variables are correctly set
4. Test with sandbox/test credentials first


