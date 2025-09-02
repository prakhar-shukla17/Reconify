import React, { useState, useEffect, useRef } from "react";
import { X, Mail, User, AlertTriangle, Send, Users, CheckCircle } from "lucide-react";
import { authAPI } from "../lib/api";
import toast from "react-hot-toast";

const AlertEmailModal = ({ isOpen, onClose, alert, users }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setEmailSent(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleSendEmails = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to send the alert email to");
      return;
    }

    setLoading(true);
    const emailPromises = [];

    try {
      for (const userId of selectedUsers) {
        const emailPromise = authAPI.sendWarrantyAlertEmail({
          alertId: alert.id,
          userId: userId,
          alertData: alert
        });
        emailPromises.push(emailPromise);
      }

      await Promise.all(emailPromises);
      setEmailSent(true);
      toast.success(`Warranty alert emails sent to ${selectedUsers.length} user(s)`);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error sending alert emails:", error);
      toast.error(error.userMessage || "Failed to send alert emails");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Warranty Alert Email</h2>
              <p className="text-sm text-gray-600">Notify users about expiring warranties</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {emailSent ? (
          /* Success State */
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Emails Sent Successfully!</h3>
            <p className="text-gray-600">
              Warranty alert emails have been sent to {selectedUsers.length} user(s).
            </p>
          </div>
        ) : (
          /* Email Configuration */
          <div className="p-6">
            {/* Alert Information */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Alert Details</h3>
              <div className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-center space-x-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {alert.hostname || "Unknown Device"}
                    </h4>
                    <p className="text-sm opacity-80">
                      {alert.component?.name || "Asset"} warranty expires in {alert.daysUntilExpiry} days
                    </p>
                    {alert.macAddress && (
                      <p className="text-xs font-mono opacity-70 mt-1">
                        MAC: {alert.macAddress}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* User Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">Select Recipients</h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedUsers.length === users.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelection(user.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">{user.department} • {user.role}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No users available</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmails}
                disabled={loading || selectedUsers.length === 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Alert Emails ({selectedUsers.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertEmailModal;


