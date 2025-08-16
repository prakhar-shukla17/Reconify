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

    const dataWithCustomId = {
      _id: macAddressString,
      ...hardwareData,
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
    // Handle duplicate MAC address error
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
