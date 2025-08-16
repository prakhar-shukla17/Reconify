import mongoose from "mongoose";
import User from "../models/user.models.js";

// MongoDB connection URI
const mongoUri =
  "mongodb+srv://202111077:202111077@cluster0.rwwnyps.mongodb.net/";

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: "admin",
      email: "admin@itam.com",
      password: "admin123",
      firstName: "System",
      lastName: "Administrator",
      department: "IT",
      role: "admin",
    });

    await adminUser.save();
    console.log("Admin user created successfully!");
    console.log("Email: admin@itam.com");
    console.log("Password: admin123");
    console.log("Please change the password after first login.");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

createAdminUser();
