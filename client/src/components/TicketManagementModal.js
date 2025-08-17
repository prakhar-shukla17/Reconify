"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const response = await ticketsAPI.getAdminUsers();
      setAdminUsers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Open":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "In Progress":
        return <Pause className="h-5 w-5 text-yellow-500" />;
      case "Resolved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Closed":
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case "Rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-red-100 text-red-800 border-red-200";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500 text-white";
      case "High":
        return "bg-orange-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-white";
      case "Low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await ticketsAPI.updateStatus(ticket._id, { status: newStatus });
      toast.success(`Ticket status updated to ${newStatus}`);
      onUpdate();
      setFormData((prev) => ({ ...prev, status: newStatus }));
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
    } catch (error) {
      console.error("Error closing ticket:", error);
      toast.error("Failed to close ticket");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {ticket.ticket_id}
              </h2>
              <p className="text-gray-600">{ticket.title}</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(formData.status)}
              <span
                className={`px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(
                  formData.status
                )}`}
              >
                {formData.status}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                  ticket.priority
                )}`}
              >
                {ticket.priority}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Management */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Status
                </h3>
                <div className="space-y-2">
                  {["Open", "In Progress", "Resolved"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={loading || formData.status === status}
                      className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.status === status
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {getStatusIcon(status)}
                      <span className="ml-2">{status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignment */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Assignment
                </h3>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => handleAssignment(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {adminUsers.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.username}
                    </option>
                  ))}
                </select>
                {ticket.assigned_to_name && (
                  <div className="mt-2 flex items-center text-sm text-blue-600">
                    <UserCheck className="h-4 w-4 mr-1" />
                    Currently: {ticket.assigned_to_name}
                  </div>
                )}
              </div>

              {/* Close Ticket */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Actions
                </h3>
                {!showCloseForm ? (
                  <button
                    onClick={() => setShowCloseForm(true)}
                    disabled={loading || formData.status === "Closed"}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Close Ticket
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Enter resolution details..."
                      value={closeResolution}
                      onChange={(e) => setCloseResolution(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows="3"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCloseTicket}
                        disabled={loading || !closeResolution.trim()}
                        className="flex-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setShowCloseForm(false);
                          setCloseResolution("");
                        }}
                        className="flex-1 px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Description
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Asset Information
                  </h3>
                  <div className="flex items-start space-x-3">
                    <Monitor className="h-5 w-5 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {ticket.asset_hostname}
                      </p>
                      <p className="text-sm text-gray-600">
                        {ticket.asset_model}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {ticket.asset_id}
                      </p>
                    </div>
                  </div>
                </div>

                {ticket.resolution && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">
                      Resolution
                    </h3>
                    <p className="text-green-800 whitespace-pre-wrap">
                      {ticket.resolution}
                    </p>
                    {ticket.resolved_by_name && ticket.resolved_at && (
                      <div className="mt-2 text-sm text-green-600">
                        Resolved by {ticket.resolved_by_name} on{" "}
                        {formatDate(ticket.resolved_at)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Ticket Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Created by:</span>
                      <span className="text-sm font-medium">
                        {ticket.created_by_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Last updated:
                      </span>
                      <span className="text-sm font-medium">
                        {formatDate(ticket.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className="text-sm font-medium">
                        {ticket.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Comments
                  </h3>
                  {ticket.comments && ticket.comments.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {ticket.comments.map((comment, index) => (
                        <div
                          key={index}
                          className="border-l-2 border-blue-200 pl-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.commented_by_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.commented_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {comment.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No comments yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Ticket ID: <span className="font-mono">{ticket.ticket_id}</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketManagementModal;
