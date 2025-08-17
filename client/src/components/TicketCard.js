"use client";

import {
  Clock,
  User,
  Monitor,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
} from "lucide-react";

const TicketCard = ({ ticket, onClick, isAdmin = false }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "Open":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "In Progress":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case "Resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Closed":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "Rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "1 day ago";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      onClick={() => onClick?.(ticket)}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-mono text-gray-500">
              {ticket.ticket_id}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                ticket.priority
              )}`}
            >
              {ticket.priority}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {ticket.title}
          </h3>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {getStatusIcon(ticket.status)}
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
              ticket.status
            )}`}
          >
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {ticket.description}
      </p>

      {/* Asset Info */}
      <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded-md">
        <Monitor className="h-4 w-4 text-gray-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {ticket.asset_hostname}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {ticket.asset_model} • {ticket.asset_id}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{isAdmin ? ticket.created_by_name : "You"}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(ticket.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-medium">{ticket.category}</span>
        </div>
      </div>

      {/* Assignment Info (Admin View) */}
      {isAdmin && ticket.assigned_to_name && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1 text-xs text-blue-600">
            <User className="h-3 w-3" />
            <span>Assigned to: {ticket.assigned_to_name}</span>
          </div>
        </div>
      )}

      {/* Comments Count */}
      {ticket.comments && ticket.comments.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {ticket.comments.length} comment
            {ticket.comments.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
};

export default TicketCard;
