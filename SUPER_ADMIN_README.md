# Super Admin System for IT Asset Management

## Overview

The Super Admin system provides the highest level of administrative control over the IT Asset Management application. Super admins have complete control over user management, system configuration, and administrative operations.

## Features

### 🔐 Role-Based Access Control
- **Super Admin**: Full system access and control
- **Admin**: Limited administrative access
- **User**: Basic user access to assigned assets

### 👥 User Management
- Create, edit, and delete user accounts
- Promote/demote users between roles
- Activate/deactivate user accounts
- Reset user passwords
- Bulk user operations

### 📊 System Statistics
- User count and role distribution
- Department statistics
- System health metrics
- Recent user activity

### 🛡️ Security Features
- JWT-based authentication
- Role-based middleware protection
- Password hashing with bcrypt
- Protected API endpoints

## Setup Instructions

### 1. Create Super Admin Account

Run the following command from the server directory:

```bash
npm run create-superadmin
```

This will create a super admin account with the following credentials:
- **Username**: `superadmin`
- **Password**: `SuperAdmin123!`
- **Email**: `superadmin@itam.com`

**⚠️ IMPORTANT**: Change the password after first login!

### 2. Access Super Admin Dashboard

Navigate to `/superadmin` in your application to access the Super Admin Dashboard.

## API Endpoints

### Super Admin Routes (`/api/superadmin`)

All endpoints require super admin authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-superadmin` | Create new super admin account |
| PATCH | `/promote/:userId` | Promote user to admin |
| PATCH | `/demote/:userId` | Demote admin to user |
| PATCH | `/deactivate/:userId` | Deactivate user account |
| PATCH | `/reactivate/:userId` | Reactivate user account |
| POST | `/reset-password` | Reset user password |
| GET | `/statistics` | Get system statistics |
| POST | `/bulk-operations` | Perform bulk user operations |

### Authentication Required

All super admin endpoints require:
- Valid JWT token in Authorization header
- User must have `superadmin` role

## User Roles and Permissions

### Super Admin
- ✅ Create super admin accounts
- ✅ Create admin accounts
- ✅ Create regular user accounts
- ✅ Promote/demote users
- ✅ Activate/deactivate users
- ✅ Reset user passwords
- ✅ Access all system data
- ✅ View system statistics
- ✅ Perform bulk operations

### Admin
- ✅ Create regular user accounts
- ✅ Manage asset assignments
- ✅ Access admin dashboard
- ❌ Cannot create admin accounts
- ❌ Cannot modify super admin accounts

### User
- ✅ Access assigned assets
- ✅ View personal profile
- ❌ Cannot access admin features
- ❌ Cannot modify other users

## Frontend Components

### SuperAdminDashboard
The main super admin interface located at `client/src/components/SuperAdminDashboard.js`

Features:
- User management table
- System statistics cards
- Create user modal
- Password reset modal
- Role management actions
- Bulk operations support

### Super Admin Page
Accessible at `/superadmin` route in the application.

## Security Considerations

### Middleware Protection
- `verifyToken`: Validates JWT authentication
- `requireSuperAdmin`: Ensures super admin role
- `requireAdmin`: Allows both admin and super admin access

### Data Validation
- Input sanitization for all user inputs
- Role validation before operations
- Protection against self-modification of super admin accounts

### Password Security
- Bcrypt hashing with salt rounds
- Minimum password length requirements
- Secure password reset functionality

## Database Schema

### User Model Updates
```javascript
role: {
  type: String,
  enum: ["user", "admin", "superadmin"],
  default: "user",
}
```

### New Fields
- `isActive`: Boolean flag for account status
- Enhanced role validation
- Timestamp tracking

## Usage Examples

### Creating a New Admin
```javascript
// Super admin can create admin accounts
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'newadmin',
    email: 'admin@company.com',
    password: 'SecurePass123!',
    firstName: 'New',
    lastName: 'Admin',
    department: 'IT',
    role: 'admin'
  })
});
```

### Promoting a User to Admin
```javascript
const response = await fetch(`/api/superadmin/promote/${userId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Bulk User Operations
```javascript
const operations = [
  { action: 'promote', userId: 'user1', data: {} },
  { action: 'deactivate', userId: 'user2', data: {} },
  { action: 'updateDepartment', userId: 'user3', data: { department: 'HR' } }
];

const response = await fetch('/api/superadmin/bulk-operations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ operations })
});
```

## Troubleshooting

### Common Issues

1. **"Access denied. Super Admin privileges required"**
   - Ensure user has `superadmin` role
   - Check JWT token validity
   - Verify middleware configuration

2. **"Cannot modify super admin account"**
   - Super admin accounts are protected from modification
   - Only reactivation is allowed for deactivated super admin accounts

3. **"User not found"**
   - Verify user ID exists in database
   - Check MongoDB connection
   - Ensure proper user model import

### Debug Mode
Enable detailed logging by checking console output for middleware execution details.

## Best Practices

1. **Password Security**
   - Use strong, unique passwords
   - Change default passwords immediately
   - Implement password policies

2. **Role Management**
   - Limit super admin accounts to essential personnel
   - Regular review of admin privileges
   - Document role assignments

3. **Monitoring**
   - Regular review of system statistics
   - Monitor user activity patterns
   - Track administrative actions

4. **Backup and Recovery**
   - Regular database backups
   - Document super admin credentials securely
   - Plan for account recovery scenarios

## Support

For technical support or questions about the Super Admin system, refer to:
- System documentation
- API documentation
- Development team
- System logs and error messages

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: IT Development Team




