import { configDotenv } from 'dotenv';
import { testEmailConfig, sendUserCredentials } from './utils/emailService.js';

// Load environment variables
configDotenv();

async function testEmailService() {
  console.log('Testing email service configuration...\n');
  
  // Test 1: Verify SMTP configuration
  console.log('1. Testing SMTP configuration...');
  const configResult = await testEmailConfig();
  if (configResult.success) {
    console.log('✅ SMTP configuration is valid');
  } else {
    console.log('❌ SMTP configuration failed:', configResult.error);
    return;
  }
  
  // Test 2: Test sending a sample email
  console.log('\n2. Testing email sending...');
  const testUserData = {
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    email: process.env.SMTP_USER, // Send to yourself for testing
    department: 'IT',
    role: 'user',
    plainPassword: 'testpass123'
  };
  
  try {
    const emailResult = await sendUserCredentials(testUserData);
    if (emailResult.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', emailResult.messageId);
      console.log('Check your inbox for the test email.');
    } else {
      console.log('❌ Failed to send test email:', emailResult.error);
    }
  } catch (error) {
    console.log('❌ Error sending test email:', error.message);
  }
}

// Run the test
testEmailService().catch(console.error);
