import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    // Tenant ID for multi-tenancy
    tenant_id: { type: String, required: true, index: true },
    

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    assignedAssets: [
      {
        type: String, // MAC addresses of assigned hardware
        ref: "Hardware",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Subscription and billing information
    subscription_status: {
      type: String,
      enum: ["free", "trial", "active", "past_due", "cancelled"],
      default: "free"
    },
    current_subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription"
    },
    
    // Billing information
    billing_address: {
      street: String,
      city: String,
      state: String,
      postal_code: String,
      country: String
    },
    
    // Payment preferences
    payment_preferences: {
      preferred_gateway: {
        type: String,
        enum: ["stripe", "paypal", "razorpay"],
        default: "stripe"
      },
      auto_renew: { type: Boolean, default: true },
      billing_email: String
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Create indexes
UserSchema.index({ email: 1, tenant_id: 1 }, { unique: true }); // Email unique within tenant
UserSchema.index({ role: 1 });

const User = mongoose.model("User", UserSchema);

export default User;
