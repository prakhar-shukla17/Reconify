import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.models.js";
import { configDotenv } from "dotenv";

configDotenv();

const debugPassword = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Test password
    const testPassword = "SuperAdmin123!";
    console.log("Testing password:", testPassword);

    // Create a fresh hash
    const salt = await bcrypt.genSalt(10);
    const freshHash = await bcrypt.hash(testPassword, salt);
    console.log("Fresh hash created:", freshHash.substring(0, 30) + "...");

    // Test fresh hash
    const freshHashValid = await bcrypt.compare(testPassword, freshHash);
    console.log("Fresh hash validation:", freshHashValid ? "✅ PASSED" : "❌ FAILED");

    // Get the stored user
    const user = await User.findOne({ role: "superadmin" });
    if (!user) {
      console.log("❌ No super admin user found");
      return;
    }

    console.log("\nStored user details:");
    console.log("Username:", user.username);
    console.log("Email:", user.email);
    console.log("Stored hash:", user.password.substring(0, 30) + "...");

    // Test stored hash
    const storedHashValid = await bcrypt.compare(testPassword, user.password);
    console.log("Stored hash validation:", storedHashValid ? "✅ PASSED" : "❌ FAILED");

    // Test with different variations
    console.log("\nTesting different password variations:");
    const variations = [
      "SuperAdmin123!",
      "SuperAdmin123",
      "superadmin123!",
      "SUPERADMIN123!",
      "SuperAdmin123! ",
      " SuperAdmin123!"
    ];

    for (const variation of variations) {
      const isValid = await bcrypt.compare(variation, user.password);
      console.log(`"${variation}" -> ${isValid ? "✅" : "❌"}`);
    }

    // Check if there are any hidden characters
    console.log("\nPassword length analysis:");
    console.log("Test password length:", testPassword.length);
    console.log("Test password bytes:", Buffer.from(testPassword, 'utf8').length);
    console.log("Test password hex:", Buffer.from(testPassword, 'utf8').toString('hex'));

    process.exit(0);
  } catch (error) {
    console.error("Error debugging password:", error);
    process.exit(1);
  }
};

debugPassword();



