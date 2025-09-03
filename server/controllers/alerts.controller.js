import Hardware from "../models/hardware.models.js";

// Test function to debug warranty alerts for a specific asset
export const testWarrantyAlerts = async (req, res) => {
  try {
    const { assetId, days = 30 } = req.query;
    
    if (!assetId) {
      return res.status(400).json({ error: "Asset ID is required" });
    }

    const today = new Date();
    const alertDays = parseInt(days);
    
    // Find the specific asset
    let query = { _id: assetId };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }

    const asset = await Hardware.findOne(query);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    console.log("Testing warranty alerts for asset:", assetId);
    console.log("Asset data:", JSON.stringify(asset, null, 2));

    const alerts = [];

    // Check CPU warranty
    if (asset.cpu?.component_info?.warranty_expiry) {
      const expiryDate = new Date(asset.cpu.component_info.warranty_expiry);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      console.log("CPU warranty check:", {
        warrantyExpiry: asset.cpu.component_info.warranty_expiry,
        expiryDate: expiryDate.toISOString(),
        daysUntilExpiry: daysUntilExpiry,
        shouldAlert: daysUntilExpiry <= alertDays && daysUntilExpiry >= 0
      });

      if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
        alerts.push({
          type: "cpu_warranty",
          daysUntilExpiry,
          component: "CPU"
        });
      }
    }

    // Check Memory warranty
    if (asset.memory?.slots) {
      asset.memory.slots.forEach((slot, index) => {
        if (slot.component_info?.warranty_expiry) {
          const expiryDate = new Date(slot.component_info.warranty_expiry);
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          console.log(`Memory slot ${index} warranty check:`, {
            warrantyExpiry: slot.component_info.warranty_expiry,
            expiryDate: expiryDate.toISOString(),
            daysUntilExpiry: daysUntilExpiry,
            shouldAlert: daysUntilExpiry <= alertDays && daysUntilExpiry >= 0
          });

          if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
            alerts.push({
              type: "memory_warranty",
              daysUntilExpiry,
              component: `Memory Slot ${index + 1}`,
              slotIndex: index
            });
          }
        }
      });
    }

    // Check GPU warranty
    if (asset.graphics?.gpus) {
      asset.graphics.gpus.forEach((gpu, index) => {
        if (gpu.component_info?.warranty_expiry) {
          const expiryDate = new Date(gpu.component_info.warranty_expiry);
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          console.log(`GPU ${index} warranty check:`, {
            warrantyExpiry: gpu.component_info.warranty_expiry,
            expiryDate: expiryDate.toISOString(),
            daysUntilExpiry: daysUntilExpiry,
            shouldAlert: daysUntilExpiry <= alertDays && daysUntilExpiry >= 0
          });

          if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
            alerts.push({
              type: "gpu_warranty",
              daysUntilExpiry,
              component: `GPU ${index + 1}`,
              gpuIndex: index
            });
          }
        }
      });
    }

    return res.json({
      success: true,
      assetId: assetId,
      today: today.toISOString(),
      alertDays: alertDays,
      alerts: alerts,
      totalAlerts: alerts.length
    });

  } catch (error) {
    console.error("Error testing warranty alerts:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get warranty alerts for expiring components and assets
export const getWarrantyAlerts = async (req, res) => {
  try {
    const { days = 30, page = 1, limit = 20, filter = "all" } = req.query;
    const alertDays = parseInt(days);
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const severityFilter = filter;

    const today = new Date();
    const alertDate = new Date();
    alertDate.setDate(today.getDate() + alertDays);

    console.log("Warranty alert parameters:", {
      today: today.toISOString(),
      alertDays: alertDays,
      alertDate: alertDate.toISOString(),
      severityFilter: severityFilter
    });

    const alerts = [];

    // Build optimized query with projection to only fetch needed fields
    let hardwareQuery = {};
    const projection = {
      'asset_info.warranty_expiry': 1,
      'cpu.component_info.warranty_expiry': 1,
      'memory.slots.component_info.warranty_expiry': 1,
      'storage.drives.component_info.warranty_expiry': 1,
      'graphics.gpus.component_info.warranty_expiry': 1,
      'system.hostname': 1,
      '_id': 1
    };

    // Add tenant ID filter
    if (req.user && req.user.tenant_id) {
      hardwareQuery.tenant_id = req.user.tenant_id;
    }

    // If user is not admin, filter by assigned assets
    if (req.user.role !== "admin") {
      hardwareQuery._id = { $in: req.user.assignedAssets };
    }

    // Add date-based filtering to reduce the number of documents processed
    const maxExpiryDate = new Date();
    maxExpiryDate.setDate(today.getDate() + alertDays + 1); // Add buffer day

    // Build date conditions for better query performance - be less restrictive to catch edge cases
    const dateConditions = {
      $or: [
        { 'asset_info.warranty_expiry': { $lte: maxExpiryDate } },
        { 'cpu.component_info.warranty_expiry': { $lte: maxExpiryDate } },
        { 'memory.slots.component_info.warranty_expiry': { $lte: maxExpiryDate } },
        { 'storage.drives.component_info.warranty_expiry': { $lte: maxExpiryDate } },
        { 'graphics.gpus.component_info.warranty_expiry': { $lte: maxExpiryDate } }
      ]
    };

    // Combine user and date conditions
    if (Object.keys(hardwareQuery).length > 0) {
      hardwareQuery = { $and: [hardwareQuery, dateConditions] };
    } else {
      hardwareQuery = dateConditions;
    }
    
    console.log("Warranty alert query:", JSON.stringify(hardwareQuery, null, 2));

    const hardwareAssets = await Hardware.find(hardwareQuery, projection).lean();
    console.log(`Found ${hardwareAssets.length} assets matching warranty alert criteria`);

    // Process alerts with optimized logic
    for (const asset of hardwareAssets) {
      console.log(`Processing asset ${asset._id} (${asset.system?.hostname}) for warranty alerts`);
      // Check asset-level warranty
      if (asset.asset_info?.warranty_expiry) {
        const expiryDate = new Date(asset.asset_info.warranty_expiry);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
          const severity = daysUntilExpiry <= 7
            ? "critical"
            : daysUntilExpiry <= 14
            ? "high"
            : "medium";
            
          // Apply severity filter
          if (severityFilter === "all" || severity === severityFilter) {
            alerts.push({
              id: `asset-${asset._id}`,
              type: "asset_warranty",
              severity,
              title: "Asset Warranty Expiring",
              message: `${
                asset.system?.hostname || "Unknown Device"
              } warranty expires in ${daysUntilExpiry} days`,
              assetId: asset._id,
              macAddress: asset._id,
              hostname: asset.system?.hostname,
              expiryDate: asset.asset_info.warranty_expiry,
              daysUntilExpiry,
              component: null,
              createdAt: new Date(),
            });
          }
        }
      }

      // Check CPU warranty
      if (asset.cpu?.component_info?.warranty_expiry) {
        const expiryDate = new Date(asset.cpu.component_info.warranty_expiry);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
          const severity = daysUntilExpiry <= 7
            ? "critical"
            : daysUntilExpiry <= 14
            ? "high"
            : "medium";
            
          // Apply severity filter
          if (severityFilter === "all" || severity === severityFilter) {
            alerts.push({
              id: `cpu-${asset._id}`,
              type: "component_warranty",
              severity,
              title: "CPU Warranty Expiring",
              message: `CPU warranty for ${
                asset.system?.hostname || "Unknown Device"
              } expires in ${daysUntilExpiry} days`,
              assetId: asset._id,
              macAddress: asset._id,
              hostname: asset.system?.hostname,
              expiryDate: asset.cpu.component_info.warranty_expiry,
              daysUntilExpiry,
              component: { type: "cpu", name: "CPU", index: null },
              createdAt: new Date(),
            });
          }
        }
      }

      // Check Memory slots warranty - optimized to avoid unnecessary iterations
      if (asset.memory?.slots && Array.isArray(asset.memory.slots)) {
        console.log(`Checking memory slots for asset ${asset._id}:`, asset.memory.slots.length, "slots");
        for (let index = 0; index < asset.memory.slots.length; index++) {
          const slot = asset.memory.slots[index];
          if (slot.component_info?.warranty_expiry) {
            const expiryDate = new Date(slot.component_info.warranty_expiry);
            const daysUntilExpiry = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );
            
            console.log(`Memory slot ${index} warranty check:`, {
              assetId: asset._id,
              slotIndex: index,
              warrantyExpiry: slot.component_info.warranty_expiry,
              expiryDate: expiryDate,
              daysUntilExpiry: daysUntilExpiry,
              alertDays: alertDays,
              shouldAlert: daysUntilExpiry <= alertDays && daysUntilExpiry >= 0
            });

            if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
              const severity = daysUntilExpiry <= 7
                ? "critical"
                : daysUntilExpiry <= 14
                ? "high"
                : "medium";
                
              // Apply severity filter
              if (severityFilter === "all" || severity === severityFilter) {
                alerts.push({
                  id: `memory-${asset._id}-${index}`,
                  type: "component_warranty",
                  severity,
                  title: "Memory Warranty Expiring",
                  message: `Memory Slot #${index + 1} warranty for ${
                    asset.system?.hostname || "Unknown Device"
                  } expires in ${daysUntilExpiry} days`,
                  assetId: asset._id,
                  macAddress: asset._id,
                  hostname: asset.system?.hostname,
                  expiryDate: slot.component_info.warranty_expiry,
                  daysUntilExpiry,
                  component: {
                    type: "memory",
                    name: `Memory Slot #${index + 1}`,
                    index,
                  },
                  createdAt: new Date(),
                });
              }
            }
          }
        }
      }

      // Check Storage drives warranty - optimized to avoid unnecessary iterations
      if (asset.storage?.drives && Array.isArray(asset.storage.drives)) {
        for (let index = 0; index < asset.storage.drives.length; index++) {
          const drive = asset.storage.drives[index];
          if (drive.component_info?.warranty_expiry) {
            const expiryDate = new Date(drive.component_info.warranty_expiry);
            const daysUntilExpiry = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
              const severity = daysUntilExpiry <= 7
                ? "critical"
                : daysUntilExpiry <= 14
                ? "high"
                : "medium";
                
              // Apply severity filter
              if (severityFilter === "all" || severity === severityFilter) {
                alerts.push({
                  id: `storage-${asset._id}-${index}`,
                  type: "component_warranty",
                  severity,
                  title: "Storage Warranty Expiring",
                  message: `Storage Drive #${index + 1} warranty for ${
                    asset.system?.hostname || "Unknown Device"
                  } expires in ${daysUntilExpiry} days`,
                  assetId: asset._id,
                  macAddress: asset._id,
                  hostname: asset.system?.hostname,
                  expiryDate: drive.component_info.warranty_expiry,
                  daysUntilExpiry,
                  component: {
                    type: "storage",
                    name: `Storage Drive #${index + 1}`,
                    index,
                  },
                  createdAt: new Date(),
                });
              }
            }
          }
        }
      }

      // Check GPU warranty - optimized to avoid unnecessary iterations
      if (asset.graphics?.gpus && Array.isArray(asset.graphics.gpus)) {
        console.log(`Checking GPUs for asset ${asset._id}:`, asset.graphics.gpus.length, "GPUs");
        for (let index = 0; index < asset.graphics.gpus.length; index++) {
          const gpu = asset.graphics.gpus[index];
          if (gpu.component_info?.warranty_expiry) {
            const expiryDate = new Date(gpu.component_info.warranty_expiry);
            const daysUntilExpiry = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );
            
            console.log(`GPU ${index} warranty check:`, {
              assetId: asset._id,
              gpuIndex: index,
              warrantyExpiry: gpu.component_info.warranty_expiry,
              expiryDate: expiryDate,
              daysUntilExpiry: daysUntilExpiry,
              alertDays: alertDays,
              shouldAlert: daysUntilExpiry <= alertDays && daysUntilExpiry >= 0
            });

            if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
              const severity = daysUntilExpiry <= 7
                ? "critical"
                : daysUntilExpiry <= 14
                ? "high"
                : "medium";
                
              // Apply severity filter
              if (severityFilter === "all" || severity === severityFilter) {
                alerts.push({
                  id: `gpu-${asset._id}-${index}`,
                  type: "component_warranty",
                  severity,
                  title: "GPU Warranty Expiring",
                  message: `GPU #${index + 1} warranty for ${
                    asset.system?.hostname || "Unknown Device"
                  } expires in ${daysUntilExpiry} days`,
                  assetId: asset._id,
                  macAddress: asset._id,
                  hostname: asset.system?.hostname,
                  expiryDate: gpu.component_info.warranty_expiry,
                  daysUntilExpiry,
                  component: { type: "gpu", name: `GPU #${index + 1}`, index },
                  createdAt: new Date(),
                });
              }
            }
          }
        }
      }
    }

    // Sort alerts by severity and days until expiry
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    console.log(`Generated ${alerts.length} warranty alerts total`);

    // Calculate pagination
    const totalAlerts = alerts.length;
    const totalPages = Math.ceil(totalAlerts / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAlerts = alerts.slice(startIndex, endIndex);

    res.json({
      success: true,
      alerts: paginatedAlerts,
      pagination: {
        currentPage,
        totalPages,
        totalItems: totalAlerts,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
      summary: {
        total: totalAlerts,
        critical: alerts.filter((a) => a.severity === "critical").length,
        high: alerts.filter((a) => a.severity === "high").length,
        medium: alerts.filter((a) => a.severity === "medium").length,
        low: alerts.filter((a) => a.severity === "low").length,
      },
    });
  } catch (error) {
    console.error("Error fetching warranty alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch warranty alerts",
      error: error.message,
    });
  }
};

