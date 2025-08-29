# Tenant ID Implementation for Multi-Tenancy

This document explains the implementation of tenant ID-based multi-tenancy in the ITAM system.

## Overview

The system has been updated to support multi-tenancy by adding a `tenant_id` field to all database models. This allows different organizations or clients to have completely isolated data while sharing the same application instance.

## What Was Added

### 1. Database Models Updated

All MongoDB models now include a `tenant_id` field:

- **Hardware** (`hardware.models.js`)
- **Software** (`software.models.js`) 
- **User** (`user.models.js`)
- **Ticket** (`ticket.models.js`)
- **Telemetry** (`telemetry.models.js`)
- **SoftwarePatch** (`softwarePatch.models.js`)

### 2. Schema Changes

Each model now has:
```javascript
// Tenant ID for multi-tenancy
tenant_id: { type: String, required: true, index: true }
```

### 3. Controller Updates

All API controllers now:
- Filter data by `tenant_id` when fetching records
- Include `tenant_id` when creating new records
- Ensure data isolation between tenants

### 4. API Endpoints Updated

The following endpoints now respect tenant isolation:
- `GET /hardware` - Only returns hardware for the user's tenant
- `GET /software` - Only returns software for the user's tenant
- `GET /users` - Only returns users for the user's tenant
- `GET /tickets` - Only returns tickets for the user's tenant
- `GET /telemetry` - Only returns telemetry for the user's tenant
- All creation endpoints now include tenant_id

### 5. Tenant ID Generation

**Secure Hashing Implementation**:
- **Company Names**: Automatically hashed using SHA-256 algorithm
- **Tenant ID Format**: 16-character hexadecimal string (e.g., `a1b2c3d4e5f6g7h8`)
- **Consistency**: Same company name always generates the same tenant ID
- **Security**: Company names are not stored in plain text as tenant IDs
- **Utility Functions**: Centralized tenant ID generation in `server/utils/tenantUtils.js`

### 5. Registration Process Updated

The user registration process now includes:
- **Company Field**: Required field for company name
- **Automatic Tenant ID**: Company name is automatically saved as tenant_id
- **Multi-tenant Support**: Each company gets their own isolated data space
- **Admin Role by Default**: All new registrations automatically get admin privileges
- **Admin User Creation**: Admins can create users with specific company assignments

## How It Works

### 1. User Authentication

When a user logs in, their `tenant_id` is stored in the JWT token and used for all subsequent requests.

### 2. Data Filtering

All database queries automatically include a `tenant_id` filter based on the authenticated user's tenant.

### 3. Data Creation

When creating new records, the system automatically assigns the current user's `tenant_id`.

### 4. Data Isolation

Users can only see and modify data that belongs to their tenant. This provides complete data isolation between different organizations.

## Utility Functions

### Tenant ID Generation

The system includes utility functions for consistent tenant ID generation:

```javascript
import { generateTenantId, isValidTenantId } from '../utils/tenantUtils.js';

// Generate tenant ID from company name
const tenantId = generateTenantId("Acme Corporation");
// Result: "a1b2c3d4e5f6g7h8" (16-character hex)

// Validate tenant ID format
const isValid = isValidTenantId("a1b2c3d4e5f6g7h8"); // true
const isInvalid = isValidTenantId("invalid"); // false
```

**Features**:
- **SHA-256 Hashing**: Secure cryptographic hashing algorithm
- **Consistent Output**: Same input always produces same output
- **Fixed Length**: Always generates 16-character hexadecimal strings
- **Case Insensitive**: Company names are normalized before hashing
- **Default Handling**: Empty/null company names get "default" tenant ID

## Migration

To add tenant IDs to existing data:

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Run the migration script:
   ```bash
   node scripts/migrate-tenant-id.js
   ```

This will:
- Add `tenant_id: "default"` to all existing documents
- Create database indexes for the `tenant_id` field
- Ensure backward compatibility

### Manual Tenant Assignment

To assign specific tenant IDs to users:

1. Update the user document in the database:
   ```javascript
   db.users.updateOne(
     { username: "admin" },
     { $set: { tenant_id: "company_a" } }
   )
   ```

2. Update related data:
   ```javascript
   // Update hardware
   db.hardware.updateMany(
     { "system.mac_address": { $in: ["mac1", "mac2"] } },
     { $set: { tenant_id: "company_a" } }
   )
   
   // Update other collections similarly
   ```

## Usage Examples

### 1. Creating a New Tenant

```javascript
// Create a new user with a specific tenant ID
const newUser = new User({
  username: "admin",
  email: "admin@companyb.com",
  password: "password123",
  firstName: "Admin",
  lastName: "User",
  role: "admin",
  company: "Company B" // This will be saved as tenant_id
});
```

### 2. Fetching Tenant-Specific Data

```javascript
// The system automatically filters by tenant_id
const hardware = await Hardware.find({}); // Only returns data for user's tenant
```

### 3. Creating Tenant-Specific Assets

