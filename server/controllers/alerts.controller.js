import Hardware from "../models/hardware.models.js";

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

    // If user is not admin, filter by assigned assets
    if (req.user.role !== "admin") {
      hardwareQuery._id = { $in: req.user.assignedAssets };
    }

    // Add date-based filtering to reduce the number of documents processed
    const maxExpiryDate = new Date();
    maxExpiryDate.setDate(today.getDate() + alertDays + 1); // Add buffer day

    // Build date conditions for better query performance
    const dateConditions = {
      $or: [
        { 'asset_info.warranty_expiry': { $lte: maxExpiryDate, $gte: today } },
        { 'cpu.component_info.warranty_expiry': { $lte: maxExpiryDate, $gte: today } },
        { 'memory.slots.component_info.warranty_expiry': { $lte: maxExpiryDate, $gte: today } },
        { 'storage.drives.component_info.warranty_expiry': { $lte: maxExpiryDate, $gte: today } },
        { 'graphics.gpus.component_info.warranty_expiry': { $lte: maxExpiryDate, $gte: today } }
      ]
    };

    // Combine user and date conditions
    if (Object.keys(hardwareQuery).length > 0) {
      hardwareQuery = { $and: [hardwareQuery, dateConditions] };
    } else {
      hardwareQuery = dateConditions;
    }

    const hardwareAssets = await Hardware.find(hardwareQuery, projection).lean();

    // Process alerts with optimized logic
    for (const asset of hardwareAssets) {
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
        for (let index = 0; index < asset.memory.slots.length; index++) {
          const slot = asset.memory.slots[index];
          if (slot.component_info?.warranty_expiry) {
            const expiryDate = new Date(slot.component_info.warranty_expiry);
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
        for (let index = 0; index < asset.graphics.gpus.length; index++) {
          const gpu = asset.graphics.gpus[index];
          if (gpu.component_info?.warranty_expiry) {
            const expiryDate = new Date(gpu.component_info.warranty_expiry);
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
