# Email Configuration for ITAM System

This document explains how to configure email functionality for sending user credentials when admins create new users.

## Overview

The ITAM system now includes automatic email functionality that sends user credentials to newly created users. When an admin creates a user account, the system will automatically send an email containing:

- Welcome message
- Account details (name, username, email, department, role)
- Login credentials (username and password)
- Login URL
- Security reminders

## Environment Variables

Update your `.env` file in the `server` directory with the following email configuration:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3001

# Email sender name (optional)
EMAIL_SENDER_NAME=ITAM System
```

## SMTP Configuration Examples

### Gmail (Recommended for testing)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Use the app password** (not your regular Gmail password)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-digit-app-password
```

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Custom SMTP Server

```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Testing Email Configuration

After configuring your email settings, you can test the configuration:

1. **Start the server**: `npm run dev`
2. **Login as an admin** user
3. **Test email config**: Make a GET request to `/api/auth/test-email`
   - This endpoint requires admin authentication
   - It will verify your SMTP configuration

## How It Works

### User Creation Flow

1. **Admin creates user** through the admin panel or API
2. **System stores plain password** temporarily (before hashing)
3. **User account is created** in the database
4. **Email is sent automatically** with credentials
5. **Plain password is discarded** from memory

### Email Content

The email includes:
- Professional HTML and plain text versions
- Company branding and styling
- Complete account information
- Login credentials
- Security reminders
- Direct login link

## Security Features

- **Passwords are never stored in plain text** in the database
- **Plain passwords are only used temporarily** for email sending
- **Email sending failures don't prevent user creation**
- **Admin authentication required** for user creation
- **Role-based permissions** enforced

## Troubleshooting

### Common Issues

**"Authentication failed" error:**
- Check your email and password
- For Gmail, ensure you're using an App Password
- Verify 2FA is enabled (for Gmail)

**"Connection timeout" error:**
- Check your SMTP host and port
- Verify firewall settings
- Test with a different SMTP provider

**"Email not received":**
- Check spam/junk folders
- Verify recipient email address
- Check SMTP server logs

### Testing Steps

1. Verify environment variables are loaded
2. Test SMTP connection manually
3. Check server logs for email errors
4. Verify email configuration with test endpoint

## Production Considerations

- **Use environment-specific SMTP servers** for production
- **Implement email queuing** for high-volume systems
- **Add email templates** for different user types
- **Monitor email delivery rates**
- **Implement retry logic** for failed emails
- **Add email logging** for audit purposes

## API Endpoints

### Create User (Admin Only)
```
POST /api/auth/create-user
Authorization: Bearer <admin-token>
```

### Test Email Configuration (Admin Only)
```
GET /api/auth/test-email
Authorization: Bearer <admin-token>
```

## Support

If you encounter issues with email configuration:

1. Check the server logs for detailed error messages
2. Verify your SMTP settings with your email provider
3. Test with a different email service
4. Ensure all environment variables are properly set
5. Check network connectivity and firewall settings