```javascript
// The system automatically assigns the user's tenant_id
const newHardware = new Hardware({
  system: { hostname: "PC001", mac_address: "00:11:22:33:44:55" },
  // tenant_id will be automatically set from req.user.tenant_id
});
```

### 4. User Registration with Company

When users register, they provide their company name which is automatically saved as the tenant_id:

```javascript
// Frontend registration form
const userData = {
  username: "john_doe",
  email: "john@company.com",
  password: "password123",
  firstName: "John",
  lastName: "Doe",
  company: "Acme Corporation", // This becomes the tenant_id
  department: "IT"
};

// Backend automatically hashes company name to create tenant_id and assigns admin role
const user = new User({
  ...userData,
  tenant_id: generateTenantId(userData.company), // Company name hashed to create tenant_id
  role: "admin" // Public registrations get admin privileges
});
```

### 5. Role Assignment Strategy

**Different Role Assignment Based on Context**:

- **Public Registration**: New users get admin role by default and create their own tenant
- **Admin User Creation**: Admins create regular users within their own tenant (inherits admin's tenant_id)
- **Super Admin Control**: Super admins can still assign any role
- **Dashboard Access**: 
  - Public registrations → Admin dashboard (full access)
  - Admin-created users → User dashboard (limited access)
- **System Access**: 
  - Public registrations: Full admin access to their company
  - Admin-created users: Limited user access within company

### 6. Tenant ID Inheritance

**Two Different Scenarios**:

1. **Public Registration** (No authentication):
   ```javascript
   // User provides company name
   const userData = { company: "Acme Corporation" };
   
   // Company becomes tenant_id
   tenant_id: "Acme Corporation"
   ```

2. **Admin Creating User** (Authenticated admin):
   ```javascript
   // Admin creates user (no company field needed)
   const userData = { username: "john", email: "john@acme.com" };
   
   // User inherits admin's tenant_id and gets user role
   tenant_id: admin.tenant_id, // "Acme Corporation"
   role: "user" // Regular user role (not admin)
   ```

## Security Considerations

### 1. Data Isolation

- Users cannot access data from other tenants
- All API endpoints respect tenant boundaries
- Database queries are automatically filtered

### 2. Tenant ID Validation

- The `tenant_id` field is required for all models
- Default value "default" is used for backward compatibility
- Indexes ensure efficient querying

### 3. API Security

- JWT tokens include tenant information
- Middleware validates tenant access
- No cross-tenant data leakage possible

## Configuration

### Environment Variables

Set the default tenant ID in your environment:

```bash
DEFAULT_TENANT_ID=default
```

### Database Indexes

The migration script automatically creates indexes for optimal performance:

```javascript
// Each collection has an index on tenant_id
{ tenant_id: 1 }
```

## Testing

### 1. Test Tenant Isolation

```javascript
// Create users with different tenant IDs
const userA = await User.create({ username: "userA", tenant_id: "tenant_a" });
const userB = await User.create({ username: "userB", tenant_id: "tenant_b" });

// Verify data isolation
const hardwareA = await Hardware.find({ tenant_id: "tenant_a" });
const hardwareB = await Hardware.find({ tenant_id: "tenant_b" });

// These should be completely separate datasets
```

### 2. Test API Endpoints

```bash
# Login as user from tenant A
curl -X POST /auth/login -d '{"username":"userA","password":"pass"}'

# Fetch hardware (should only return tenant A data)
curl -H "Authorization: Bearer <token>" /hardware

# Login as user from tenant B
curl -X POST /auth/login -d '{"username":"userB","password":"pass"}'

# Fetch hardware (should only return tenant B data)
curl -H "Authorization: Bearer <token>" /hardware
```

## Troubleshooting

### Common Issues

1. **Missing tenant_id field**: Run the migration script
2. **Data not showing**: Check if user has tenant_id set
3. **Performance issues**: Ensure tenant_id indexes are created

### Debug Commands

```javascript
// Check tenant distribution
db.hardware.aggregate([
  { $group: { _id: "$tenant_id", count: { $sum: 1 } } }
]);

// Check for documents without tenant_id
db.hardware.find({ tenant_id: { $exists: false } });
```

## Future Enhancements

### 1. Tenant Management

- Admin interface for managing tenants
- Tenant-specific configurations
- Billing and usage tracking

### 2. Advanced Features

- Cross-tenant data sharing (with permissions)
- Tenant-specific themes and branding
- Multi-tenant analytics

### 3. Performance Optimization

- Tenant-specific caching strategies
- Database sharding by tenant
- Connection pooling optimization

## Support

For questions or issues with the tenant ID implementation:

1. Check this documentation
2. Review the migration logs
3. Verify database indexes are created
4. Test with different tenant IDs
5. Check API response headers and data

## Conclusion

The tenant ID implementation provides a robust foundation for multi-tenancy while maintaining backward compatibility. All existing data will continue to work, and new data will be properly isolated by tenant.
