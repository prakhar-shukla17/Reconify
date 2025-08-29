import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.models.js";
import { configDotenv } from "dotenv";

configDotenv();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: "superadmin" });
    if (existingSuperAdmin) {
      console.log("Super admin already exists:", existingSuperAdmin.username);
      process.exit(0);
    }

    // Create super admin credentials
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

    console.log("Super admin account created successfully!");
    console.log("Username:", superAdminData.username);
    console.log("Password:", "SuperAdmin123!");
    console.log("Email:", superAdminData.email);
    console.log("\nIMPORTANT: Change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("Error creating super admin:", error);
    process.exit(1);
  }
};

createSuperAdmin();
 


