import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    // Tenant ID for multi-tenancy
    tenant_id: { type: String, required: true, index: true },
    
    // Associated subscription
    subscription_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Subscription", 
      required: true 
    },
    
    // User who made the payment
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    // Payment details
    amount: { type: Number, required: true }, // Amount in cents
    currency: { type: String, default: "USD" },
    
    // Payment gateway information
    payment_gateway: { 
      type: String, 
      enum: ["stripe", "paypal", "razorpay"], 
      required: true 
    },
    gateway_payment_id: { type: String }, // External payment ID
    gateway_transaction_id: { type: String }, // External transaction ID
    
    // Payment status
    status: { 
      type: String, 
      enum: ["pending", "processing", "completed", "failed", "cancelled", "refunded"], 
      default: "pending" 
    },
    
    // Payment method details (stored securely)
    payment_method: {
      type: { 
        type: String, 
        enum: ["card", "paypal", "bank_transfer", "upi", "wallet"] 
      },
      last4: String, // Last 4 digits of card
      brand: String, // Card brand (visa, mastercard, etc.)
      exp_month: Number,
      exp_year: Number
    },
    
    // Billing information
    billing_period_start: { type: Date },
    billing_period_end: { type: Date },
    
    // Payment description
    description: { type: String },
    
    // Receipt information
    receipt_url: { type: String },
    receipt_number: { type: String },
    
    // Refund information
    refunded_amount: { type: Number, default: 0 },
    refund_reason: { type: String },
    refunded_at: { type: Date },
    
    // Failure information
    failure_reason: { type: String },
    failure_code: { type: String },
    
    // Webhook data
    webhook_data: { type: mongoose.Schema.Types.Mixed },
    
    // Additional metadata
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PaymentSchema.index({ tenant_id: 1, status: 1 });
PaymentSchema.index({ subscription_id: 1 });
PaymentSchema.index({ user_id: 1 });
PaymentSchema.index({ gateway_payment_id: 1 });
PaymentSchema.index({ created_at: -1 });

// Virtual for payment amount in dollars
PaymentSchema.virtual("amountInDollars").get(function() {
  return (this.amount / 100).toFixed(2);
});

// Virtual for checking if payment is successful
PaymentSchema.virtual("isSuccessful").get(function() {
  return this.status === "completed";
});

// Virtual for checking if payment is refunded
PaymentSchema.virtual("isRefunded").get(function() {
  return this.status === "refunded" || this.refunded_amount > 0;
});

// Method to process refund
PaymentSchema.methods.processRefund = async function(amount, reason) {
  if (this.status !== "completed") {
    throw new Error("Can only refund completed payments");
  }
  
  if (this.refunded_amount + amount > this.amount) {
    throw new Error("Refund amount exceeds payment amount");
  }
  
  this.refunded_amount += amount;
  this.refund_reason = reason;
  this.refunded_at = new Date();
  
  if (this.refunded_amount >= this.amount) {
    this.status = "refunded";
  }
  
  return this.save();
};

// Static method to get payment statistics
PaymentSchema.statics.getPaymentStats = async function(tenant_id, startDate, endDate) {
  const matchStage = {
    tenant_id,
    status: "completed"
  };
  
  if (startDate && endDate) {
    matchStage.created_at = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        averageAmount: { $avg: "$amount" },
        successfulPayments: { $sum: 1 }
      }
    }
  ]);
  
  const failedPayments = await this.countDocuments({
    ...matchStage,
    status: "failed"
  });
  
  return {
    totalPayments: stats[0]?.totalPayments || 0,
    totalAmount: stats[0]?.totalAmount || 0,
    averageAmount: stats[0]?.averageAmount || 0,
    successfulPayments: stats[0]?.successfulPayments || 0,
    failedPayments,
    successRate: stats[0]?.totalPayments ? 
      (stats[0].successfulPayments / stats[0].totalPayments * 100).toFixed(2) : 0
  };
};

export default mongoose.model("Payment", PaymentSchema);


