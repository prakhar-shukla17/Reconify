import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.models.js";
import { configDotenv } from "dotenv";

configDotenv();

const recreateSuperAdmin = async () => {
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
      password: "SuperAdmin123!",
      firstName: "Super",
      lastName: "Administrator",
      department: "IT Management",
      role: "superadmin"
    };

    // Hash password
    const salt = await bcrypt.genSalt(10);
    superAdminData.password = await bcrypt.hash(superAdminData.password, salt);

    // Create super admin user
    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log("✅ Super admin account recreated successfully!");
    console.log("Username:", superAdminData.username);
    console.log("Password:", "SuperAdmin123!");
    console.log("Email:", superAdminData.email);
    console.log("\nIMPORTANT: Change the password after first login!");

    // Verify the password works
    const testUser = await User.findOne({ role: "superadmin" });
    const isPasswordValid = await bcrypt.compare("SuperAdmin123!", testUser.password);
    console.log("Password verification test:", isPasswordValid ? "✅ PASSED" : "❌ FAILED");

    process.exit(0);
  } catch (error) {
    console.error("Error recreating super admin:", error);
    process.exit(1);
  }
};

recreateSuperAdmin();
























