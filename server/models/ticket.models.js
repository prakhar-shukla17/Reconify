import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    // Tenant ID for multi-tenancy
    tenant_id: { type: String, required: true, index: true },
    
    ticket_id: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed", "Rejected"],
      default: "Open",
    },
    category: {
      type: String,
      enum: [
        "Hardware Issue",
        "Software Issue",
        "Network Issue",
        "Performance Issue",
        "Maintenance Request",
        "Access Request",
        "Other",
      ],
      required: true,
    },
    // User who created the ticket
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    created_by_name: {
      type: String,
      required: true,
    },
    created_by_email: {
      type: String,
      required: true,
    },
    // Asset related to the ticket
    asset_id: {
      type: String, // MAC address
      ref: "Hardware",
      required: true,
    },
    asset_hostname: {
      type: String,
      default: "Unknown",
    },
    asset_model: {
      type: String,
      default: "Unknown",
    },
    // Admin assignment
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assigned_to_name: {
      type: String,
      default: null,
    },
    // Resolution details
    resolution: {
      type: String,
      default: null,
      maxlength: 2000,
    },
    resolved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolved_by_name: {
      type: String,
      default: null,
    },
    resolved_at: {
      type: Date,
      default: null,
    },
    // Timestamps
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    // Comments/Updates
    comments: [
      {
        comment_id: {
          type: String,
          required: true,
        },
        comment: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        commented_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        commented_by_name: {
          type: String,
          required: true,
        },
        commented_at: {
          type: Date,
          default: Date.now,
        },
        is_internal: {
          type: Boolean,
          default: false, // Internal comments only visible to admins
        },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Generate unique ticket ID
TicketSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.ticket_id = `TKT-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Virtual for ticket age
TicketSchema.virtual("age_in_days").get(function () {
  const now = new Date();
  const created = new Date(this.created_at);
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Static methods
TicketSchema.statics.getTicketStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const priorityStats = await this.aggregate([
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  const categoryStats = await this.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    statusStats: stats,
    priorityStats: priorityStats,
    categoryStats: categoryStats,
  };
};

// Instance methods
TicketSchema.methods.addComment = function (commentData) {
  const commentId = `CMT-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  this.comments.push({
    comment_id: commentId,
    ...commentData,
  });
  this.updated_at = new Date();
  return this.save();
};

TicketSchema.methods.updateStatus = function (newStatus, updatedBy) {
  this.status = newStatus;
  this.updated_at = new Date();

  if (newStatus === "Resolved" || newStatus === "Closed") {
    this.resolved_at = new Date();
    this.resolved_by = updatedBy._id;
    this.resolved_by_name = updatedBy.username;
  }

  return this.save();
};

// Indexes
TicketSchema.index({ ticket_id: 1 });
TicketSchema.index({ created_by: 1 });
TicketSchema.index({ asset_id: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ created_at: -1 });

const Ticket = mongoose.model("Ticket", TicketSchema);

export default Ticket;
