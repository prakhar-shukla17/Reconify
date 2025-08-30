/**
 * Enhanced download utilities for ITAM system
 * Browser-only download functionality
 */

/**
 * Download data to browser
 * @param {Blob|string} data - Data to download
 * @param {string} filename - Name of the file
 * @param {string} contentType - MIME type of the content
 */
export const downloadToBrowser = (data, filename, contentType = 'text/csv') => {
  let blob;
  
  if (typeof data === 'string') {
    blob = new Blob([data], { type: contentType });
  } else if (data instanceof Blob) {
    blob = data;
  } else {
    console.error('Invalid data type for browser download');
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Enhanced CSV export with browser download
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of header strings
 * @param {string} filename - Base filename for export
 */
export const exportToCSV = (data, headers, filename) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Convert data to CSV format
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header.key] || row[header] || '';
      return escapeCSVValue(value);
    });
  });

  // Combine headers and rows
  const csvContent = [headers.map(h => h.label || h), ...csvRows]
    .map(row => row.join(','))
    .join('\n');

  const fullFilename = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadToBrowser(csvContent, fullFilename, 'text/csv');
};

/**
 * Escape CSV values to prevent injection and formatting issues
 * @param {*} value - Value to escape
 * @returns {string} Escaped CSV value
 */
const escapeCSVValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  
  // If the value contains commas, quotes, or newlines, wrap it in quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape any existing quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

export default {
  downloadToBrowser,
  exportToCSV
};