// Get alert statistics (admin only)
export const getAlertStatistics = async (req, res) => {
  try {
    const today = new Date();
    const alerts = [];

    // Get all hardware assets for statistics
    const hardwareAssets = await Hardware.find({});

    let totalAssets = hardwareAssets.length;
    let assetsWithWarranty = 0;
    let expiredWarranties = 0;
    let expiringIn30Days = 0;
    let expiringIn7Days = 0;

    for (const asset of hardwareAssets) {
      if (asset.asset_info?.warranty_expiry) {
        assetsWithWarranty++;
        const expiryDate = new Date(asset.asset_info.warranty_expiry);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          expiredWarranties++;
        } else if (daysUntilExpiry <= 7) {
          expiringIn7Days++;
        } else if (daysUntilExpiry <= 30) {
          expiringIn30Days++;
        }
      }
    }

    res.json({
      success: true,
      statistics: {
        totalAssets,
        assetsWithWarranty,
        assetsWithoutWarranty: totalAssets - assetsWithWarranty,
        expiredWarranties,
        expiringIn7Days,
        expiringIn30Days,
        warrantyCompliance:
          totalAssets > 0
            ? Math.round((assetsWithWarranty / totalAssets) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching alert statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alert statistics",
      error: error.message,
    });
  }
};
