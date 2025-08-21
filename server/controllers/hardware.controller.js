import Hardware from "../models/hardware.models.js";

export const getAll = async (req, res) => {
  try {
    let hardwareList;

    // If user is admin, get all hardware
    if (req.user && req.user.role === "admin") {
      hardwareList = await Hardware.find({});
    }
    // If user is regular user, get only assigned assets
    else if (req.user && req.user.assignedAssets) {
      hardwareList = await Hardware.find({
        _id: { $in: req.user.assignedAssets },
      });
    }
    // If no user context, return empty (shouldn't happen with auth middleware)
    else {
      hardwareList = [];
    }

    return res.status(200).json({
      message: "Data fetched successfully",
      data: hardwareList,
    });
  } catch (error) {
    console.error("Error fetching hardware data:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params; // MAC address
    const hardware = await Hardware.findById(id);

    if (!hardware) {
      return res.status(404).json({ error: "Hardware not found" });
    }

    return res.status(200).json({
      message: "Hardware data fetched successfully",
      data: hardware,
    });
  } catch (error) {
    console.error("Error fetching hardware by ID:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const createHardware = async (req, res) => {
  try {
    const hardwareData = req.body;
    const macAddress = hardwareData.system?.mac_address;
    console.log("MAC Address received:", macAddress);

    // Check if MAC address exists
    if (!macAddress) {
      return res.status(400).json({
        error: "MAC address is required in system.mac_address",
      });
    }

    // Convert MAC address to string and use as _id
    const macAddressString = String(macAddress);

    // Check if this is an update to an existing manual entry
    const existingHardware = await Hardware.findById(macAddressString);

    if (
      existingHardware &&
      existingHardware.asset_info?.entry_type === "manual"
    ) {
      // Update existing manual entry with scanner data
      console.log(
        "Updating existing manual entry with scanner data:",
        macAddressString
      );

      const updatedData = {
        ...hardwareData,
        asset_info: {
          ...hardwareData.asset_info,
          // Preserve manual entry specific fields
          entry_type: "manual",
          category: existingHardware.asset_info.category,
          model: existingHardware.asset_info.model,
          created_manually_at: existingHardware.asset_info.created_manually_at,
          created_manually_by: existingHardware.asset_info.created_manually_by,
          // Update other fields from manual entry if they exist
          vendor:
            existingHardware.asset_info.vendor !== "Unknown"
              ? existingHardware.asset_info.vendor
              : hardwareData.asset_info?.vendor,
          purchase_date:
            existingHardware.asset_info.purchase_date ||
            hardwareData.asset_info?.purchase_date,
          warranty_expiry:
            existingHardware.asset_info.warranty_expiry ||
            hardwareData.asset_info?.warranty_expiry,
          status: "Scanned - Data Updated",
        },
        scan_metadata: {
          ...hardwareData.scan_metadata,
          scan_status: "completed",
          last_scan: new Date(),
          scanner_version:
            hardwareData.scan_metadata?.scanner_version || "v1.0",
        },
      };

      const updatedHardware = await Hardware.findByIdAndUpdate(
        macAddressString,
        updatedData,
        { new: true }
      );

      console.log(
        "Manual entry updated with scanner data:",
        updatedHardware._id
      );
      return res.status(200).json({
        message: "Manual entry updated with scanner data successfully",
        data: updatedHardware,
        updated: true,
      });
    }

    const dataWithCustomId = {
      _id: macAddressString,
      ...hardwareData,
      asset_info: {
        ...hardwareData.asset_info,
        entry_type: "scanner",
      },
      scan_metadata: {
        ...hardwareData.scan_metadata,
        scan_status: "completed",
        last_scan: new Date(),
      },
    };

    console.log("Using MAC address as _id:", macAddressString);

    // Save to MongoDB
    const newHardware = new Hardware(dataWithCustomId);
    const savedHardware = await newHardware.save();

    console.log(
      "Hardware data saved with MAC address as ID:",
      savedHardware._id
    );
    res.status(201).json({
      message: "Hardware data saved to MongoDB successfully",
      id: savedHardware._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      console.error("MAC address already exists:", err.keyValue);
      res.status(409).json({
        error: "Hardware with this MAC address already exists",
      });
    } else {
      console.error("Error saving to MongoDB:", err);
      res.status(500).json({
        error: "Failed to save hardware data",
      });
    }
  }
};

// Update asset information (purchase date, warranty, etc.)
export const updateAssetInfo = async (req, res) => {
  try {
    const { id } = req.params; // MAC address
    const assetInfo = req.body;

    // Validate dates if provided
    if (assetInfo.purchase_date) {
      const purchaseDate = new Date(assetInfo.purchase_date);
      if (isNaN(purchaseDate.getTime())) {
        return res.status(400).json({ error: "Invalid purchase date format" });
      }
    }

    if (assetInfo.warranty_expiry) {
      const warrantyDate = new Date(assetInfo.warranty_expiry);
      if (isNaN(warrantyDate.getTime())) {
        return res
          .status(400)
          .json({ error: "Invalid warranty expiry date format" });
      }
    }

    // Update the hardware document
    const updatedHardware = await Hardware.findByIdAndUpdate(
      id,
      {
        $set: {
          asset_info: {
            ...assetInfo,
            purchase_date: assetInfo.purchase_date
              ? new Date(assetInfo.purchase_date)
              : null,
            warranty_expiry: assetInfo.warranty_expiry
              ? new Date(assetInfo.warranty_expiry)
              : null,
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedHardware) {
      return res.status(404).json({ error: "Hardware not found" });
    }

    return res.status(200).json({
      message: "Asset information updated successfully",
      data: updatedHardware,
    });
  } catch (error) {
    console.error("Error updating asset info:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get assets with expiring warranties
export const getExpiringWarranties = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNumber = parseInt(days);

    if (isNaN(daysNumber) || daysNumber < 0) {
      return res
        .status(400)
        .json({ error: "Days must be a valid positive number" });
    }

    let hardwareList;

    // If user is admin, get all hardware with expiring warranties
    if (req.user && req.user.role === "admin") {
      hardwareList = await Hardware.findExpiringWarranties(daysNumber);
    }
    // If user is regular user, get only their assigned assets with expiring warranties
    else if (req.user && req.user.assignedAssets) {
      const expiringAssets = await Hardware.findExpiringWarranties(daysNumber);
      hardwareList = expiringAssets.filter((asset) =>
        req.user.assignedAssets.includes(asset._id)
      );
    }
    // If no user context, return empty
    else {
      hardwareList = [];
    }

    return res.status(200).json({
      message: "Expiring warranties fetched successfully",
      data: hardwareList,
      count: hardwareList.length,
    });
  } catch (error) {
    console.error("Error fetching expiring warranties:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get warranty statistics
export const getWarrantyStats = async (req, res) => {
  try {
    let matchQuery = {};

    // Apply role-based filtering
    if (req.user && req.user.role !== "admin" && req.user.assignedAssets) {
      matchQuery._id = { $in: req.user.assignedAssets };
    }

    const stats = await Hardware.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          warranty_status: {
            $cond: {
              if: { $eq: ["$asset_info.warranty_expiry", null] },
              then: "unknown",
              else: {
                $let: {
                  vars: {
                    daysUntilExpiry: {
                      $divide: [
                        {
                          $subtract: [
                            "$asset_info.warranty_expiry",
                            new Date(),
                          ],
                        },
                        1000 * 60 * 60 * 24,
                      ],
                    },
                  },
                  in: {
                    $cond: {
                      if: { $lt: ["$$daysUntilExpiry", 0] },
                      then: "expired",
                      else: {
                        $cond: {
                          if: { $lte: ["$$daysUntilExpiry", 30] },
                          then: "expiring_soon",
                          else: "active",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$warranty_status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert array to object for easier frontend consumption
    const statsObject = {
      unknown: 0,
      active: 0,
      expiring_soon: 0,
      expired: 0,
    };

    stats.forEach((stat) => {
      statsObject[stat._id] = stat.count;
    });

    return res.status(200).json({
      message: "Warranty statistics fetched successfully",
      data: statsObject,
    });
  } catch (error) {
    console.error("Error fetching warranty stats:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update component warranty information
export const updateComponentWarranty = async (req, res) => {
  try {
    const { id } = req.params; // MAC address
    const { componentType, componentIndex, warrantyInfo } = req.body;

    // Validate required fields
    if (!componentType || !warrantyInfo) {
      return res
        .status(400)
        .json({ error: "Component type and warranty info are required" });
    }

    // Validate dates if provided
    if (warrantyInfo.purchase_date) {
      const purchaseDate = new Date(warrantyInfo.purchase_date);
      if (isNaN(purchaseDate.getTime())) {
        return res.status(400).json({ error: "Invalid purchase date format" });
      }
    }

    if (warrantyInfo.warranty_expiry) {
      const warrantyDate = new Date(warrantyInfo.warranty_expiry);
      if (isNaN(warrantyDate.getTime())) {
        return res
          .status(400)
          .json({ error: "Invalid warranty expiry date format" });
      }
    }

    // Build the update query based on component type
    let updateQuery = {};
    const componentInfoData = {
      ...warrantyInfo,
      purchase_date: warrantyInfo.purchase_date
        ? new Date(warrantyInfo.purchase_date)
        : null,
      warranty_expiry: warrantyInfo.warranty_expiry
        ? new Date(warrantyInfo.warranty_expiry)
        : null,
    };

    switch (componentType) {
      case "cpu":
        updateQuery = { $set: { "cpu.component_info": componentInfoData } };
        break;
      case "memory":
        if (componentIndex === undefined) {
          return res
            .status(400)
            .json({ error: "Component index is required for memory slots" });
        }
        updateQuery = {
          $set: {
            [`memory.slots.${componentIndex}.component_info`]:
              componentInfoData,
          },
        };
        break;
      case "storage":
        if (componentIndex === undefined) {
          return res
            .status(400)
            .json({ error: "Component index is required for storage drives" });
        }
        updateQuery = {
          $set: {
            [`storage.drives.${componentIndex}.component_info`]:
              componentInfoData,
          },
        };
        break;
      case "gpu":
        if (componentIndex === undefined) {
          return res
            .status(400)
            .json({ error: "Component index is required for GPUs" });
        }
        updateQuery = {
          $set: {
            [`graphics.gpus.${componentIndex}.component_info`]:
              componentInfoData,
          },
        };
        break;
      default:
        return res.status(400).json({ error: "Invalid component type" });
    }

    // Update the hardware document
    const updatedHardware = await Hardware.findByIdAndUpdate(id, updateQuery, {
      new: true,
      runValidators: true,
    });

    if (!updatedHardware) {
      return res.status(404).json({ error: "Hardware not found" });
    }

    return res.status(200).json({
      message: "Component warranty information updated successfully",
      data: updatedHardware,
    });
  } catch (error) {
    console.error("Error updating component warranty:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create a manual asset entry
export const createManualAsset = async (req, res) => {
  try {
    const { macAddress, modelName, category, hostname } = req.body;

    // Validate required fields
    if (!macAddress || !modelName || !category) {
      return res.status(400).json({
        error: "MAC address, model name, and category are required",
      });
    }

    // Validate MAC address format (basic validation)
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAddress)) {
      return res.status(400).json({
        error: "Invalid MAC address format",
      });
    }

    // Convert MAC address to uppercase for consistency
    const normalizedMacAddress = macAddress.toUpperCase();

    // Check if asset already exists
    const existingAsset = await Hardware.findById(normalizedMacAddress);
    if (existingAsset) {
      return res.status(409).json({
        error: "Asset with this MAC address already exists",
      });
    }

    // Create minimal manual entry
    const manualAssetData = {
      _id: normalizedMacAddress,
      system: {
        mac_address: normalizedMacAddress,
        hostname: hostname || `Manual-${normalizedMacAddress.slice(-6)}`,
        platform: "Unknown",
        platform_release: "Unknown",
        platform_version: "Unknown",
        architecture: "Unknown",
        processor: "Unknown",
        boot_time: new Date().toISOString(),
      },
      asset_info: {
        model: modelName,
        category: category,
        entry_type: "manual",
        created_manually_at: new Date(),
        created_manually_by: req.user.id,
        vendor: "Unknown",
        serial_number: "Unknown",
        status: "Manual Entry - Awaiting Scan",
      },
      scan_metadata: {
        scan_status: "manual_entry_pending_scan",
        last_scan: new Date(),
        scan_duration: 0,
        scanner_version: "manual-v1.0",
      },
      // Initialize empty sections that will be filled by scanner
      cpu: {
        brand: "Unknown",
        architecture: "Unknown",
        cores: 0,
        threads: 0,
        frequency: "Unknown",
      },
      memory: {
        total_memory: "Unknown",
        available_memory: "Unknown",
        memory_slots: [],
      },
      storage: {
        total_storage: "Unknown",
        drives: [],
      },
      graphics: {
        gpus: [],
      },
      network: {
        interfaces: [],
      },
    };

    const newManualAsset = new Hardware(manualAssetData);
    const savedAsset = await newManualAsset.save();

    console.log("Manual asset entry created:", savedAsset._id);

    res.status(201).json({
      success: true,
      message: "Manual asset entry created successfully",
      data: savedAsset,
    });
  } catch (error) {
    console.error("Create manual asset error:", error);
    res.status(500).json({
      error: "Failed to create manual asset entry",
      details: error.message,
    });
  }
};

// Get all manual entries (assets created manually but not yet scanned)
export const getManualEntries = async (req, res) => {
  try {
    const manualAssets = await Hardware.find({
      "asset_info.entry_type": "manual",
      "scan_metadata.scan_status": "manual_entry_pending_scan",
    });

    res.json({
      success: true,
      data: manualAssets.map((asset) => ({
        id: asset._id,
        macAddress: asset._id,
        modelName: asset.asset_info?.model_name,
        category: asset.asset_info?.category,
        description: asset.asset_info?.description,
        location: asset.asset_info?.location,
        createdAt: asset.asset_info?.created_manually_at,
        status: asset.scan_metadata?.scan_status,
      })),
      total: manualAssets.length,
    });
  } catch (error) {
    console.error("Get manual entries error:", error);
    res.status(500).json({ error: "Failed to get manual entries" });
  }
};

// Get unassigned assets
export const getUnassignedAssets = async (req, res) => {
  try {
    const User = (await import("../models/user.models.js")).default;

    const allAssets = await Hardware.find(
      {},
      "_id system.hostname system.mac_address"
    );
    const users = await User.find({}, "assignedAssets");

    const assignedMacAddresses = new Set();
    users.forEach((user) => {
      user.assignedAssets.forEach((mac) => assignedMacAddresses.add(mac));
    });

    const unassignedAssets = allAssets.filter(
      (asset) => !assignedMacAddresses.has(asset._id)
    );

    res.json({
      success: true,
      unassignedAssets: unassignedAssets.map((asset) => ({
        id: asset._id,
        macAddress: asset._id,
        hostname: asset.system?.hostname || "Unknown Device",
      })),
      total: unassignedAssets.length,
    });
  } catch (error) {
    console.error("Get unassigned assets error:", error);
    res.status(500).json({ error: "Failed to get unassigned assets" });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const { user } = req;

    // Get total assets count
    const totalAssets = await Hardware.countDocuments();

    // Get assigned assets count
    const assignedAssets = await Hardware.countDocuments({
      "system.mac_address": { $in: user.assignedAssets || [] },
    });

    // Get active assets count
    const activeAssets = await Hardware.countDocuments({
      "asset_info.status": "Active",
    });

    // Get assets with expiring warranties (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringWarranties = await Hardware.countDocuments({
      "asset_info.warranty_expiry": {
        $gte: new Date(),
        $lte: thirtyDaysFromNow,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalAssets,
        assignedAssets,
        activeAssets,
        expiringWarranties,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard statistics",
      details: error.message,
    });
  }
};

// Import assets from CSV file
export const importCsvAssets = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No CSV file uploaded",
      });
    }

    const csvContent = req.file.buffer.toString("utf-8");

    // Normalize line endings and split
    const normalizedContent = csvContent
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    const lines = normalizedContent.split("\n").filter((line) => line.trim());

    console.log("Total lines in CSV:", lines.length);

    // Skip header rows (first 4 lines are headers)
    const dataLines = lines.slice(4);
    console.log("Data lines to process:", dataLines.length);

    const results = {
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      importedAssets: [],
    };

    const generateRandomMacAddress = () => {
      const hexDigits = "0123456789ABCDEF";
      let mac = "";
      for (let i = 0; i < 6; i++) {
        if (i > 0) mac += ":";
        for (let j = 0; j < 2; j++) {
          mac += hexDigits[Math.floor(Math.random() * 16)];
        }
      }
      return mac;
    };

    // Simple CSV parser that handles quoted fields
    const parseCSVLine = (line) => {
      const columns = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          columns.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }

      // Add the last column
      columns.push(current.trim());

      // Clean up quotes
      return columns.map((col) =>
        col.replace(/^"/, "").replace(/"$/, "").trim()
      );
    };

    let rowNumber = 5; // Start from row 5 (after headers)

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      results.totalProcessed++;

      try {
        // Skip empty lines
        if (!line.trim()) {
          rowNumber++;
          continue;
        }

        const columns = parseCSVLine(line);

        console.log(
          `Row ${rowNumber} has ${columns.length} columns:`,
          columns.slice(0, 5),
          "..."
        );

        // Extract data from columns
        const [
          srNo,
          branch,
          assetId,
          assetName,
          assetCategory,
          make,
          model,
          ip,
          serialNumber,
          criticality,
          sensitivity,
          software,
          vendor,
          allocationDate,
          branch2,
          warrantyExpiry,
          purchaseValue,
          status,
          handledBy,
          approvedBy,
          empty1,
          colorDefinition,
        ] = columns;

        // Skip rows with insufficient data
        if (
          !assetName ||
          assetName === "Asset Name" ||
          !branch ||
          columns.length < 10
        ) {
          console.log(
            `Skipping row ${rowNumber}: assetName="${assetName}", branch="${branch}", columns=${columns.length}`
          );
          rowNumber++;
          continue;
        }

        console.log(
          `Processing row ${rowNumber}: assetName="${assetName}", branch="${branch}", assetId="${assetId}"`
        );

        // Generate MAC address
        let macAddress;
        if (ip && ip !== "-" && ip !== "") {
          // Check if IP looks like a valid MAC address (contains colons or dashes)
          if (ip.includes(":") || ip.includes("-")) {
            macAddress = ip;
          } else {
            // If it's an IP address, generate a random MAC
            macAddress = generateRandomMacAddress();
          }
        } else {
          macAddress = generateRandomMacAddress();
        }

        // Create asset name from Asset Name + Model
        const fullAssetName = `${assetName} ${model || ""}`.trim();

        // Create hardware data object
        const hardwareData = {
          _id: macAddress,
          system: {
            platform: "Unknown",
            platform_release: "Unknown",
            platform_version: "Unknown",
            architecture: "Unknown",
            hostname: assetId || `Asset-${srNo}`,
            processor: "Unknown",
            mac_address: macAddress,
          },
          asset_info: {
            purchase_date: null,
            warranty_expiry:
              warrantyExpiry && warrantyExpiry !== "-"
                ? new Date(warrantyExpiry)
                : null,
            vendor: vendor || make || "Unknown",
            model: model || "Unknown",
            serial_number:
              serialNumber && serialNumber !== "-" ? serialNumber : "Unknown",
            asset_tag: assetId || `Asset-${srNo}`,
            location: branch,
            department: branch,
            cost: purchaseValue ? parseFloat(purchaseValue) : 0,
            currency: "INR",
            entry_type: "csv_import",
            category: assetCategory || "Unknown",
            status: status || "Active",
            created_manually_at: new Date(),
            created_manually_by: req.user?.username || "admin",
          },
          cpu: {
            name: "Unknown",
            physical_cores: 0,
            logical_cores: 0,
            max_frequency: "Unknown",
            min_frequency: "Unknown",
            current_frequency: "Unknown",
            architecture: "Unknown",
            cache_info: {},
            features: [],
            manufacturer: "Unknown",
          },
          memory: {
            total: "0 GB",
            available: "0 GB",
            used: "0 GB",
            percentage: "0%",
            slots: [],
            type: "Unknown",
            speed: "Unknown",
            total_physical: "0 GB",
            slot_count: 0,
          },
          storage: {
            drives: [],
            total_capacity: "0 GB",
            partitions: [],
          },
          network: {
            interfaces: [],
          },
          graphics: {
            gpus: [],
          },
          motherboard: {
            manufacturer: "Unknown",
            model: "Unknown",
            version: "Unknown",
            serial_number: "Unknown",
            bios: {
              manufacturer: "Unknown",
              version: "Unknown",
              release_date: "Unknown",
            },
          },
          power_thermal: {
            battery: null,
            temperatures: {},
          },
        };

        // Check if asset already exists
        const existingAsset = await Hardware.findById(macAddress);
        if (existingAsset) {
          results.errors.push({
            row: rowNumber,
            message: `Asset with MAC address ${macAddress} already exists`,
          });
          results.errorCount++;
          rowNumber++;
          continue;
        }

        // Save the asset
        const newAsset = new Hardware(hardwareData);
        await newAsset.save();

        results.successCount++;
        results.importedAssets.push({
          assetId,
          assetName: fullAssetName,
          macAddress,
          branch,
        });

        console.log(
          `Successfully imported asset: ${fullAssetName} (${macAddress})`
        );
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        results.errors.push({
          row: rowNumber,
          message: `Error processing row: ${error.message}`,
        });
        results.errorCount++;
      }

      rowNumber++;
    }

    console.log(
      `Import completed: ${results.successCount} successful, ${results.errorCount} errors`
    );

    res.status(200).json({
      success: true,
      message: "CSV import completed",
      data: results,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    res.status(500).json({
      error: "Failed to import CSV data",
      details: error.message,
    });
  }
};
