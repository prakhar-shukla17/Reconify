import Ticket from "../models/ticket.models.js";
import Hardware from "../models/hardware.models.js";
import User from "../models/user.models.js";

// Create a new ticket
export const createTicket = async (req, res) => {
  try {
    const { title, description, priority, category, asset_id } = req.body;

    // Validate required fields
    if (!title || !description || !category || !asset_id) {
      return res.status(400).json({
        error: "Title, description, category, and asset ID are required",
      });
    }

    // Verify the asset exists and user has access to it
    const asset = await Hardware.findById(asset_id);
    if (!asset) {
      return res.status(404).json({
        error: "Asset not found",
      });
    }

    // Check if user has access to this asset (either assigned to them or they're admin)
    const user = req.user;
    if (user.role !== "admin" && !user.assignedAssets.includes(asset_id)) {
      return res.status(403).json({
        error: "You don't have access to this asset",
      });
    }

    // Create ticket
    const ticketData = {
      title: title.trim(),
      description: description.trim(),
      priority: priority || "Medium",
      category,
      created_by: user._id,
      created_by_name: user.username,
      created_by_email: user.email,
      asset_id,
      asset_hostname: asset.system?.hostname || "Unknown",
      asset_model: asset.asset_info?.model || "Unknown",
    };

    const newTicket = new Ticket(ticketData);
    const savedTicket = await newTicket.save();

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: savedTicket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({
      error: "Failed to create ticket",
      details: error.message,
    });
  }
};

// Get all tickets (role-based access)
export const getAllTickets = async (req, res) => {
  try {
    const user = req.user;
    const { status, priority, category, page = 1, limit = 10 } = req.query;

    // Build filter based on user role
    let filter = {};

    if (user.role !== "admin") {
      // Regular users can only see their own tickets
      filter.created_by = user._id;
    }

    // Apply additional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    // Pagination
    const skip = (page - 1) * limit;

    const tickets = await Ticket.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("created_by", "username email")
      .populate("assigned_to", "username email")
      .populate("resolved_by", "username email");

    const total = await Ticket.countDocuments(filter);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_tickets: total,
        per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({
      error: "Failed to fetch tickets",
      details: error.message,
    });
  }
};

// Get ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const ticket = await Ticket.findById(id)
      .populate("created_by", "username email")
      .populate("assigned_to", "username email")
      .populate("resolved_by", "username email");

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    // Check access permissions
    if (
      user.role !== "admin" &&
      ticket.created_by._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        error: "You don't have access to this ticket",
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Get ticket by ID error:", error);
    res.status(500).json({
      error: "Failed to fetch ticket",
      details: error.message,
    });
  }
};

// Update ticket (admin only)
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to, resolution } = req.body;
    const user = req.user;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    // Update fields
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (resolution) ticket.resolution = resolution;

    // Handle assignment
    if (assigned_to) {
      const assignedUser = await User.findById(assigned_to);
      if (assignedUser && assignedUser.role === "admin") {
        ticket.assigned_to = assigned_to;
        ticket.assigned_to_name = assignedUser.username;
      }
    }

    // Handle resolution
    if (status === "Resolved" || status === "Closed") {
      ticket.resolved_at = new Date();
      ticket.resolved_by = user._id;
      ticket.resolved_by_name = user.username;
    }

    ticket.updated_at = new Date();
    const updatedTicket = await ticket.save();

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({
      error: "Failed to update ticket",
      details: error.message,
    });
  }
};

// Add comment to ticket
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, is_internal = false } = req.body;
    const user = req.user;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        error: "Comment is required",
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    // Check access permissions
    if (
      user.role !== "admin" &&
      ticket.created_by.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        error: "You don't have access to this ticket",
      });
    }

    // Only admins can add internal comments
    const isInternalComment = is_internal && user.role === "admin";

    const commentData = {
      comment: comment.trim(),
      commented_by: user._id,
      commented_by_name: user.username,
      is_internal: isInternalComment,
    };

    await ticket.addComment(commentData);

    res.json({
      success: true,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      error: "Failed to add comment",
      details: error.message,
    });
  }
};

// Get ticket statistics (admin only)
export const getTicketStatistics = async (req, res) => {
  try {
    const stats = await Ticket.getTicketStats();

    // Additional stats
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: "Open" });
    const overdueTickets = await Ticket.countDocuments({
      status: { $in: ["Open", "In Progress"] },
      created_at: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 days old
    });

    const avgResolutionTime = await Ticket.aggregate([
      {
        $match: {
          status: { $in: ["Resolved", "Closed"] },
          resolved_at: { $ne: null },
        },
      },
      {
        $project: {
          resolution_time: {
            $divide: [
              { $subtract: ["$resolved_at", "$created_at"] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avg_resolution_days: { $avg: "$resolution_time" },
        },
      },
    ]);

    res.json({
      success: true,
      statistics: {
        total_tickets: totalTickets,
        open_tickets: openTickets,
        overdue_tickets: overdueTickets,
        avg_resolution_days: avgResolutionTime[0]?.avg_resolution_days || 0,
        ...stats,
      },
    });
  } catch (error) {
    console.error("Get ticket statistics error:", error);
    res.status(500).json({
      error: "Failed to fetch ticket statistics",
      details: error.message,
    });
  }
};

// Get user's assigned assets for ticket creation
export const getUserAssets = async (req, res) => {
  try {
    const user = req.user;
    let assets = [];

    if (user.role === "admin") {
      // Admins can create tickets for any asset
      assets = await Hardware.find(
        {},
        "_id system.hostname asset_info.model asset_info.category"
      );
    } else {
      // Regular users can only create tickets for their assigned assets
      assets = await Hardware.find(
        { _id: { $in: user.assignedAssets } },
        "_id system.hostname asset_info.model asset_info.category"
      );
    }

    const formattedAssets = assets.map((asset) => ({
      id: asset._id,
      macAddress: asset._id,
      hostname: asset.system?.hostname || "Unknown",
      model: asset.asset_info?.model || "Unknown",
      category: asset.asset_info?.category || "Unknown",
    }));

    res.json({
      success: true,
      data: formattedAssets,
    });
  } catch (error) {
    console.error("Get user assets error:", error);
    res.status(500).json({
      error: "Failed to fetch user assets",
      details: error.message,
    });
  }
};
