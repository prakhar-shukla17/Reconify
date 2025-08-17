import Hardware from "../models/hardware.models.js";

// Get warranty alerts for expiring components and assets
export const getWarrantyAlerts = async (req, res) => {
  try {
    const { days = 30 } = req.query; // Default to 30 days warning
    const alertDays = parseInt(days);

    const today = new Date();
    const alertDate = new Date();
    alertDate.setDate(today.getDate() + alertDays);

    const alerts = [];

    // Get all hardware assets
    let hardwareQuery = {};

    // If user is not admin, filter by assigned assets
    if (req.user.role !== "admin") {
      hardwareQuery._id = { $in: req.user.assignedAssets };
    }

    const hardwareAssets = await Hardware.find(hardwareQuery);

    for (const asset of hardwareAssets) {
      // Check asset-level warranty
      if (asset.asset_info?.warranty_expiry) {
        const expiryDate = new Date(asset.asset_info.warranty_expiry);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
          alerts.push({
            id: `asset-${asset._id}`,
            type: "asset_warranty",
            severity:
              daysUntilExpiry <= 7
                ? "critical"
                : daysUntilExpiry <= 14
                ? "high"
                : "medium",
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

      // Check CPU warranty
      if (asset.cpu?.component_info?.warranty_expiry) {
        const expiryDate = new Date(asset.cpu.component_info.warranty_expiry);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
          alerts.push({
            id: `cpu-${asset._id}`,
            type: "component_warranty",
            severity:
              daysUntilExpiry <= 7
                ? "critical"
                : daysUntilExpiry <= 14
                ? "high"
                : "medium",
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

      // Check Memory slots warranty
      if (asset.memory?.slots) {
        asset.memory.slots.forEach((slot, index) => {
          if (slot.component_info?.warranty_expiry) {
            const expiryDate = new Date(slot.component_info.warranty_expiry);
            const daysUntilExpiry = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
              alerts.push({
                id: `memory-${asset._id}-${index}`,
                type: "component_warranty",
                severity:
                  daysUntilExpiry <= 7
                    ? "critical"
                    : daysUntilExpiry <= 14
                    ? "high"
                    : "medium",
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
        });
      }

      // Check Storage drives warranty
      if (asset.storage?.drives) {
        asset.storage.drives.forEach((drive, index) => {
          if (drive.component_info?.warranty_expiry) {
            const expiryDate = new Date(drive.component_info.warranty_expiry);
            const daysUntilExpiry = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
              alerts.push({
                id: `storage-${asset._id}-${index}`,
                type: "component_warranty",
                severity:
                  daysUntilExpiry <= 7
                    ? "critical"
                    : daysUntilExpiry <= 14
                    ? "high"
                    : "medium",
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
        });
      }

      // Check GPU warranty
      if (asset.graphics?.gpus) {
        asset.graphics.gpus.forEach((gpu, index) => {
          if (gpu.component_info?.warranty_expiry) {
            const expiryDate = new Date(gpu.component_info.warranty_expiry);
            const daysUntilExpiry = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
              alerts.push({
                id: `gpu-${asset._id}-${index}`,
                type: "component_warranty",
                severity:
                  daysUntilExpiry <= 7
                    ? "critical"
                    : daysUntilExpiry <= 14
                    ? "high"
                    : "medium",
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
        });
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

    res.json({
      success: true,
      alerts,
      summary: {
        total: alerts.length,
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
