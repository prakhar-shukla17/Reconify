"use client";

import { useState, useRef, useEffect } from "react";
import { X, Mail, Users, Send, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../lib/api";

export default function SendEmailModal({ isOpen, onClose, users }) {
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: "",
    message: "",
    recipients: "all", // "all", "active", "custom"
    customRecipients: [],
    includeCredentials: false,
  });
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleRecipientChange = (e) => {
    const { value } = e.target;
    setEmailData((prev) => ({
      ...prev,
      recipients: value,
      customRecipients: value === "custom" ? [] : prev.customRecipients,
    }));
  };

  const handleCustomRecipientToggle = (userId) => {
    setEmailData((prev) => ({
      ...prev,
      customRecipients: prev.customRecipients.includes(userId)
        ? prev.customRecipients.filter((id) => id !== userId)
        : [...prev.customRecipients, userId],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!emailData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!emailData.message.trim()) {
      newErrors.message = "Message is required";
    }

    if (emailData.recipients === "custom" && emailData.customRecipients.length === 0) {
      newErrors.recipients = "Please select at least one recipient";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRecipientCount = () => {
    switch (emailData.recipients) {
      case "all":
        return users.length;
      case "active":
        return users.filter((user) => user.isActive).length;
      case "custom":
        return emailData.customRecipients.length;
      default:
        return 0;
    }
  };

  const getRecipientEmails = () => {
    switch (emailData.recipients) {
      case "all":
        return users.map((user) => user.email);
      case "active":
        return users.filter((user) => user.isActive).map((user) => user.email);
      case "custom":
        return users
          .filter((user) => emailData.customRecipients.includes(user.id))
          .map((user) => user.email);
      default:
        return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare email payload
      let recipients;
      if (emailData.recipients === "all") {
        recipients = "all";
      } else if (emailData.recipients === "active") {
        recipients = "active";
      } else {
        recipients = getRecipientEmails();
      }

      const emailPayload = {
        subject: emailData.subject,
        message: emailData.message,
        recipients: recipients,
        includeCredentials: emailData.includeCredentials,
      };

      // Call the API to send emails
      const response = await authAPI.sendEmailToUsers(emailPayload);
      
      if (response.data.success) {
        const { total } = response.data.results;
        const message = `Email sent to ${total} users!`;
        
        toast.success(message);
        
        // Reset form
        setEmailData({
          subject: "",
          message: "",
          recipients: "all",
          customRecipients: [],
          includeCredentials: false,
        });

        onClose();
      } else {
        toast.error("Failed to send email. Please try again.");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to send email. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmailData({
        subject: "",
        message: "",
        recipients: "all",
        customRecipients: [],
        includeCredentials: false,
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ease-out max-h-[90vh]"
      >
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Send Email to Users
                </h2>
                <p className="text-sm text-blue-100">
                  Send announcements, updates, or communications to your users
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg p-2 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Recipients Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Select Recipients
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="radio"
                  name="recipients"
                  value="all"
                  checked={emailData.recipients === "all"}
                  onChange={handleRecipientChange}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">All Users</div>
                  <div className="text-sm text-gray-500">{users.length} recipients</div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="radio"
                  name="recipients"
                  value="active"
                  checked={emailData.recipients === "active"}
                  onChange={handleRecipientChange}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Active Users Only</div>
                  <div className="text-sm text-gray-500">
                    {users.filter((user) => user.isActive).length} recipients
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="radio"
                  name="recipients"
                  value="custom"
                  checked={emailData.recipients === "custom"}
                  onChange={handleRecipientChange}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Custom Selection</div>
                  <div className="text-sm text-gray-500">
                    {emailData.customRecipients.length} selected
                  </div>
                </div>
              </label>
            </div>

            {errors.recipients && (
              <p className="flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.recipients}
              </p>
            )}

            {/* Custom Recipients Selection */}
            {emailData.recipients === "custom" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Select Users:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center p-2 hover:bg-white rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={emailData.customRecipients.includes(user.id)}
                        onChange={() => handleCustomRecipientToggle(user.id)}
                        className="mr-2 text-blue-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Email Subject */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={emailData.subject}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                errors.subject
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-500"
              }`}
              placeholder="Enter email subject"
              disabled={loading}
            />
            {errors.subject && (
              <p className="flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.subject}
              </p>
            )}
          </div>

          {/* Email Message */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email Message *
            </label>
            <textarea
              name="message"
              value={emailData.message}
              onChange={handleInputChange}
              rows={8}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none ${
                errors.message
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-500"
              }`}
              placeholder="Enter your email message here..."
              disabled={loading}
            />
            {errors.message && (
              <p className="flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.message}
              </p>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Additional Options</h4>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailData.includeCredentials}
                onChange={(e) =>
                  setEmailData((prev) => ({
                    ...prev,
                    includeCredentials: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Include user credentials in the email (useful for password resets)
              </span>
            </label>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Email Summary</span>
              </div>
              <span className="text-sm text-blue-700">
                {getRecipientCount()} recipient{getRecipientCount() !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-2 text-sm text-blue-700">
              <p><strong>Subject:</strong> {emailData.subject || "Not set"}</p>
              <p><strong>Recipients:</strong> {getRecipientEmails().join(", ") || "None selected"}</p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {getRecipientCount()} user{getRecipientCount() !== 1 ? "s" : ""} will receive this email
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
