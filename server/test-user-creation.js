import mongoose from 'mongoose';
import User from './models/user.models.js';
import bcrypt from 'bcryptjs';

async function testUserCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/itam');
    console.log('Connected to MongoDB');

    // Create a test user
    const testUser = new User({
      email: 'testuser@example.com',
      password: 'test123',
      firstName: 'Test',
      lastName: 'User',
      department: 'IT',
      role: 'user',
      tenant_id: 'test-tenant',
      isActive: true
    });

    console.log('Creating test user...');
    await testUser.save();
    console.log('Test user created successfully:', {
      id: testUser._id,
      email: testUser.email,
      tenant_id: testUser.tenant_id,
      isActive: testUser.isActive
    });

    // Test login process
    console.log('\nTesting login process...');
    const foundUser = await User.findOne({ email: 'testuser@example.com' });
    
    if (foundUser) {
      console.log('User found:', {
        id: foundUser._id,
        email: foundUser.email,
        tenant_id: foundUser.tenant_id,
        isActive: foundUser.isActive
      });

      // Test password comparison
      const isPasswordValid = await foundUser.comparePassword('test123');
      console.log('Password validation result:', isPasswordValid);

      if (isPasswordValid) {
        console.log('✅ Login should work for this user');
      } else {
        console.log('❌ Password validation failed');
      }
    } else {
      console.log('❌ User not found during login');
    }

    // Clean up - delete the test user
    await User.deleteOne({ email: 'testuser@example.com' });
    console.log('\nTest user cleaned up');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Test error:', error);
    await mongoose.disconnect();
  }
}

testUserCreation();

