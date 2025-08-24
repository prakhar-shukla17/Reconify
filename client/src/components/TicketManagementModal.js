"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Monitor,
  Calendar,
  Clock,
  MessageSquare,
  Edit,
  Save,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  UserCheck,
} from "lucide-react";
import { ticketsAPI } from "../lib/api";
import toast from "react-hot-toast";

const TicketManagementModal = ({ ticket, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [formData, setFormData] = useState({
    status: ticket?.status || "Open",
    priority: ticket?.priority || "Medium",
    assigned_to: ticket?.assigned_to || "",
    resolution: ticket?.resolution || "",
  });
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closeResolution, setCloseResolution] = useState("");
  const modalRef = useRef(null);
  
  // Cache for admin users to prevent unnecessary API calls
  const [usersCache, setUsersCache] = useState(null);
  const [lastUsersFetch, setLastUsersFetch] = useState(0);
  const USERS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    fetchAdminUsers();
    
    // Add click outside listener
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Check if users cache is valid
  const isUsersCacheValid = () => {
    return usersCache && (Date.now() - lastUsersFetch < USERS_CACHE_DURATION);
  };

  const fetchAdminUsers = async () => {
    // Check cache first
    if (isUsersCacheValid()) {
      setAdminUsers(usersCache);
      return;
    }

    try {
      const response = await ticketsAPI.getAdminUsers();
      const usersData = response.data.data || [];
      
      setAdminUsers(usersData);
      setUsersCache(usersData);
      setLastUsersFetch(Date.now());
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Open":
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case "In Progress":
        return <Pause className="h-5 w-5 text-amber-500" />;
      case "Resolved":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "Closed":
        return <XCircle className="h-5 w-5 text-slate-500" />;
      case "Rejected":
        return <XCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Closed":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityColor = (priority, status) => {
    // If ticket is closed, use black and white colors
    if (status === "Closed" || status === "Rejected") {
      switch (priority) {
        case "Critical":
          return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm";
        case "High":
          return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm";
        case "Medium":
          return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm";
        case "Low":
          return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm";
        default:
          return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm";
      }
    }
    
    // Normal colors for active tickets
    switch (priority) {
      case "Critical":
        return "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm";
      case "High":
        return "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm";
      case "Medium":
        return "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm";
      case "Low":
        return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm";
      default:
        return "bg-gradient-to-r from-slate-500 to-gray-500 text-white shadow-sm";
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await ticketsAPI.updateStatus(ticket._id, { status: newStatus });
      toast.success(`Ticket status updated to ${newStatus}`);
      onUpdate();
      setFormData((prev) => ({ ...prev, status: newStatus }));
      
      // Automatically close the modal when status is set to "Closed"
      if (newStatus === "Closed") {
        onClose();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async (adminId) => {
    setLoading(true);
    try {
      await ticketsAPI.assignTicket(ticket._id, { assigned_to: adminId });
      const adminName =
        adminUsers.find((admin) => admin._id === adminId)?.username ||
        "Unassigned";
      toast.success(
        adminId ? `Ticket assigned to ${adminName}` : "Ticket unassigned"
      );
      onUpdate();
      setFormData((prev) => ({ ...prev, assigned_to: adminId }));
    } catch (error) {
      console.error("Error assigning ticket:", error);
      toast.error("Failed to assign ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!closeResolution.trim()) {
      toast.error("Resolution is required when closing a ticket");
      return;
    }

    setLoading(true);
    try {
      await ticketsAPI.closeTicket(ticket._id, {
        resolution: closeResolution,
        status: "Closed",
      });
      toast.success("Ticket closed successfully");
      onUpdate();
      setShowCloseForm(false);
      setCloseResolution("");
      // Automatically close the modal when ticket is closed
      onClose();
    } catch (error) {
      console.error("Error closing ticket:", error);
      toast.error("Failed to close ticket");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // If it's less than 1 minute, show "Just now"
    if (diffMinutes < 1) {
      return "Just now";
    }
    // If it's less than 1 hour, show minutes ago
    else if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    }
    // If it's less than 1 day, show hours ago
    else if (diffHours < 24) {
      return `${diffHours} hr ago`;
    }
    // If it's 1 day, show "1 day ago"
    else if (diffDays === 1) {
      return "1 day ago";
    }
    // If it's multiple days, show days ago
    else {
      return `${diffDays} days ago`;
    }
  };

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">
                {ticket.ticket_id}
              </h2>
                <p className="text-slate-600 text-lg">{ticket.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(formData.status)}
              <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(
                  formData.status
                )}`}
              >
                {formData.status}
              </span>
              <span
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${getPriorityColor(
                  ticket.priority, formData.status
                )}`}
              >
                {ticket.priority}
              </span>
          </div>
          <button
            onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-all duration-200 hover:scale-110"
          >
                <X className="h-6 w-6 text-slate-500" />
          </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Description - Moved to top */}
            <div className="bg-gradient-to-br from-slate-50 to-purple-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
                Description
              </h3>
              <p className="text-slate-700 leading-relaxed">{ticket.description}</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Management */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-5 rounded-xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-blue-600" />
                  Status Management
                </h3>
                <div className="space-y-3">
                  {["Open", "In Progress", "Resolved"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={loading || formData.status === status}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                        formData.status === status
                          ? "bg-blue-100 text-blue-800 border-2 border-blue-200 shadow-md"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {getStatusIcon(status)}
                      <span className="ml-2">{status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignment */}
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50 p-5 rounded-xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-emerald-600" />
                  Assignment
                </h3>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => handleAssignment(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 bg-white transition-all duration-200 hover:border-slate-400"
                >
                  <option value="">Unassigned</option>
                  {adminUsers.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.username}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Assign this ticket to an admin user
                </p>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-slate-50 to-amber-50 p-5 rounded-xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-amber-600" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCloseForm(!showCloseForm)}
                    className="w-full px-4 py-3 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-200 transition-all duration-200 font-medium"
                  >
                    {showCloseForm ? "Cancel Close" : "Close Ticket"}
                  </button>
                  {showCloseForm && (
                    <div className="space-y-3">
                    <textarea
                      value={closeResolution}
                      onChange={(e) => setCloseResolution(e.target.value)}
                        placeholder="Enter resolution details..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 bg-white resize-none"
                      rows="3"
                    />
                      <button
                        onClick={handleCloseTicket}
                        disabled={loading || !closeResolution.trim()}
                        className="w-full px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Closing..." : "Confirm Close"}
                      </button>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-indigo-600" />
                Ticket Details
              </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Created by</p>
                      <p className="text-slate-600">{ticket.created_by_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Created</p>
                      <p className="text-slate-600">{formatDate(ticket.created_at)}</p>
                    </div>
                </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Category</p>
                      <p className="text-slate-600">{ticket.category}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Asset</p>
                      <p className="text-slate-600">{ticket.asset_hostname}</p>
                      <p className="text-xs text-slate-500">{ticket.asset_model}</p>
                    </div>
                  </div>
                  {ticket.assigned_to_name && (
                    <div className="flex items-center space-x-3">
                      <UserCheck className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Assigned to</p>
                        <p className="text-slate-600">{ticket.assigned_to_name}</p>
                      </div>
                  </div>
                )}
                    </div>
                  </div>
                </div>

            {/* Resolution */}
            {ticket.resolution && (
              <div className="bg-gradient-to-br from-slate-50 to-green-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Resolution
                  </h3>
                <p className="text-slate-700 leading-relaxed">{ticket.resolution}</p>
                    </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketManagementModal;
