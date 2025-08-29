import Hardware from "../models/hardware.models.js";

export const getAll = async (req, res) => {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // Default 12 items per page
    const skip = (page - 1) * limit;

    // Get search and filter parameters
    const search = req.query.search;
    const filter = req.query.filter;

    let query = {};
    let totalCount = 0;

    // Add tenant ID filter
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }

    // Build search query - optimize for performance
    if (search) {
      // Use text search if available, otherwise regex
      if (search.length >= 3) {
        query.$or = [
          { "system.hostname": { $regex: search, $options: "i" } },
          { "system.mac_address": { $regex: search, $options: "i" } },
          { "cpu.name": { $regex: search, $options: "i" } },
        ];
      } else {
        // For short searches, only search hostname to improve performance
        query["system.hostname"] = { $regex: search, $options: "i" };
      }
    }

    // Build filter query
    if (filter === "assigned") {
      // This will be handled after we get the user's assigned assets
    } else if (filter === "unassigned") {
      // This will be handled after we get the user's assigned assets
    }

    // If user is admin, get all hardware
    if (req.user && req.user.role === "admin") {
      // Use Promise.all to run count and find operations in parallel
      const [countResult, hardwareList] = await Promise.all([
        Hardware.countDocuments(query),
        Hardware.find(query)
          .sort({ createdAt: -1 }) // Sort by newest first
          .skip(skip)
          .limit(limit)
          .lean(), // Use lean() for better performance
      ]);

      totalCount = countResult;

      return res.status(200).json({
        message: "Data fetched successfully",
        data: hardwareList,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      });
    }
    // If user is regular user, get only assigned assets
    else if (req.user && req.user.assignedAssets) {
      query._id = { $in: req.user.assignedAssets };

      // Use Promise.all to run count and find operations in parallel
      const [countResult, hardwareList] = await Promise.all([
        Hardware.countDocuments(query),
        Hardware.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(), // Use lean() for better performance
      ]);

      totalCount = countResult;

      return res.status(200).json({
        message: "Data fetched successfully",
        data: hardwareList,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      });
    }
    // If no user context, return empty (shouldn't happen with auth middleware)
    else {
      return res.status(200).json({
        message: "Data fetched successfully",
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }
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
    
    // Build query with tenant_id filter
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    const hardware = await Hardware.findOne(query);

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

    // For PUT requests, use the ID from URL parameter
    // For POST requests, use the MAC address from body
    const macAddress = req.params.id || hardwareData.system?.mac_address;

    // Check if MAC address exists
    if (!macAddress) {
      return res.status(400).json({
        error: "MAC address is required in system.mac_address or URL parameter",
      });
    }

    // Convert MAC address to string and use as _id
    const macAddressString = String(macAddress);

    // Build query with tenant_id filter
    let query = { _id: macAddressString };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    // Check if this is an update to an existing asset
    const existingHardware = await Hardware.findOne(query);

    if (existingHardware) {
      // Update existing asset with scanner data
      let updatedData = {
        ...hardwareData,
        scan_metadata: {
          ...hardwareData.scan_metadata,
          scan_status: "completed",
          last_scan: new Date(),
          scanner_version:
            hardwareData.scan_metadata?.scanner_version || "v1.0",
        },
      };

      // If it's a manual entry, preserve manual entry specific fields
      if (existingHardware.asset_info?.entry_type === "manual") {
        updatedData.asset_info = {
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
        };
      } else {
        // For scanner entries, just update the data
        updatedData.asset_info = {
          ...hardwareData.asset_info,
          entry_type: "scanner",
          status: "Scanned - Data Updated",
        };
      }

      const updatedHardware = await Hardware.findOneAndUpdate(
        query,
        updatedData,
        { new: true }
      );

      return res.status(200).json({
        message: "Asset updated with scanner data successfully",
        data: updatedHardware,
        updated: true,
      });
    }

    const dataWithCustomId = {
      _id: macAddressString,
      tenant_id: req.user?.tenant_id || "default",
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

    // Save to MongoDB
    const newHardware = new Hardware(dataWithCustomId);
    const savedHardware = await newHardware.save();

    return res.status(201).json({
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

    // Build query with tenant_id filter
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    // Update the hardware document
    const updatedHardware = await Hardware.findOneAndUpdate(
      query,
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

// Update asset information for user's own assets
export const updateUserAssetInfo = async (req, res) => {
  try {
    const { id } = req.params; // MAC address
    const assetInfoData = req.body;

    // Check if the asset is assigned to the current user
    if (!req.user.assignedAssets.includes(id)) {
      return res
        .status(403)
        .json({ error: "Access denied. Asset not assigned to you." });
    }

    // Validate required fields
    if (!assetInfoData) {
      return res
        .status(400)
        .json({ error: "Asset information data is required" });
    }

    // Validate dates if provided
    if (assetInfoData.purchase_date) {
      const purchaseDate = new Date(assetInfoData.purchase_date);
      if (isNaN(purchaseDate.getTime())) {
        return res.status(400).json({ error: "Invalid purchase date format" });
      }
    }

    if (assetInfoData.warranty_expiry) {
      const warrantyDate = new Date(assetInfoData.warranty_expiry);
      if (isNaN(warrantyDate.getTime())) {
        return res
          .status(400)
          .json({ error: "Invalid warranty expiry date format" });
      }
    }

    // Prepare the update data
    const updateData = {
      ...assetInfoData,
      purchase_date: assetInfoData.purchase_date
        ? new Date(assetInfoData.purchase_date)
        : null,
      warranty_expiry: assetInfoData.warranty_expiry
        ? new Date(assetInfoData.warranty_expiry)
        : null,
      cost: parseFloat(assetInfoData.cost) || 0,
    };

    // Build query with tenant_id filter and user assignment check
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    // Update the hardware document
    const updatedHardware = await Hardware.findOneAndUpdate(
      query,
      { $set: { asset_info: updateData } },
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
    console.error("Error updating user asset information:", error);
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

    // Build tenant_id filter
    let tenantFilter = {};
    if (req.user && req.user.tenant_id) {
      tenantFilter.tenant_id = req.user.tenant_id;
    }
    
    // If user is admin, get all hardware with expiring warranties for their tenant
    if (req.user && req.user.role === "admin") {
      hardwareList = await Hardware.findExpiringWarranties(daysNumber, tenantFilter);
    }
    // If user is regular user, get only their assigned assets with expiring warranties
    else if (req.user && req.user.assignedAssets) {
      const expiringAssets = await Hardware.findExpiringWarranties(daysNumber, tenantFilter);
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

    // Apply tenant_id filtering
    if (req.user && req.user.tenant_id) {
      matchQuery.tenant_id = req.user.tenant_id;
    }

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

    // Build query with tenant_id filter
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    // Update the hardware document
    const updatedHardware = await Hardware.findOneAndUpdate(query, updateQuery, {
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

// Update component warranty information for user's own assets
export const updateUserComponentWarranty = async (req, res) => {
  try {
    const { id } = req.params; // MAC address
    const { componentType, componentIndex, warrantyInfo } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!componentType || !warrantyInfo) {
      return res
        .status(400)
        .json({ error: "Component type and warranty info are required" });
    }

    // Check if the asset is assigned to the current user
    if (!req.user.assignedAssets.includes(id)) {
      return res
        .status(403)
        .json({ error: "Access denied. Asset not assigned to you." });
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

    // Build query with tenant_id filter and user assignment check
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    // Update the hardware document
    const updatedHardware = await Hardware.findOneAndUpdate(query, updateQuery, {
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
    console.error("Error updating user component warranty:", error);
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

    // Build query with tenant_id filter
    let query = { _id: normalizedMacAddress };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    // Check if asset already exists
    const existingAsset = await Hardware.findOne(query);
    if (existingAsset) {
      return res.status(409).json({
        error: "Asset with this MAC address already exists",
      });
    }

    // Create minimal manual entry
    const manualAssetData = {
      _id: normalizedMacAddress,
      tenant_id: req.user?.tenant_id || "default",
      system: {
        mac_address: normalizedMacAddress,
        hostname: hostname || `Manual-${normalizedMacAddress.slice(-6)}`,
        platform: category, // Use category as platform since it's required
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
        created_manually_by: req.user._id,
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
        name: `Manual Entry - ${category}`, // Required field
        brand: "Unknown",
        architecture: "Unknown",
        cores: 0,
        threads: 0,
        frequency: "Unknown",
      },
      memory: {
        total: "0 GB", // Match the schema field name
        available: "0 GB",
        slots: [],
      },
      storage: {
        drives: [],
      },
      network: {
        interfaces: [],
      },
    };

    const newManualAsset = new Hardware(manualAssetData);
    const savedAsset = await newManualAsset.save();

    res.status(201).json({
      success: true,
      message: "Manual asset entry created successfully",
      data: savedAsset,
    });
  } catch (error) {
    console.error("Create manual asset error:", error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: "Validation error",
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Asset with this MAC address already exists"
      });
    }
    
    res.status(500).json({
      error: "Failed to create manual asset entry",
      details: error.message,
    });
  }
};

// Get all manual entries (assets created manually but not yet scanned)
export const getManualEntries = async (req, res) => {
  try {
    // Build query with tenant_id filter
    let query = {
      "asset_info.entry_type": "manual",
      "scan_metadata.scan_status": "manual_entry_pending_scan",
    };
    
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    const manualAssets = await Hardware.find(query);

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

    // Build tenant_id filter
    let tenantFilter = {};
    if (req.user && req.user.tenant_id) {
      tenantFilter.tenant_id = req.user.tenant_id;
    }
    
    const allAssets = await Hardware.find(
      tenantFilter,
      "_id system.hostname system.mac_address"
    );
    const users = await User.find(tenantFilter, "assignedAssets");

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

    // Build tenant_id filter
    let tenantFilter = {};
    if (req.user && req.user.tenant_id) {
      tenantFilter.tenant_id = req.user.tenant_id;
    }
    
    // Get total assets count
    const totalAssets = await Hardware.countDocuments(tenantFilter);

    // Get assigned assets count
    const assignedAssets = await Hardware.countDocuments({
      ...tenantFilter,
      "system.mac_address": { $in: user.assignedAssets || [] },
    });

    // Get active assets count
    const activeAssets = await Hardware.countDocuments({
      ...tenantFilter,
      "asset_info.status": "Active",
    });

    // Get assets with expiring warranties (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringWarranties = await Hardware.countDocuments({
      ...tenantFilter,
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

    // Parse CSV content
    const headers = lines[0].split(",").map((h) => h.trim());
    const dataLines = lines.slice(1).filter((line) => line.trim());

    // Process each line
    const results = [];
    let successCount = 0;
    let errorCount = 0;

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
      // results.totalProcessed++; // Removed as per edit hint

      try {
        // Skip empty lines
        if (!line.trim()) {
          rowNumber++;
          continue;
        }

        const columns = parseCSVLine(line);

        // console.log( // Removed as per edit hint
        //   `Row ${rowNumber} has ${columns.length} columns:`,
        //   columns.slice(0, 5),
        //   "..."
        // );

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
          // console.log( // Removed as per edit hint
          //   `Skipping row ${rowNumber}: assetName="${assetName}", branch="${branch}", columns=${columns.length}`
          // );
          rowNumber++;
          continue;
        }

        // console.log( // Removed as per edit hint
        //   `Processing row ${rowNumber}: assetName="${assetName}", branch="${branch}", assetId="${assetId}"`
        // );

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
          tenant_id: req.user?.tenant_id || "default",
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

        // Build query with tenant_id filter
        let query = { _id: macAddress };
        if (req.user && req.user.tenant_id) {
          query.tenant_id = req.user.tenant_id;
        }
        
        // Check if asset already exists
        const existingAsset = await Hardware.findOne(query);
        if (existingAsset) {
          results.push({ // Changed from results.errors.push to results.push
            row: rowNumber,
            message: `Asset with MAC address ${macAddress} already exists`,
          });
          errorCount++;
          rowNumber++;
          continue;
        }

        // Save the asset
        const newAsset = new Hardware(hardwareData);
        await newAsset.save();

        successCount++;
        results.push({ // Changed from results.importedAssets.push to results.push
          assetId,
          assetName: fullAssetName,
          macAddress,
          branch,
        });

        // console.log( // Removed as per edit hint
        //   `Successfully imported asset: ${fullAssetName} (${macAddress})`
        // );
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        results.push({ // Changed from results.errors.push to results.push
          row: rowNumber,
          message: `Error processing row: ${error.message}`,
        });
        errorCount++;
      }

      rowNumber++;
    }

    // console.log( // Removed as per edit hint
    //   `Import completed: ${results.successCount} successful, ${results.errorCount} errors`
    // );

    res.status(200).json({
      success: true,
      message: "CSV import completed",
      data: {
        totalProcessed: results.length, // Use results.length for total processed
        successCount,
        errorCount,
        errors: results,
        importedAssets: results, // Use results for imported assets
      },
    });
  } catch (error) {
    console.error("CSV import error:", error);
    res.status(500).json({
      error: "Failed to import CSV data",
      details: error.message,
    });
  }
};
