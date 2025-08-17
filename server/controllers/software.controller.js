import Software from "../models/software.models.js";

// Get all software data with role-based access control
export const getAll = async (req, res) => {
  try {
    let softwareList;

    // If user is admin, get all software
    if (req.user && req.user.role === "admin") {
      softwareList = await Software.find({});
    }
    // If user is regular user, get only software for their assigned assets
    else if (req.user && req.user.assignedAssets) {
      softwareList = await Software.find({
        _id: { $in: req.user.assignedAssets }, // MAC addresses
      });
    }
    // If no user context, return empty (shouldn't happen with auth middleware)
    else {
      softwareList = [];
    }

    return res.status(200).json({
      message: "Software data fetched successfully",
      data: softwareList,
    });
  } catch (error) {
    console.error("Error fetching software data:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get software data by MAC address (asset ID)
export const getById = async (req, res) => {
  try {
    const { id } = req.params; // MAC address
    const software = await Software.findById(id);

    if (!software) {
      return res
        .status(404)
        .json({ error: "Software data not found for this asset" });
    }

    return res.status(200).json({
      message: "Software data fetched successfully",
      data: software,
    });
  } catch (error) {
    console.error("Error fetching software by ID:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create or update software data (from scanner)
export const createOrUpdateSoftware = async (req, res) => {
  try {
    const softwareData = req.body;

    // Validate required fields
    if (!softwareData.system || !softwareData.system.mac_address) {
      return res.status(400).json({
        error: "MAC address is required in system information",
      });
    }

    const macAddress = softwareData.system.mac_address;

    // Calculate scan metadata
    const scanMetadata = {
      total_software_count:
        (softwareData.installed_software?.length || 0) +
        (softwareData.system_software?.length || 0) +
        (softwareData.browser_extensions?.length || 0),
      scanner_version: "1.0",
      last_updated: new Date(),
    };

    // Prepare software document
    const softwareDocument = {
      _id: macAddress,
      system: softwareData.system,
      installed_software: softwareData.installed_software || [],
      system_software: softwareData.system_software || [],
      browser_extensions: softwareData.browser_extensions || [],
      services: softwareData.services || [],
      startup_programs: softwareData.startup_programs || [],
      scan_metadata: scanMetadata,
    };

    // Use findOneAndUpdate with upsert to create or update
    const software = await Software.findOneAndUpdate(
      { _id: macAddress },
      softwareDocument,
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log(
      `Software data saved for ${softwareData.system.hostname} (${macAddress})`
    );
    console.log(
      `Total software packages: ${scanMetadata.total_software_count}`
    );

    return res.status(200).json({
      message: "Software data saved successfully",
      data: {
        mac_address: macAddress,
        hostname: software.system.hostname,
        total_software: scanMetadata.total_software_count,
        installed_software: software.installed_software.length,
        services: software.services.length,
        startup_programs: software.startup_programs.length,
      },
    });
  } catch (error) {
    console.error("Error saving software data:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get software statistics (admin only)
export const getSoftwareStatistics = async (req, res) => {
  try {
    const stats = await Software.getSoftwareStatistics();

    return res.status(200).json({
      message: "Software statistics fetched successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching software statistics:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Search software across all systems (admin only)
export const searchSoftware = async (req, res) => {
  try {
    const { query, vendor, platform } = req.query;

    let searchCriteria = {};

    if (query) {
      searchCriteria["installed_software.name"] = {
        $regex: query,
        $options: "i",
      };
    }

    if (vendor) {
      searchCriteria["installed_software.vendor"] = {
        $regex: vendor,
        $options: "i",
      };
    }

    if (platform) {
      searchCriteria["system.platform"] = {
        $regex: platform,
        $options: "i",
      };
    }

    const results = await Software.find(searchCriteria)
      .select(
        "system.hostname system.mac_address system.platform installed_software"
      )
      .limit(100); // Limit results for performance

    return res.status(200).json({
      message: "Software search completed",
      data: results,
    });
  } catch (error) {
    console.error("Error searching software:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get software by vendor (admin only)
export const getSoftwareByVendor = async (req, res) => {
  try {
    const { vendor } = req.params;

    const results = await Software.aggregate([
      { $unwind: "$installed_software" },
      {
        $match: {
          "installed_software.vendor": {
            $regex: vendor,
            $options: "i",
          },
        },
      },
      {
        $group: {
          _id: {
            name: "$installed_software.name",
            version: "$installed_software.version",
            vendor: "$installed_software.vendor",
          },
          systems: {
            $push: {
              hostname: "$system.hostname",
              mac_address: "$system.mac_address",
              platform: "$system.platform",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      message: `Software by vendor '${vendor}' fetched successfully`,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching software by vendor:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get outdated software report (admin only)
export const getOutdatedSoftware = async (req, res) => {
  try {
    const results = await Software.aggregate([
      { $unwind: "$installed_software" },
      {
        $match: {
          $or: [
            { "installed_software.version": "Unknown" },
            { "installed_software.version": { $regex: "old", $options: "i" } },
          ],
        },
      },
      {
        $group: {
          _id: {
            name: "$installed_software.name",
            vendor: "$installed_software.vendor",
          },
          systems: {
            $push: {
              hostname: "$system.hostname",
              mac_address: "$system.mac_address",
              version: "$installed_software.version",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      message: "Outdated software report generated successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error generating outdated software report:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete software data (admin only)
export const deleteSoftware = async (req, res) => {
  try {
    const { id } = req.params; // MAC address

    const result = await Software.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: "Software data not found" });
    }

    return res.status(200).json({
      message: "Software data deleted successfully",
      data: { mac_address: id },
    });
  } catch (error) {
    console.error("Error deleting software data:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

