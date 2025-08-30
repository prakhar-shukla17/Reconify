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
        return <AlertCircle className="h-3 w-3 text-rose-500" />;
      case "In Progress":
        return <Pause className="h-3 w-3 text-amber-500" />;
      case "Resolved":
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case "Closed":
        return <XCircle className="h-3 w-3 text-slate-500" />;
      case "Rejected":
        return <XCircle className="h-3 w-3 text-rose-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-slate-500" />;
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

  // Check if ticket is closed and should not be clickable
  const isClosed = ticket.status === "Closed" || ticket.status === "Rejected";
  const isClickable = !isClosed;

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick(ticket);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`border border-slate-200 rounded-lg p-3 transition-all duration-200 ${
        isClickable 
          ? "bg-white hover:shadow-lg hover:border-slate-300 cursor-pointer group bg-gradient-to-br from-white to-slate-50" 
          : "bg-slate-100 cursor-not-allowed opacity-75"
      }`}
    >
      {/* Header - Compact */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
              isClickable ? "text-slate-500 bg-slate-100" : "text-slate-400 bg-slate-200"
            }`}>
              {ticket.ticket_id}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                ticket.priority, ticket.status
              )}`}
            >
              {ticket.priority}
            </span>
          </div>
          <h3 className={`text-sm font-semibold line-clamp-2 leading-tight ${
            isClickable 
              ? "text-slate-900 group-hover:text-blue-600 transition-colors" 
              : "text-slate-600"
          }`}>
            {ticket.title}
          </h3>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          {getStatusIcon(ticket.status)}
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(
              ticket.status
            )}`}
          >
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Description - Smaller */}
      <p className={`text-xs mb-2 line-clamp-2 leading-tight ${
        isClickable ? "text-slate-600" : "text-slate-500"
      }`}>
        {ticket.description}
      </p>

      {/* Asset Info - Compact */}
      <div className={`flex items-center space-x-2 mb-2 p-1.5 rounded border text-xs ${
        isClickable 
          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100" 
          : "bg-slate-200 border-slate-300"
      }`}>
        <Monitor className={`h-3 w-3 flex-shrink-0 ${
          isClickable ? "text-blue-500" : "text-slate-400"
        }`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${
            isClickable ? "text-slate-900" : "text-slate-600"
          }`}>
            {ticket.asset_hostname}
          </p>
          <p className={`text-xs truncate ${
            isClickable ? "text-slate-500" : "text-slate-400"
          }`}>
            {ticket.asset_model} • {ticket.asset_id}
          </p>
        </div>
      </div>

      {/* Footer - Compact */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <User className={`h-3 w-3 ${
              isClickable ? "text-blue-500" : "text-slate-400"
            }`} />
            <span className={`text-xs ${
              isClickable ? "text-slate-600" : "text-slate-500"
            }`}>
              {isAdmin ? (
                <div className="flex flex-col">
                  <span>{ticket.created_by_name}</span>
                  {ticket.created_by_email && (
                    <span className="text-slate-400 text-xs">{ticket.created_by_email}</span>
                  )}
                </div>
              ) : (
                "You"
              )}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className={`h-3 w-3 ${
              isClickable ? "text-amber-500" : "text-slate-400"
            }`} />
            <span className={`text-xs ${
              isClickable ? "text-slate-600" : "text-slate-500"
            }`}>{formatDate(ticket.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            isClickable 
              ? "text-slate-700 bg-slate-100" 
              : "text-slate-500 bg-slate-200"
          }`}>
            {ticket.category}
          </span>
        </div>
      </div>

      {/* Assignment Info (Admin View) - Compact */}
      {isAdmin && ticket.assigned_to_name && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
          <div className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded ${
            isClickable 
              ? "text-blue-600 bg-blue-50" 
              : "text-slate-500 bg-slate-200"
          }`}>
            <User className="h-3 w-3" />
            <span className="text-xs">Assigned to: {ticket.assigned_to_name}</span>
          </div>
        </div>
      )}

      {/* Comments Count - Compact */}
      {ticket.comments && ticket.comments.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
          <span className={`text-xs px-2 py-0.5 rounded ${
            isClickable 
              ? "text-slate-500 bg-slate-50" 
              : "text-slate-400 bg-slate-200"
          }`}>
            {ticket.comments.length} comment
            {ticket.comments.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Closed Ticket Indicator */}
      {isClosed && (
        <div className="mt-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-center">
            <div className="relative group">
              <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full cursor-help">
                {ticket.status === "Closed" ? "Ticket Closed" : "Ticket Rejected"}
              </span>
              
              {/* Resolution Tooltip */}
              {ticket.resolution && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs">
                  <div className="text-center">
                    <div className="font-medium mb-1">Resolution:</div>
                    <div className="text-slate-200 leading-relaxed">{ticket.resolution}</div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketCard;
