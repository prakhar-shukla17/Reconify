"use client";

import { useState, useEffect } from "react";
import { Package, Clock, Monitor, AlertTriangle } from "lucide-react";
import { hardwareAPI } from "../lib/api";

const ManualEntriesWidget = () => {
  const [manualEntries, setManualEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManualEntries();
  }, []);

  const fetchManualEntries = async () => {
    try {
      const response = await hardwareAPI.getManualEntries();
      setManualEntries(response.data.data || []);
    } catch (error) {
      console.error("Error fetching manual entries:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (manualEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Manual Entries
          </h3>
        </div>
        <div className="text-center py-8">
          <Monitor className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No manual entries pending scan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          Manual Entries
        </h3>
        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">
          {manualEntries.length} pending
        </span>
      </div>

      <div className="space-y-3">
        {manualEntries.slice(0, 5).map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {entry.modelName}
                </p>
                <p className="text-xs text-gray-500">
                  {entry.category} • {entry.macAddress}
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs text-yellow-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Awaiting Scan
            </div>
          </div>
        ))}

        {manualEntries.length > 5 && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              +{manualEntries.length - 5} more entries pending scan
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <Monitor className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium">Next Steps</p>
            <p className="text-xs text-blue-700 mt-1">
              Deploy and run the hardware scanner on these devices to populate
              detailed hardware information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualEntriesWidget;
