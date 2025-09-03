import mongoose from "mongoose";
import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import { configDotenv } from "dotenv";

configDotenv();

const testLogin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Test credentials
    const testUsername = "superadmin@itam.com";
    const testPassword = "SuperAdmin123!";

    console.log(`Testing login with: ${testUsername}`);

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: testUsername }, { email: testUsername }],
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("✅ User found:");
    console.log("Username:", user.username);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("Is Active:", user.isActive);

    if (!user.isActive) {
      console.log("❌ User account is deactivated");
      return;
    }

    // Test password comparison
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    console.log("Password valid:", isPasswordValid);

    if (isPasswordValid) {
      console.log("✅ Login should work!");
    } else {
      console.log("❌ Password is incorrect");
      
      // Let's see what the actual password hash looks like
      console.log("Stored password hash:", user.password.substring(0, 20) + "...");
      
      // Test with the exact password from the creation script
      const exactPassword = "SuperAdmin123!";
      const exactPasswordValid = await bcrypt.compare(exactPassword, user.password);
      console.log("Exact password valid:", exactPasswordValid);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error testing login:", error);
    process.exit(1);
  }
};

testLogin();










