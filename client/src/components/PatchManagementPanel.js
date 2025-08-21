"use client";

import { useEffect, useMemo, useState } from "react";
import { softwareAPI } from "../lib/api";
import toast from "react-hot-toast";
import { Package, Plus, RefreshCw, Search, CheckCircle, Info } from "lucide-react";

const PatchManagementPanel = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [softwareOptions, setSoftwareOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [formState, setFormState] = useState({
    software_name: "",
    vendor: "",
    version: "",
    notes_text: "",
    notes_points_raw: "",
  });

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return softwareOptions;
    const term = searchTerm.toLowerCase();
    return softwareOptions.filter((opt) =>
      [opt.name, opt.vendor, opt.version].some((v) => (v || "").toLowerCase().includes(term))
    );
  }, [softwareOptions, searchTerm]);

  const loadSoftwareOptions = async () => {
    try {
      setLoading(true);
      const { data } = await softwareAPI.getSoftwareVersionsForPatch();
      setSoftwareOptions(data.data || []);
    } catch (error) {
      console.error("Failed to load software versions:", error);
      toast.error("Failed to load software list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoftwareOptions();
  }, []);

  const handleSelectOption = (option) => {
    setFormState((prev) => ({
      ...prev,
      software_name: option.name || "",
      vendor: option.vendor || "",
      version: option.version || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.software_name || !formState.version) {
      toast.error("Select a software and version");
      return;
    }

    if (!formState.notes_text && !formState.notes_points_raw.trim()) {
      toast.error("Provide release notes (text or bullet points)");
      return;
    }

    const payload = {
      software_name: formState.software_name,
      version: formState.version,
      vendor: formState.vendor,
      notes_text: formState.notes_text || undefined,
      notes_points: formState.notes_points_raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      setSubmitting(true);
      await softwareAPI.createManualPatch(payload);
      toast.success("Patch recorded");
      setFormState({
        software_name: "",
        vendor: "",
        version: "",
        notes_text: "",
        notes_points_raw: "",
      });
    } catch (error) {
      console.error("Failed to create patch:", error);
      toast.error(error.response?.data?.error || "Failed to create patch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Package className="h-5 w-5 text-blue-600 mr-2" />
          Patch Management
        </h2>
        <p className="text-gray-600">Create manual patch entries for software and share release notes with users.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search software by name, vendor, or version"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder:text-gray-600"
            />
          </div>
          <button
            onClick={loadSoftwareOptions}
            disabled={loading}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="p-4 text-sm text-gray-800">Loading software list...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-4 text-sm text-gray-800">No software found.</div>
          ) : (
            <table className="min-w-full text-sm text-gray-900">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-800 font-semibold">Name</th>
                  <th className="text-left px-4 py-2 text-gray-800 font-semibold">Vendor</th>
                  <th className="text-left px-4 py-2 text-gray-800 font-semibold">Version</th>
                  <th className="text-left px-4 py-2 text-gray-800 font-semibold">Systems</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {filteredOptions.map((opt, idx) => (
                  <tr key={`${opt.name}-${opt.vendor}-${opt.version}-${idx}`} className="border-t">
                    <td className="px-4 py-2 text-gray-900">{opt.name}</td>
                    <td className="px-4 py-2 text-gray-900">{opt.vendor}</td>
                    <td className="px-4 py-2 text-gray-900">{opt.version}</td>
                    <td className="px-4 py-2 text-gray-900">{opt.count}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleSelectOption(opt)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Plus className="h-5 w-5 text-green-600 mr-2" />
          Create Manual Patch
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Software</label>
            <input
              value={formState.software_name}
              onChange={(e) => setFormState((p) => ({ ...p, software_name: e.target.value }))}
              placeholder="e.g. Google Chrome"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Vendor</label>
            <input
              value={formState.vendor}
              onChange={(e) => setFormState((p) => ({ ...p, vendor: e.target.value }))}
              placeholder="e.g. Google"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Version</label>
            <input
              value={formState.version}
              onChange={(e) => setFormState((p) => ({ ...p, version: e.target.value }))}
              placeholder="e.g. 126.0.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Release Notes (Text)</label>
            <textarea
              rows={6}
              value={formState.notes_text}
              onChange={(e) => setFormState((p) => ({ ...p, notes_text: e.target.value }))}
              placeholder="Describe what's new, fixes, and improvements"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Release Notes (Bullet Points)</label>
            <textarea
              rows={6}
              value={formState.notes_points_raw}
              onChange={(e) => setFormState((p) => ({ ...p, notes_points_raw: e.target.value }))}
              placeholder={"One item per line\n- Security fixes\n- Performance improvements"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center text-sm text-gray-800">
            <Info className="h-4 w-4 mr-2" />
            Provide either text notes or bullet points (or both).
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Submitting
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" /> Save Patch
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatchManagementPanel;


