/**
 * Dashboard Lazy Loading Demo
 * 
 * This component demonstrates the comprehensive export functionality
 * for warranty alerts following industry standards.
 */

import { useState } from "react";
import { 
  Download, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Cpu, 
  HardDrive,
  CheckCircle,
  Info
} from "lucide-react";
import {
  exportWarrantyAlertsToCSV,
  exportWarrantyAlertsByRiskLevel,
  exportWarrantyAlertsByComponentType,
  exportWarrantyAlertsByTimePeriod,
  exportWarrantyAlertsBySeverity,
  exportWarrantyAlertsStatsToCSV,
  exportWarrantyAlertsExecutiveSummary,
  exportFilteredWarrantyAlertsToCSV,
} from "../../utils/exportUtils";

export default function DashboardLazyDemo() {
  const [exportLoading, setExportLoading] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  // Sample data for demonstration
  const sampleAlerts = [
    {
      id: "ALERT_001",
      hostname: "DESKTOP-ABC123",
      macAddress: "00:11:22:33:44:55",
      assetModel: "Dell OptiPlex 7090",
      assetSerial: "DL123456789",
      assetLocation: "Floor 3 - Marketing",
      assetDepartment: "Marketing",
      assetOwner: "John Smith",
      component: {
        type: "cpu",
        name: "Intel Core i7-11700",
        model: "Intel Core i7-11700",
        serialNumber: "CPU123456"
      },
      warrantyType: "Extended",
      warrantyProvider: "Dell",
      warrantyStartDate: "2023-01-15",
      expiryDate: "2024-01-15",
      daysUntilExpiry: 5,
      severity: "critical",
      priority: "high",
      status: "Active",
      assignedTo: "IT Support",
      notes: "Critical CPU warranty expiring soon",
      costCenter: "IT Operations",
      replacementCost: "$800",
      vendorContact: "support@dell.com",
      supportLevel: "Premium",
      contractNumber: "CNT-2023-001",
      renewalTerms: "Annual renewal",
      autoRenewal: true,
      maintenanceSchedule: "Quarterly",
      nextMaintenanceDate: "2024-02-15",
      complianceStatus: "Compliant",
      auditTrail: "Last reviewed: 2024-01-10"
    },
    {
      id: "ALERT_002",
      hostname: "LAPTOP-XYZ789",
      macAddress: "AA:BB:CC:DD:EE:FF",
      assetModel: "HP EliteBook 840",
      assetSerial: "HP987654321",
      assetLocation: "Floor 2 - Sales",
      assetDepartment: "Sales",
      assetOwner: "Jane Doe",
      component: {
        type: "storage",
        name: "Samsung SSD 970 EVO",
        model: "Samsung SSD 970 EVO 1TB",
        serialNumber: "SSD789012"
      },
      warrantyType: "Standard",
      warrantyProvider: "HP",
      warrantyStartDate: "2023-03-20",
      expiryDate: "2024-03-20",
      daysUntilExpiry: 25,
      severity: "high",
      priority: "medium",
      status: "Active",
      assignedTo: "IT Support",
      notes: "Storage warranty expiring in 25 days",
      costCenter: "IT Operations",
      replacementCost: "$200",
      vendorContact: "support@hp.com",
      supportLevel: "Standard",
      contractNumber: "CNT-2023-002",
      renewalTerms: "Annual renewal",
      autoRenewal: false,
      maintenanceSchedule: "Semi-annual",
      nextMaintenanceDate: "2024-04-20",
      complianceStatus: "Compliant",
      auditTrail: "Last reviewed: 2024-01-05"
    }
  ];

  const sampleSummary = {
    total: 2,
    critical: 1,
    high: 1,
    medium: 0,
    low: 0
  };

  const handleExport = async (exportType, customData = null) => {
    try {
      setExportLoading(true);
      setLastExport(exportType);
      
      const data = customData || sampleAlerts;
      const summary = customData ? {} : sampleSummary;
      
      let result;
      switch (exportType) {
        case 'all':
          result = exportWarrantyAlertsToCSV(data, summary, 'warranty_alerts_complete');
          break;
        case 'by_risk':
          result = exportWarrantyAlertsByRiskLevel(data, 'Critical', 'warranty_alerts_critical_risk');
          break;
        case 'by_component':
          result = exportWarrantyAlertsByComponentType(data, 'cpu', 'warranty_alerts_cpu');
          break;
        case 'by_time':
          result = exportWarrantyAlertsByTimePeriod(data, '30days', 'warranty_alerts_30_days');
          break;
        case 'by_severity':
          result = exportWarrantyAlertsBySeverity(data, 'critical', 'warranty_alerts_critical');
          break;
        case 'statistics':
          result = exportWarrantyAlertsStatsToCSV(data, summary, 'warranty_alerts_statistics');
          break;
        case 'executive_summary':
          result = exportWarrantyAlertsExecutiveSummary(data, summary, 'warranty_alerts_executive');
          break;
        case 'filtered':
          result = exportFilteredWarrantyAlertsToCSV(data, { severity: 'critical' }, 'warranty_alerts_filtered');
          break;
        default:
          result = exportWarrantyAlertsToCSV(data, summary, 'warranty_alerts');
      }
      
      setTimeout(() => {
        setExportLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Export error:', error);
      setExportLoading(false);
    }
  };

  const exportOptions = [
    {
      id: 'all',
      title: 'Export All Alerts',
      description: 'Complete warranty alerts with all industry-standard fields',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => handleExport('all')
    },
    {
      id: 'by_risk',
      title: 'Export by Risk Level',
      description: 'Critical and high-risk alerts with risk assessment metrics',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => handleExport('by_risk')
    },
    {
      id: 'by_component',
      title: 'Export by Component',
      description: 'Component-specific warranty alerts (CPU, GPU, Memory, etc.)',
      icon: Cpu,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => handleExport('by_component')
    },
    {
      id: 'by_time',
      title: 'Export by Time Period',
      description: 'Alerts expiring in specific timeframes (7, 14, 30, 60, 90 days)',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => handleExport('by_time')
    },
    {
      id: 'by_severity',
      title: 'Export by Severity',
      description: 'Alerts grouped by severity level (Critical, High, Medium, Low)',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      action: () => handleExport('by_severity')
    },
    {
      id: 'statistics',
      title: 'Export Statistics',
      description: 'Comprehensive alert statistics and metrics for reporting',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => handleExport('statistics')
    },
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      description: 'High-level summary for management and stakeholders',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      action: () => handleExport('executive_summary')
    },
    {
      id: 'filtered',
      title: 'Export Filtered Results',
      description: 'Custom filtered alerts with applied criteria',
      icon: HardDrive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      action: () => handleExport('filtered')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Warranty Alerts Export Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Industry-standard export functionality for IT Asset Management following 
            ITIL and ITSM best practices. Compatible with ServiceNow, BMC Remedy, 
            and other enterprise platforms.
          </p>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Industry-Standard Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Comprehensive Fields</h3>
              <p className="text-sm text-gray-600">
                40+ industry-standard fields including risk assessment, business impact, and compliance metrics
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">ITIL Compliant</h3>
              <p className="text-sm text-gray-600">
                Follows ITIL v4 and ITSM best practices for asset lifecycle management
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Risk Assessment</h3>
              <p className="text-sm text-gray-600">
                Automated risk scoring and business impact analysis for each alert
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Executive Reporting</h3>
              <p className="text-sm text-gray-600">
                High-level summaries for management with financial impact estimates
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Compliance Ready</h3>
              <p className="text-sm text-gray-600">
                Built-in compliance tracking and audit trail for regulatory requirements
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <HardDrive className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Multi-Format</h3>
              <p className="text-sm text-gray-600">
                CSV exports compatible with Excel, Google Sheets, and BI tools
              </p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Export Options
            </h2>
            {exportLoading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b border-blue-600"></div>
                <span className="text-sm">Exporting...</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  disabled={exportLoading}
                  className={`${option.bgColor} border border-gray-200 rounded-lg p-4 text-left hover:shadow-md transition-all duration-200 hover:scale-[1.02] group disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`${option.color} p-2 rounded-lg bg-white group-hover:scale-110 transition-transform duration-200`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                        {option.title}
                      </h4>
                      <p className="text-sm text-gray-600 group-hover:text-gray-700">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sample Data */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Sample Data Structure
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">
                Sample warranty alert with industry-standard fields
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600"><strong>Asset Info:</strong> DESKTOP-ABC123 (Dell OptiPlex 7090)</p>
                <p className="text-gray-600"><strong>Component:</strong> Intel Core i7-11700 CPU</p>
                <p className="text-gray-600"><strong>Warranty:</strong> Dell Extended (Expires: Jan 15, 2024)</p>
                <p className="text-gray-600"><strong>Risk Level:</strong> Critical (5 days remaining)</p>
              </div>
              <div>
                <p className="text-gray-600"><strong>Location:</strong> Floor 3 - Marketing</p>
                <p className="text-gray-600"><strong>Owner:</strong> John Smith</p>
                <p className="text-gray-600"><strong>Cost Center:</strong> IT Operations</p>
                <p className="text-gray-600"><strong>Replacement Cost:</strong> $800</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Category
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sample Fields
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry Standard
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">Asset Identification</td>
                  <td className="px-3 py-2 text-sm text-gray-600">Hostname, MAC, Model, Serial, Location</td>
                  <td className="px-3 py-2 text-sm text-green-600">✓ ITIL Standard</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">Warranty Management</td>
                  <td className="px-3 py-2 text-sm text-gray-600">Provider, Type, Start/Expiry Dates, Terms</td>
                  <td className="px-3 py-2 text-sm text-green-600">✓ ITSM Best Practice</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">Risk Assessment</td>
                  <td className="px-3 py-2 text-sm text-gray-600">Risk Level, Score, Action Required, Business Impact</td>
                  <td className="px-3 py-2 text-sm text-green-600">✓ ISO 27001 Compliant</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">Financial Tracking</td>
                  <td className="px-3 py-2 text-sm text-gray-600">Cost Center, Budget, Replacement Cost, Maintenance</td>
                  <td className="px-3 py-2 text-sm text-green-600">✓ ITAM Standard</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">Compliance & Audit</td>
                  <td className="px-3 py-2 text-sm text-gray-600">Status, Compliance, Audit Trail, Contract Info</td>
                  <td className="px-3 py-2 text-sm text-green-600">✓ SOX Ready</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Results */}
        {lastExport && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Export Completed Successfully!
            </h3>
            <p className="text-green-700">
              {lastExport.replace(/_/g, ' ')} export has been downloaded to your device.
            </p>
            <p className="text-sm text-green-600 mt-2">
              The file includes industry-standard fields and is compatible with Excel, Google Sheets, and BI tools.
            </p>
          </div>
        )}

        {/* Documentation */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Implementation Details
          </h2>
          <div className="prose prose-gray max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Key Features
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li><strong>Risk Assessment:</strong> Automated calculation of risk levels based on warranty expiry dates</li>
              <li><strong>Business Impact Analysis:</strong> Quantified impact assessment for each alert</li>
              <li><strong>Compliance Tracking:</strong> Built-in compliance status and audit trail</li>
              <li><strong>Financial Metrics:</strong> Cost center tracking and replacement cost estimation</li>
              <li><strong>Multi-Format Export:</strong> CSV format with proper escaping and encoding</li>
              <li><strong>Filtered Exports:</strong> Export alerts based on current filters and criteria</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Industry Standards Compliance
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li><strong>ITIL v4:</strong> Asset lifecycle management and service management</li>
              <li><strong>ITSM:</strong> IT Service Management best practices</li>
              <li><strong>ISO 27001:</strong> Information security management</li>
              <li><strong>SOX:</strong> Sarbanes-Oxley compliance ready</li>
              <li><strong>ITAM:</strong> IT Asset Management standards</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Use Cases
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Compliance Reporting:</strong> Generate reports for auditors and regulators</li>
              <li><strong>Executive Dashboards:</strong> High-level summaries for management</li>
              <li><strong>Vendor Management:</strong> Track warranty renewals and support contracts</li>
              <li><strong>Budget Planning:</strong> Financial impact analysis for IT planning</li>
              <li><strong>Risk Management:</strong> Identify and prioritize warranty risks</li>
              <li><strong>Asset Lifecycle:</strong> Track assets from procurement to retirement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
