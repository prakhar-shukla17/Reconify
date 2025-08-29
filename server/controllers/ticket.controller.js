import Ticket from "../models/ticket.models.js";
import Hardware from "../models/hardware.models.js";
import User from "../models/user.models.js";

// Create a new ticket
export const createTicket = async (req, res) => {
  try {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { title, description, priority, category, asset_id } = req.body;

    // Validate required fields
    if (!title || !description || !category || !asset_id) {
      return res.status(400).json({
        error: "Title, description, category, and asset ID are required",
      });
    }

    // Verify the asset exists and user has access to it
    let assetQuery = { _id: asset_id };
    if (req.user && req.user.tenant_id) {
      assetQuery.tenant_id = req.user.tenant_id;
    }
    
    const asset = await Hardware.findOne(assetQuery);
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

    // Generate unique ticket ID manually
    const ticketCount = await Ticket.countDocuments();
    const ticketId = `TKT-${String(ticketCount + 1).padStart(6, "0")}`;

    // Create ticket
    const ticketData = {
      ticket_id: ticketId, // Explicitly set the ticket_id
      tenant_id: user.tenant_id || "default",
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

    // Add tenant ID filter
    if (user.tenant_id) {
      filter.tenant_id = user.tenant_id;
    }

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

    // Build query with tenant_id filter
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    const ticket = await Ticket.findOne(query)
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
    const { status, priority, assigned_to, resolution, category } = req.body;
    const user = req.user;

    // Build query with tenant_id filter
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    // Store original status for logging
    const originalStatus = ticket.status;

    // Update basic fields
    if (status && status !== ticket.status) {
      ticket.status = status;
    }
    if (priority && priority !== ticket.priority) {
      ticket.priority = priority;
    }
    if (category && category !== ticket.category) {
      ticket.category = category;
    }
    if (resolution !== undefined) {
      ticket.resolution = resolution;
    }

    // Handle assignment
    if (assigned_to !== undefined) {
      if (assigned_to === null || assigned_to === "") {
        // Unassign ticket
        ticket.assigned_to = null;
        ticket.assigned_to_name = null;
      } else {
        // Assign to admin
        let userQuery = { _id: assigned_to };
        if (req.user && req.user.tenant_id) {
          userQuery.tenant_id = req.user.tenant_id;
        }
        
        const assignedUser = await User.findOne(userQuery);
        if (!assignedUser) {
          return res.status(400).json({
            error: "Assigned user not found",
          });
        }
        if (assignedUser.role !== "admin") {
          return res.status(400).json({
            error: "Tickets can only be assigned to admin users",
          });
        }
        ticket.assigned_to = assigned_to;
        ticket.assigned_to_name = assignedUser.username;
      }
    }

    // Handle resolution status changes
    if (status === "Resolved" || status === "Closed") {
      if (originalStatus !== "Resolved" && originalStatus !== "Closed") {
        ticket.resolved_at = new Date();
        ticket.resolved_by = user._id;
        ticket.resolved_by_name = user.username;
      }
    } else if (originalStatus === "Resolved" || originalStatus === "Closed") {
      // Ticket was reopened
      ticket.resolved_at = null;
      ticket.resolved_by = null;
      ticket.resolved_by_name = null;
    }

    ticket.updated_at = new Date();
    const updatedTicket = await ticket.save();

    // Populate the response
    const populatedTicket = await Ticket.findOne({ _id: updatedTicket._id })
      .populate("created_by", "username email")
      .populate("assigned_to", "username email")
      .populate("resolved_by", "username email");

    res.json({
      success: true,
      message: `Ticket ${
        originalStatus !== status
          ? "status updated to " + status
          : "updated successfully"
      }`,
      data: populatedTicket,
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

    // Build query with tenant_id filter
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    const ticket = await Ticket.findOne(query);
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

// Quick status update (admin only)
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!status) {
      return res.status(400).json({
        error: "Status is required",
      });
    }

    const validStatuses = [
      "Open",
      "In Progress",
      "Resolved",
      "Closed",
      "Rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    // Build query with tenant_id filter
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    const originalStatus = ticket.status;
    ticket.status = status;

    // Handle resolution status changes
    if (status === "Resolved" || status === "Closed") {
      if (originalStatus !== "Resolved" && originalStatus !== "Closed") {
        ticket.resolved_at = new Date();
        ticket.resolved_by = user._id;
        ticket.resolved_by_name = user.username;
      }
    } else if (originalStatus === "Resolved" || originalStatus === "Closed") {
      // Ticket was reopened
      ticket.resolved_at = null;
      ticket.resolved_by = null;
      ticket.resolved_by_name = null;
    }

    ticket.updated_at = new Date();
    const updatedTicket = await ticket.save();

    res.json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: {
        ticket_id: updatedTicket.ticket_id,
        status: updatedTicket.status,
        resolved_at: updatedTicket.resolved_at,
        resolved_by_name: updatedTicket.resolved_by_name,
      },
    });
  } catch (error) {
    console.error("Update ticket status error:", error);
    res.status(500).json({
      error: "Failed to update ticket status",
      details: error.message,
    });
  }
};

// Assign ticket to admin (admin only)
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body; // Can be null to unassign

    // Build query with tenant_id filter
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    if (assigned_to === null || assigned_to === "") {
      // Unassign ticket
      ticket.assigned_to = null;
      ticket.assigned_to_name = null;
    } else {
      // Assign to admin
      let userQuery = { _id: assigned_to };
      if (req.user && req.user.tenant_id) {
        userQuery.tenant_id = req.user.tenant_id;
      }
      
      const assignedUser = await User.findOne(userQuery);
      if (!assignedUser) {
        return res.status(400).json({
          error: "Assigned user not found",
        });
      }
      if (assignedUser.role !== "admin") {
        return res.status(400).json({
          error: "Tickets can only be assigned to admin users",
        });
      }
      ticket.assigned_to = assigned_to;
      ticket.assigned_to_name = assignedUser.username;
    }

    ticket.updated_at = new Date();
    const updatedTicket = await ticket.save();

    res.json({
      success: true,
      message: ticket.assigned_to
        ? `Ticket assigned to ${ticket.assigned_to_name}`
        : "Ticket unassigned",
      data: {
        ticket_id: updatedTicket.ticket_id,
        assigned_to: updatedTicket.assigned_to,
        assigned_to_name: updatedTicket.assigned_to_name,
      },
    });
  } catch (error) {
    console.error("Assign ticket error:", error);
    res.status(500).json({
      error: "Failed to assign ticket",
      details: error.message,
    });
  }
};

