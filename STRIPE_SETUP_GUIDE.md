# Stripe Integration Setup Guide

## 1. Environment Variables Setup

Add these variables to your `server/.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# License Configuration
LICENSE_SECRET_KEY=your-license-secret-key

# Application URLs
CLIENT_URL=http://localhost:3001
SERVER_URL=http://localhost:3000
```

## 2. Install Dependencies

The Stripe package is already included in your `package.json`. If you need to reinstall:

```bash
cd server
npm install stripe
```

## 3. Test the Integration

### Start Your Server
```bash
cd server
npm run dev
```

### Test Stripe Customer Creation
```bash
curl -X POST http://localhost:3000/api/stripe/customer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "organization_name": "Test Organization"
  }'
```

### Test Subscription Creation
```bash
curl -X POST http://localhost:3000/api/stripe/subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "plan_id": "basic",
    "billing_cycle": "monthly",
    "payment_method_id": "pm_card_visa"
  }'
```

## 4. Webhook Setup

### Create Webhook Endpoint
1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### Get Webhook Secret
1. After creating the webhook, click on it
2. Copy the **Signing secret** (starts with `whsec_`)
3. Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## 5. Frontend Integration

### Install Stripe.js
```bash
cd client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Create Stripe Provider
Create `client/src/components/StripeProvider.js`:

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function StripeProvider({ children }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
```

### Create Payment Form
Create `client/src/components/PaymentForm.js`:

```javascript
import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

export default function PaymentForm({ subscriptionId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      console.error(error);
    } else {
      // Create subscription with payment method
      const response = await fetch('/api/stripe/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan_id: 'basic',
          billing_cycle: 'monthly',
          payment_method_id: paymentMethod.id
        })
      });

      const result = await response.json();
      if (result.success) {
        // Handle successful subscription
        console.log('Subscription created:', result);
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Subscribe'}
      </button>
    </form>
  );
}
```

## 6. Testing with Stripe Test Cards

Use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

## 7. Production Setup

### Switch to Live Mode
1. In Stripe Dashboard, toggle **Live mode**
2. Get your live API keys
3. Update your `.env` file with live keys
4. Update webhook URL to production domain

### Security Checklist
- [ ] Use HTTPS in production
- [ ] Validate webhook signatures
- [ ] Store sensitive data securely
- [ ] Implement proper error handling
- [ ] Set up monitoring and logging

## 8. Common Issues & Solutions

### Webhook Signature Verification Failed
- Check `STRIPE_WEBHOOK_SECRET` in `.env`
- Ensure webhook URL is accessible
- Verify request body parsing

### Payment Method Creation Failed
- Check Stripe publishable key
- Verify card element is properly mounted
- Check browser console for errors

### Subscription Creation Failed
- Verify plan exists in database
- Check user authentication
- Ensure customer exists in Stripe

## 9. Next Steps

1. **Create Subscription Plans**: Set up your pricing plans in the database
2. **Implement Billing UI**: Create subscription management interface
3. **Add Usage Tracking**: Monitor subscription limits
4. **Set up Analytics**: Track subscription metrics
5. **Implement Dunning**: Handle failed payments

## 10. API Endpoints Reference

- `POST /api/stripe/customer` - Create/retrieve customer
- `POST /api/stripe/subscription` - Create subscription
- `PUT /api/stripe/subscription/:id` - Update subscription
- `DELETE /api/stripe/subscription/:id` - Cancel subscription
- `POST /api/stripe/portal` - Create customer portal session
- `POST /api/stripe/webhook` - Handle webhooks
- `GET /api/stripe/analytics` - Get subscription analytics

