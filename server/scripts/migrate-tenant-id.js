import mongoose from "mongoose";
import Hardware from "../models/hardware.models.js";
import Software from "../models/software.models.js";
import User from "../models/user.models.js";
import Ticket from "../models/ticket.models.js";
import Telemetry from "../models/telemetry.models.js";
import SoftwarePatch from "../models/softwarePatch.models.js";
import { generateTenantId } from "../utils/tenantUtils.js";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/itam");
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Migration function to add tenant_id to all existing documents
const migrateTenantId = async () => {
  try {
    console.log("Starting tenant ID migration...");

    // Default tenant ID for existing data
    const defaultTenantId = generateTenantId("default");

    // Update Hardware collection
    const hardwareResult = await Hardware.updateMany(
      { tenant_id: { $exists: false } },
      { $set: { tenant_id: defaultTenantId } }
    );
    console.log(`Updated ${hardwareResult.modifiedCount} hardware documents`);

    // Update Software collection
    const softwareResult = await Software.updateMany(
      { tenant_id: { $exists: false } },
      { $set: { tenant_id: defaultTenantId } }
    );
    console.log(`Updated ${softwareResult.modifiedCount} software documents`);

    // Update User collection
    const userResult = await User.updateMany(
      { tenant_id: { $exists: false } },
      { $set: { tenant_id: defaultTenantId } }
    );
    console.log(`Updated ${userResult.modifiedCount} user documents`);

    // Update Ticket collection
    const ticketResult = await Ticket.updateMany(
      { tenant_id: { $exists: false } },
      { $set: { tenant_id: defaultTenantId } }
    );
    console.log(`Updated ${ticketResult.modifiedCount} ticket documents`);

    // Update Telemetry collection
    const telemetryResult = await Telemetry.updateMany(
      { tenant_id: { $exists: false } },
      { $set: { tenant_id: defaultTenantId } }
    );
    console.log(`Updated ${telemetryResult.modifiedCount} telemetry documents`);

    // Update SoftwarePatch collection
    const softwarePatchResult = await SoftwarePatch.updateMany(
      { tenant_id: { $exists: false } },
      { $set: { tenant_id: defaultTenantId } }
    );
    console.log(`Updated ${softwarePatchResult.modifiedCount} software patch documents`);

    console.log("Tenant ID migration completed successfully!");
    
    // Create indexes for tenant_id field
    console.log("Creating indexes for tenant_id...");
    
    await Hardware.collection.createIndex({ tenant_id: 1 });
    await Software.collection.createIndex({ tenant_id: 1 });
    await User.collection.createIndex({ tenant_id: 1 });
    await Ticket.collection.createIndex({ tenant_id: 1 });
    await Telemetry.collection.createIndex({ tenant_id: 1 });
    await SoftwarePatch.collection.createIndex({ tenant_id: 1 });
    
    console.log("Indexes created successfully!");

  } catch (error) {
    console.error("Migration error:", error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateTenantId();
  process.exit(0);
};

runMigration();
