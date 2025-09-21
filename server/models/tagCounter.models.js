import mongoose from "mongoose";

// Tag Counter Schema to track sequential Tag IDs per tenant
const TagCounterSchema = new mongoose.Schema(
  {
    tenant_id: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    current_count: { 
      type: Number, 
      default: 0 
    },
    prefix: { 
      type: String, 
      default: "TAG" 
    },
    last_updated: { 
      type: Date, 
      default: Date.now 
    }
  },
  {
    timestamps: true,
  }
);

// Static method to get next Tag ID for a tenant
TagCounterSchema.statics.getNextTagId = async function(tenantId) {
  try {
    // Use findOneAndUpdate with upsert to atomically increment the counter
    const result = await this.findOneAndUpdate(
      { tenant_id: tenantId },
      { 
        $inc: { current_count: 1 },
        $set: { last_updated: new Date() }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Format the Tag ID with leading zeros (4 digits)
    const formattedCount = result.current_count.toString().padStart(4, '0');
    return `${result.prefix}-${formattedCount}`;
  } catch (error) {
    console.error("Error generating next Tag ID:", error);
    throw error;
  }
};

// Static method to get current count for a tenant
TagCounterSchema.statics.getCurrentCount = async function(tenantId) {
  try {
    const counter = await this.findOne({ tenant_id: tenantId });
    return counter ? counter.current_count : 0;
  } catch (error) {
    console.error("Error getting current count:", error);
    return 0;
  }
};

// Static method to reset counter for a tenant (admin function)
TagCounterSchema.statics.resetCounter = async function(tenantId) {
  try {
    const result = await this.findOneAndUpdate(
      { tenant_id: tenantId },
      { 
        current_count: 0,
        last_updated: new Date()
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    return result;
  } catch (error) {
    console.error("Error resetting counter:", error);
    throw error;
  }
};

const TagCounter = mongoose.model("TagCounter", TagCounterSchema);

export default TagCounter;