// Get all admin users (for assignment dropdown)
export const getAdminUsers = async (req, res) => {
  try {
    // Build query with tenant_id filter
    let query = { role: "admin", isActive: true };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    const admins = await User.find(query)
      .select("_id username email")
      .sort({ username: 1 });

    res.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    res.status(500).json({
      error: "Failed to fetch admin users",
      details: error.message,
    });
  }
};

// Close ticket with resolution (admin only)
export const closeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, status = "Closed" } = req.body;
    const user = req.user;

    if (!resolution || resolution.trim().length === 0) {
      return res.status(400).json({
        error: "Resolution is required when closing a ticket",
      });
    }

    // Build query with tenant_id filter
    let query = { _id: id };
    if (req.user && req.user.tenant_id) {
      query.tenant_id = req.user.tenant_id;
    }
    
    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    // Update ticket
    ticket.status = status;
    ticket.resolution = resolution.trim();
    ticket.resolved_at = new Date();
    ticket.resolved_by = user._id;
    ticket.resolved_by_name = user.username;
    ticket.updated_at = new Date();

    const updatedTicket = await ticket.save();

    // Populate the response
    const populatedTicket = await Ticket.findOne({ _id: updatedTicket._id })
      .populate("created_by", "username email")
      .populate("assigned_to", "username email")
      .populate("resolved_by", "username email");

    res.json({
      success: true,
      message: `Ticket ${status.toLowerCase()} successfully`,
      data: populatedTicket,
    });
  } catch (error) {
    console.error("Close ticket error:", error);
    res.status(500).json({
      error: "Failed to close ticket",
      details: error.message,
    });
  }
};
