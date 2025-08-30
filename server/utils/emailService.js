import nodemailer from 'nodemailer';
import { configDotenv } from 'dotenv';

// Load environment variables
configDotenv();

// Create transporter with connection pooling for better performance
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true, // Use pooled connections
    maxConnections: 5, // Maximum number of connections to pool
    maxMessages: 100, // Maximum number of messages per connection
    rateLimit: 14, // Max 14 emails per second
  });
};

// Retry function for email sending
const retryEmail = async (emailFunction, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await emailFunction();
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// Send user credentials email
export const sendUserCredentials = async (userData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ITAM System" <${process.env.SMTP_USER}>`,
      to: userData.email,
      subject: 'Your ITAM Account Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to ITAM System</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account has been created successfully</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">Account Details</h2>
            <p><strong>Full Name:</strong> ${userData.firstName} ${userData.lastName}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Department:</strong> ${userData.department || 'Not specified'}</p>
            <p><strong>Role:</strong> ${userData.role}</p>
          </div>
          
          <div style="padding: 20px; background: #fff; border-top: 1px solid #e0e0e0;">
            <h3 style="color: #333; margin-top: 0;">Login Information</h3>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Password:</strong> ${userData.plainPassword}</p>
            <p><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL}/login" style="color: #667eea;">${process.env.FRONTEND_URL}/login</a></p>
          </div>
          
          <div style="padding: 20px; background: #f0f8ff; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
            <h3 style="color: #333; margin-top: 0;">Important Notes</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Please change your password after your first login for security</li>
              <li>Keep your credentials secure and don't share them with others</li>
              <li>Contact your system administrator if you have any questions</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message from the ITAM System. Please do not reply to this email.</p>
          </div>
        </div>
      `,
      text: `
Welcome to ITAM System

Your account has been created successfully.

Account Details:
- Full Name: ${userData.firstName} ${userData.lastName}
- Email: ${userData.email}
- Department: ${userData.department || 'Not specified'}
- Role: ${userData.role}

Login Information:
- Email: ${userData.email}
- Password: ${userData.plainPassword}
- Login URL: ${process.env.FRONTEND_URL}/login

Important Notes:
- Please change your password after your first login for security
- Keep your credentials secure and don't share them with others
- Contact your system administrator if you have any questions

This is an automated message from the ITAM System. Please do not reply to this email.
      `
    };

    // Use retry logic for better reliability
    const info = await retryEmail(async () => {
      return await transporter.sendMail(mailOptions);
    });
    
    console.log('User credentials email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending user credentials email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('Email configuration error:', error);
    return { success: false, error: error.message };
  }
};

// Send custom email to users
export const sendCustomEmail = async (emailData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ITAM System" <${process.env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">ITAM System Message</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Important information from your administrator</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">Hello ${emailData.userName},</h2>
          </div>
          
          <div style="padding: 20px; background: #fff; border-top: 1px solid #e0e0e0;">
            <h3 style="color: #333; margin-top: 0;">Message Details</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
              ${emailData.message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="padding: 20px; background: #f0f8ff; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
            <h3 style="color: #333; margin-top: 0;">Next Steps</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Review the message above carefully</li>
              <li>Take any required actions mentioned</li>
              <li>Contact your administrator if you have questions</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message from the ITAM System. Please do not reply to this email.</p>
            <p>To access your account, visit: <a href="${process.env.FRONTEND_URL}/login" style="color: #667eea;">${process.env.FRONTEND_URL}/login</a></p>
          </div>
        </div>
      `,
      text: `
ITAM System Message

Hello ${emailData.userName},

Message Details:
${emailData.message}

Next Steps:
- Review the message above carefully
- Take any required actions mentioned
- Contact your administrator if you have questions

This is an automated message from the ITAM System. Please do not reply to this email.
To access your account, visit: ${process.env.FRONTEND_URL}/login
      `
    };

    // Use retry logic for better reliability
    const info = await retryEmail(async () => {
      return await transporter.sendMail(mailOptions);
    });
    
    console.log('Custom email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending custom email:', error);
    return { success: false, error: error.message };
  }
};
