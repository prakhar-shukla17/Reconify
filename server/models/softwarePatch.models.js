import mongoose from "mongoose";

const SoftwarePatchSchema = new mongoose.Schema(
  {
    // Tenant ID for multi-tenancy
    tenant_id: { type: String, required: true, index: true },
    
    software_name: { type: String, required: true },
    version: { type: String, required: true },
    vendor: { type: String, default: "Unknown" },
    // Notes can be provided as a single text blob or as bullet points
    notes_text: { type: String, default: "" },
    notes_points: { type: [String], default: [] },
    created_by: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "software_manual_patches",
  }
);

SoftwarePatchSchema.index({ software_name: 1, version: 1 });
SoftwarePatchSchema.index({ vendor: 1 });

const SoftwarePatch = mongoose.model("SoftwarePatch", SoftwarePatchSchema);
export default SoftwarePatch;







