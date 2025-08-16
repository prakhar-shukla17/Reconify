import Hardware from "../models/hardware.models.js";

export const getAll = async (req,res) => {
  try {
    const hardwareList = await Hardware.find({});
    return res.status(200).send({
      message:"data fetched successfully",
      data:hardwareList
    })
  } catch (error) {
    console.error('Error fetching hardware data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


export const createHardware = async (req, res) => {
  try {
    const hardwareData = req.body;
    const macAddress = hardwareData.system?.mac_address;
    console.log('MAC Address received:', macAddress);
    
   
    if (!macAddress) {
      return res.status(400).json({ 
        error: 'MAC address is required in system.mac_address' 
      });
    }
    
   
    const macAddressString = String(macAddress);
    
    const dataWithCustomId = {
      _id: macAddressString,
      ...hardwareData
    };
    
    console.log('Using MAC address as _id:', macAddressString);
    
  
    const newHardware = new Hardware(dataWithCustomId);
    const savedHardware = await newHardware.save();
    
    console.log('Hardware data saved with MAC address as ID:', savedHardware._id);
    res.status(201).json({ 
      message: 'Hardware data saved to MongoDB successfully', 
      id: savedHardware._id 
    });
  } catch (err) {
   
    if (err.code === 11000) {
      console.error('MAC address already exists:', err.keyValue);
      res.status(409).json({ 
        error: 'Hardware with this MAC address already exists' 
      });
    } else {
      console.error('Error saving to MongoDB:', err);
      res.status(500).json({ 
        error: 'Failed to save hardware data' 
      });
    }
  }
};
