"use client";

import { useState } from "react";
  import {
    Package,
    Play,
    Monitor,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    Search,
    Filter,
    Wifi,
    Info,
    Activity,
  } from "lucide-react";

const SoftwareDetails = ({ software, onBack }) => {
  const [expandedSections, setExpandedSections] = useState({
    system: true,
    installed_software: true,
    startup_programs: false,
    browser_extensions: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const InfoCard = ({ title, children, icon: Icon, sectionKey, count = 0 }) => (
    <div className="bg-white rounded-lg shadow-sm border">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {count > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-6 pb-4">{children}</div>
      )}
    </div>
  );

  const DataRow = ({ label, value, className = "" }) => (
    <div className={`flex justify-between py-2 ${className}`}>
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium text-gray-900">{value || "Unknown"}</span>
    </div>
  );

  const SoftwareTable = ({ software, type = "software" }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span>SOFTWARE NAME</span>
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              VERSION
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              VENDOR
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              INSTALL DATE
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SIZE
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {software.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {item.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {item.version || "Unknown"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {item.vendor || "Unknown"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {item.install_date || "Unknown"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {item.size || "Unknown"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const filteredInstalledSoftware = software.installed_software?.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.version?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];



  const filteredStartupPrograms = software.startup_programs?.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.command?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getSystemStats = () => {
    return {
      totalSoftware: software.installed_software?.length || 0,
      totalStartupPrograms: software.startup_programs?.length || 0,
      totalBrowserExtensions: software.browser_extensions?.length || 0,
      totalItems: software.scan_metadata?.total_software_count || 0,
    };
  };

  const stats = getSystemStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={onBack}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Panel
            </button>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {software.system?.hostname || "Unknown System"}
                  </h1>
                  <p className="text-green-600 font-medium">
                    {software.system?.platform} Software Inventory
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">MAC Address</p>
                <p className="text-sm font-mono text-gray-700">
                  {software.system?.mac_address || "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.totalSoftware}
                  </p>
                  <p className="text-sm text-blue-700">Installed Packages</p>
                </div>
              </div>
            </div>



            <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.totalStartupPrograms}
                  </p>
                  <p className="text-sm text-purple-700">Startup Programs</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.totalItems}
                  </p>
                  <p className="text-sm text-orange-700">Total Items</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search software, services, or programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                  >
                                       <option value="all">All Items</option>
                   <option value="software">Applications Only</option>
                   <option value="startup">Startup Programs Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            {/* System Information */}
            <InfoCard title="System Information" icon={Info} sectionKey="system">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <DataRow label="Hostname" value={software.system?.hostname} />
                  <DataRow label="Platform" value={software.system?.platform} />
                  <DataRow
                    label="Platform Version"
                    value={software.system?.platform_version}
                  />
                  <DataRow
                    label="Architecture"
                    value={software.system?.architecture}
                  />
                </div>
                <div className="space-y-2">
                  <DataRow
                    label="MAC Address"
                    value={software.system?.mac_address}
                  />
                                     <DataRow
                     label="Scan Timestamp"
                     value={
                       software.system?.scan_timestamp
                         ? new Date(software.system.scan_timestamp).toLocaleString()
                         : "Unknown"
                     }
                   />
                  <DataRow
                    label="Python Version"
                    value={software.system?.python_version}
                  />
                  <DataRow
                    label="Last Updated"
                    value={
                      software.scan_metadata?.last_updated
                        ? new Date(
                            software.scan_metadata.last_updated
                          ).toLocaleString()
                        : "Unknown"
                    }
                  />
                </div>
              </div>
            </InfoCard>

            {/* Installed Software */}
            <InfoCard
              title="Installed Software"
              icon={Package}
              sectionKey="installed_software"
              count={stats.totalSoftware}
            >
              {stats.totalSoftware === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No installed applications found
                </div>
              ) : (
                <SoftwareTable software={filteredInstalledSoftware} />
              )}
            </InfoCard>



            {/* Startup Programs */}
            <InfoCard
              title="Startup Programs"
              icon={Play}
              sectionKey="startup_programs"
              count={stats.totalStartupPrograms}
            >
              {stats.totalStartupPrograms === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No startup programs found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStartupPrograms.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            {item.command && (
                              <div className="truncate">Command: {item.command}</div>
                            )}
                            {item.location && (
                              <div className="truncate">Location: {item.location}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </InfoCard>



            {/* Browser Extensions */}
            {stats.totalBrowserExtensions > 0 && (
              <InfoCard
                title="Browser Extensions"
                icon={Wifi}
                sectionKey="browser_extensions"
                count={stats.totalBrowserExtensions}
              >
                <div className="space-y-2">
                  {software.browser_extensions?.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            {item.version && <div>Version: {item.version}</div>}
                            {item.browser && <div>Browser: {item.browser}</div>}
                            <div className="flex items-center space-x-2">
                              <span>Status:</span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  item.enabled
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.enabled ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}

            {/* Scan Metadata */}
            <InfoCard title="Scan Information" icon={Activity} sectionKey="scan_metadata">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <DataRow
                    label="Total Software Count"
                    value={software.scan_metadata?.total_software_count}
                  />
                  <DataRow
                    label="Scan Duration"
                    value={software.scan_metadata?.scan_duration}
                  />
                </div>
                <div className="space-y-2">
                  <DataRow
                    label="Scanner Version"
                    value={software.scan_metadata?.scanner_version}
                  />
                  <DataRow
                    label="Last Updated"
                    value={
                      software.scan_metadata?.last_updated
                        ? new Date(
                            software.scan_metadata.last_updated
                          ).toLocaleString()
                        : "Unknown"
                    }
                  />
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoftwareDetails;
