# Stripe Integration & Licensing System

This document describes the comprehensive Stripe integration and licensing certificate system implemented for the ITAM platform.

## Overview

The system provides:
- **Tenant-based Stripe subscription management** using tenant ID as the primary key
- **Digital licensing certificates** with organization name and tenant ID
- **Seamless integration** between subscriptions and licenses
- **Usage tracking and limits** enforcement
- **Webhook handling** for real-time updates

## Features

### Stripe Integration

#### Customer Management
- Automatic customer creation with tenant metadata
- Customer portal access for self-service billing
- Tenant-based customer identification

#### Subscription Management
- Create subscriptions with trial periods
- Upgrade/downgrade subscriptions
- Cancel subscriptions (immediate or end of period)
- Automatic webhook handling for status updates

#### Payment Processing
- Stripe payment intents
- Recurring billing
- Payment method management
- Refund processing

### Licensing System

#### License Creation
- Automatic license generation from tenant ID
- Digital signature verification
- Organization-based licensing
- Feature-based access control

#### License Management
- License renewal and expiration tracking
- Suspension and revocation capabilities
- Usage monitoring and limits
- Certificate generation

## API Endpoints

### Stripe Endpoints

```
POST /api/stripe/customer
POST /api/stripe/subscription
PUT /api/stripe/subscription/:id
DELETE /api/stripe/subscription/:id
POST /api/stripe/portal
POST /api/stripe/webhook
GET /api/stripe/analytics
```

### License Endpoints

```
POST /api/license
GET /api/license/current
GET /api/license/tenant/:tenant_id
PUT /api/license/:id
PUT /api/license/:id/renew
PUT /api/license/:id/suspend
PUT /api/license/:id/revoke
POST /api/license/verify
GET /api/license/usage
POST /api/license/usage
GET /api/license/:id/certificate
```

## Configuration

### Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# License Configuration
LICENSE_SECRET_KEY=your-license-secret-key

# Application URLs
CLIENT_URL=http://localhost:3001
```

### Stripe Webhook Setup

1. Create a webhook endpoint in Stripe Dashboard
2. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## Usage Examples

### Creating a Stripe Subscription

```javascript
// Create customer and subscription
const response = await fetch('/api/stripe/subscription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    plan_id: 'professional',
    billing_cycle: 'monthly',
    payment_method_id: 'pm_1234567890'
  })
});

const { subscription, stripe_subscription } = await response.json();
```

### Creating a License

```javascript
// Create license for organization
const response = await fetch('/api/license', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    organization_name: 'Acme Corporation',
    organization_domain: 'acme.com',
    license_type: 'professional',
    valid_through: '2025-12-31',
    issued_to: 'John Doe',
    contact_email: 'john@acme.com',
    features: {
      max_assets: 1000,
      max_users: 50,
      api_access: true
    }
  })
});

const { license } = await response.json();
```

### Verifying a License

```javascript
// Verify license validity
const response = await fetch('/api/license/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    license_number: 'LIC-ABC123DEF456',
    digital_signature: 'abc123...'
  })
});

const { verification } = await response.json();
```

## Middleware Integration

### License Checking Middleware

```javascript
import { requireValidLicense, checkLicenseLimits } from '../middleware/license.js';

// Require valid license for all routes
app.use('/api/protected', requireValidLicense);

// Check specific limits
app.post('/api/assets', 
  checkLicenseLimits('add_asset'),
  updateLicenseUsageAfterAction('asset_added'),
  createAsset
);
```

### Subscription Middleware

```javascript
import { requireActiveSubscription, checkSubscriptionLimits } from '../middleware/subscription.js';

// Require active subscription
app.use('/api/premium', requireActiveSubscription);

// Check subscription limits
app.post('/api/users',
  checkSubscriptionLimits('add_user'),
  updateUsageAfterAction('user_added'),
  createUser
);
```

## Database Models

### Subscription Model
- Tenant-based multi-tenancy
- Stripe integration fields
- Feature and usage tracking
- Automatic status management

### License Model
- Digital signature verification
- Organization information
- Feature-based access control
- Usage monitoring

### Payment Model
- Multi-gateway support
- Transaction tracking
- Refund management
- Receipt generation

## Security Features

### Digital Signatures
- SHA-256 HMAC signatures
- License integrity verification
- Tamper detection

### Tenant Isolation
- Tenant ID as primary key
- Data segregation
- Access control enforcement

### Webhook Security
- Stripe signature verification
- Event validation
- Idempotency handling

## Monitoring and Analytics

### Subscription Analytics
- Revenue tracking
- Usage statistics
- Customer metrics
- Churn analysis

### License Analytics
- License distribution
- Expiration tracking
- Usage patterns
- Compliance reporting

## Error Handling

### Stripe Errors
- Payment failures
- Subscription issues
- Webhook errors
- Customer portal errors

### License Errors
- Invalid signatures
- Expired licenses
- Limit exceeded
- Feature access denied

## Testing

### Unit Tests
```bash
npm test -- --grep "stripe"
npm test -- --grep "license"
```

### Integration Tests
```bash
npm run test:integration
```

### Webhook Testing
Use Stripe CLI for local webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Deployment

### Production Checklist
- [ ] Set up Stripe webhook endpoints
- [ ] Configure environment variables
- [ ] Set up SSL certificates
- [ ] Configure database indexes
- [ ] Set up monitoring and logging
- [ ] Test webhook delivery
- [ ] Verify license generation
- [ ] Test subscription flows

### Docker Deployment
```dockerfile
# Add to Dockerfile
ENV STRIPE_SECRET_KEY=sk_live_...
ENV LICENSE_SECRET_KEY=production-secret-key
```

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   - Check STRIPE_WEBHOOK_SECRET
   - Verify webhook endpoint URL
   - Check request body parsing

2. **License Verification Failed**
   - Verify LICENSE_SECRET_KEY
   - Check license data integrity
   - Validate signature algorithm

3. **Subscription Not Updating**
   - Check webhook event handling
   - Verify database connections
   - Check error logs

### Debug Mode
```env
DEBUG=stripe,license
LOG_LEVEL=debug
```

## Support

For issues related to:
- **Stripe Integration**: Check Stripe Dashboard and webhook logs
- **License System**: Verify license data and signatures
- **General Issues**: Check application logs and database

## License

This integration system is part of the ITAM platform and follows the same licensing terms.

