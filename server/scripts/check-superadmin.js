import mongoose from "mongoose";
import User from "../models/user.models.js";
import { configDotenv } from "dotenv";

configDotenv();

const checkSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if super admin exists
    const superAdmin = await User.findOne({ role: "superadmin" });
    
    if (superAdmin) {
      console.log("✅ Super admin account found:");
      console.log("Username:", superAdmin.username);
      console.log("Email:", superAdmin.email);
      console.log("Role:", superAdmin.role);
      console.log("Is Active:", superAdmin.isActive);
      console.log("Created:", superAdmin.createdAt);
    } else {
      console.log("❌ No super admin account found");
      
      // Check all users
      const allUsers = await User.find({}, "username email role isActive");
      console.log("\nAll users in database:");
      allUsers.forEach(user => {
        console.log(`- ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error checking super admin:", error);
    process.exit(1);
  }
};

checkSuperAdmin();















