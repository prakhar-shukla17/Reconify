"use client";

import { useState } from "react";
import { Edit, Save, X, AlertCircle } from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

export default function MacAddressEditor({ macAddress, assetId, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newMacAddress, setNewMacAddress] = useState(macAddress);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const validateMacAddress = (mac) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setNewMacAddress(macAddress);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewMacAddress(macAddress);
    setError(null);
  };

  const handleSave = async () => {
    if (!validateMacAddress(newMacAddress)) {
      setError("Invalid MAC address format. Use format: XX:XX:XX:XX:XX:XX");
      return;
    }

    if (newMacAddress.toUpperCase() === macAddress.toUpperCase()) {
      setIsEditing(false);
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const token = Cookies.get("token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`/api/hardware/${macAddress}/mac-address`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newMacAddress: newMacAddress.toUpperCase(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("MAC address updated successfully");
        setIsEditing(false);
        if (onUpdate) {
          onUpdate(newMacAddress.toUpperCase());
        }
      } else {
        setError(result.error || "Failed to update MAC address");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={newMacAddress}
          onChange={(e) => setNewMacAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
          placeholder="XX:XX:XX:XX:XX:XX"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={updating}
          className="text-green-600 hover:text-green-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={updating}
          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
        {error && (
          <div className="flex items-center space-x-1 text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs">{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="font-mono text-sm">{macAddress}</span>
      <button
        onClick={handleEdit}
        className="text-blue-600 hover:text-blue-800"
        title="Edit MAC address"
      >
        <Edit className="h-4 w-4" />
      </button>
    </div>
  );
}
