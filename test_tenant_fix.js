// Test script to verify tenant_id fix
import jwt from "jsonwebtoken";

const JWT_SECRET = "your-secret-key-change-in-production";

// Test the old token format (without tenant_id)
const oldToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGIxMmM3MzRiYWU1N2FiNDEyZjIzN2IiLCJpYXQiOjE3NTY0NDcwNTMsImV4cCI6MTc1NzA1MTg1M30.wJX1EZM5vjZl2rI18wMHqX8V-ZigBEX-TQNG7Wqs670";

console.log("=== Testing Tenant ID Fix ===");

try {
  console.log("1. Testing old token format:");
  const oldDecoded = jwt.verify(oldToken, JWT_SECRET);
  console.log("   Old token decoded:", oldDecoded);
  console.log("   Has tenant_id:", !!oldDecoded.tenant_id);
  console.log("   tenant_id value:", oldDecoded.tenant_id);
} catch (error) {
  console.log("   Old token failed:", error.message);
}

// Test the new token format (with tenant_id)
const newTokenData = {
  userId: "68b12c734bae57ab412f237b",
  tenant_id: "test-tenant-123",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  department: "IT",
  role: "admin",
};

const newToken = jwt.sign(newTokenData, JWT_SECRET, { expiresIn: "7d" });

console.log("\n2. Testing new token format:");
console.log("   New token data:", newTokenData);
console.log("   New token:", newToken.substring(0, 50) + "...");

try {
  const newDecoded = jwt.verify(newToken, JWT_SECRET);
  console.log("   New token decoded:", newDecoded);
  console.log("   Has tenant_id:", !!newDecoded.tenant_id);
  console.log("   tenant_id value:", newDecoded.tenant_id);
} catch (error) {
  console.log("   New token failed:", error.message);
}

console.log("\n=== Test Complete ===");
console.log("To fix the tenant_id issue:");
console.log("1. Log out and log back in to get a new token with tenant_id");
console.log("2. The scanner download should now use the correct tenant_id");
console.log("3. Check the backend logs to see the tenant_id being used");
