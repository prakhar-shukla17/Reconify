import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.models.js";
import { configDotenv } from "dotenv";

configDotenv();

const fixSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Delete existing super admin
    const deleteResult = await User.deleteMany({ role: "superadmin" });
    console.log(`Deleted ${deleteResult.deletedCount} existing super admin accounts`);

    // Create new super admin credentials
    const superAdminData = {
      username: "superadmin",
      email: "superadmin@itam.com",
      firstName: "Super",
      lastName: "Administrator",
      department: "IT Management",
      role: "superadmin"
    };

    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("SuperAdmin123!", salt);
    console.log("Password hashed manually:", hashedPassword.substring(0, 30) + "...");

    // Create super admin user using updateOne to bypass middleware
    const result = await User.updateOne(
      { username: "superadmin" },
      { 
        ...superAdminData,
        password: hashedPassword
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    console.log("✅ Super admin account created successfully!");
    console.log("Username:", superAdminData.username);
    console.log("Password:", "SuperAdmin123!");
    console.log("Email:", superAdminData.email);

    // Verify the password works
    const testUser = await User.findOne({ role: "superadmin" });
    if (testUser) {
      const isPasswordValid = await bcrypt.compare("SuperAdmin123!", testUser.password);
      console.log("Password verification test:", isPasswordValid ? "✅ PASSED" : "❌ FAILED");
      
      // Also test the comparePassword method
      const methodPasswordValid = await testUser.comparePassword("SuperAdmin123!");
      console.log("Method password test:", methodPasswordValid ? "✅ PASSED" : "❌ FAILED");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error fixing super admin:", error);
    process.exit(1);
  }
};

fixSuperAdmin();










