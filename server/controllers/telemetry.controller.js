import SystemTelemetry from '../models/telemetry.model.js'

export const getTelemetry = async (req, res) => {
    try {
        const { id } = req.params; // MAC address
        
        // Optional pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Find all telemetry records for this MAC address
        const telemetryList = await SystemTelemetry.find({ mac_address: id })
            .sort({ timestamp: -1 }) // Most recent first
            .skip(skip)
            .limit(limit)
            .exec();
        
        if (telemetryList.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No telemetry data found for this device',
                mac_address: id
            });
        }
        
        const total = await SystemTelemetry.countDocuments({ mac_address: id });
        
        res.status(200).json({
            success: true,
            mac_address: id,
            count: telemetryList.length,
            total: total,
            page: page,
            pages: Math.ceil(total / limit),
            data: telemetryList
        });
        
    } catch (error) {
        console.error('Error fetching telemetry by ID:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch telemetry data',
            message: error.message
        });
    }
};



