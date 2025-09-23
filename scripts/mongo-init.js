// MongoDB initialization script
db = db.getSiblingDB('itam');

// Create collections
db.createCollection('users');
db.createCollection('subscriptions');
db.createCollection('subscriptionplans');
db.createCollection('payments');
db.createCollection('hardware');
db.createCollection('software');
db.createCollection('telemetry');
db.createCollection('tickets');

// Create indexes for better performance
db.users.createIndex({ "email": 1, "tenant_id": 1 }, { unique: true });
db.users.createIndex({ "tenant_id": 1 });
db.users.createIndex({ "role": 1 });

db.subscriptions.createIndex({ "tenant_id": 1, "status": 1 });
db.subscriptions.createIndex({ "user_id": 1 });
db.subscriptions.createIndex({ "gateway_subscription_id": 1 });

db.subscriptionplans.createIndex({ "plan_id": 1 }, { unique: true });
db.subscriptionplans.createIndex({ "plan_type": 1, "is_active": 1 });

db.payments.createIndex({ "tenant_id": 1, "status": 1 });
db.payments.createIndex({ "subscription_id": 1 });
db.payments.createIndex({ "user_id": 1 });
db.payments.createIndex({ "gateway_payment_id": 1 });
db.payments.createIndex({ "created_at": -1 });

db.hardware.createIndex({ "tenant_id": 1 });
db.hardware.createIndex({ "mac_address": 1 }, { unique: true });

db.software.createIndex({ "tenant_id": 1 });
db.software.createIndex({ "name": 1, "version": 1 });

db.telemetry.createIndex({ "tenant_id": 1, "timestamp": -1 });
db.telemetry.createIndex({ "hardware_id": 1, "timestamp": -1 });

db.tickets.createIndex({ "tenant_id": 1, "status": 1 });
db.tickets.createIndex({ "user_id": 1 });

// Create a super admin user (optional - can be done through API)
// db.users.insertOne({
//   email: "admin@itam.com",
//   password: "$2a$10$example_hash_here", // This should be properly hashed
//   firstName: "Super",
//   lastName: "Admin",
//   role: "superadmin",
//   tenant_id: "superadmin_tenant",
//   isActive: true,
//   createdAt: new Date(),
//   updatedAt: new Date()
// });

print("Database initialization completed successfully!");

