# CSV Import Feature for ITAM

## Overview
The CSV import feature allows administrators to bulk import assets from a CSV file into the IT Asset Management system. This feature is designed to work with the specific format of the "2025 UPCB_IT Asset Inventory Register KRISHN PAL.csv" file.

## Features

### 🔄 **Bulk Import**
- Import multiple assets at once from CSV files
- Automatic validation and error handling
- Progress tracking and detailed results

### 📊 **Data Mapping**
- **Asset Name**: Combined from "Asset Name" + "Model" columns
- **Serial Number**: Extracted from "Serial Number" column
- **Branch**: Extracted from "Branch" column
- **MAC Address**: Uses IP address if available, otherwise generates random MAC
- **Vendor**: Uses "Vendor" or "Make" column
- **Status**: Uses "Status" column (defaults to "Active")
- **Category**: Uses "Asset Category" column

### 🛡️ **Validation & Safety**
- Duplicate MAC address detection
- File format validation (CSV only)
- File size limits (10MB max)
- Admin-only access
- Detailed error reporting

## Usage

### For Administrators

1. **Access the Feature**
   - Login as an admin user
   - Navigate to Admin Dashboard
   - Go to "Assets Management" tab
   - Click the "Import CSV" button

2. **Upload CSV File**
   - Click "Choose File" to select your CSV file
   - Preview the file content (first 6 lines)
   - Review import instructions

3. **Import Process**
   - Click "Import Assets" to start the process
   - Monitor progress and results
   - Review any errors or warnings

### CSV File Format

The system expects a CSV file with the following structure:

```csv
,,,,,,,,,,,,,,,,,,,,,,
Asset Inventory Register,,,,,,,,,,,,,,,,,,,,,,
Asset Inventory Register,,,,,,,,,,,,,,,,,,,,,,
Sr. No.,Branch,Asset ID,Asset Name,Asset Category,Make,Model,IP,Serial Number,Criticality of Asset,Sensitivity,Software/Services Installed,Vendor,Allocation Date,Branch,Warranty Expiry,Purchase Value,Status,Handled by/Key Personnel,Approved By,,Color Definition,
1,Mathura ,Mathura/DSTP/01,Desktop,CBS System,Dell,OptiPlex 3090,192.168.77.6,G4FX0N,High,Sensitive,CBS,,,Mathura,,,Active,"Mr. Abhilash Pal Cashier",,,,System working but not in use / Extra
```

### Required Columns
- **Sr. No.**: Row number (optional)
- **Branch**: Location/branch information
- **Asset ID**: Unique asset identifier
- **Asset Name**: Type of asset (Desktop, Printer, etc.)
- **Asset Category**: Category classification
- **Make**: Manufacturer
- **Model**: Model number
- **IP**: IP address (used as MAC if available)
- **Serial Number**: Hardware serial number
- **Vendor**: Vendor information
- **Status**: Asset status (Active/Inactive)

## Technical Details

### Backend Implementation
- **Endpoint**: `POST /api/hardware/import/csv`
- **Authentication**: Admin token required
- **File Processing**: Multer middleware for file uploads
- **Data Processing**: Custom CSV parser with quote handling
- **Database**: MongoDB with Hardware model

### Frontend Implementation
- **Component**: `CsvImportModal.js`
- **File Validation**: Client-side CSV validation
- **Progress Tracking**: Real-time import status
- **Error Handling**: Detailed error display

### Generated Data Structure
```javascript
{
  _id: "MAC_ADDRESS",
  system: {
    hostname: "Asset ID or generated name",
    mac_address: "IP or random MAC",
    platform: "Unknown",
    // ... other system fields
  },
  asset_info: {
    model: "Model from CSV",
    serial_number: "Serial from CSV",
    location: "Branch from CSV",
    vendor: "Vendor/Make from CSV",
    status: "Status from CSV",
    entry_type: "csv_import",
    created_manually_at: "Current timestamp",
    created_manually_by: "Admin username"
  },
  // ... other hardware sections with default values
}
```

## Error Handling

### Common Errors
1. **Duplicate MAC Address**: Asset already exists in system
2. **Invalid File Format**: Non-CSV files rejected
3. **File Too Large**: Files over 10MB rejected
4. **Missing Required Data**: Empty asset names or branches skipped
5. **Database Errors**: Connection or validation failures

### Error Reporting
- Row-by-row error tracking
- Detailed error messages
- Success/failure counts
- Import summary

## Security Considerations

- **Admin Only**: Feature restricted to admin users
- **File Validation**: Strict file type checking
- **Size Limits**: Prevents large file attacks
- **Input Sanitization**: CSV data cleaned and validated
- **Audit Trail**: Import actions logged with admin details

## Sample Usage

1. **Prepare CSV File**
   - Ensure proper column headers
   - Fill required fields (Branch, Asset Name, etc.)
   - Save as CSV format

2. **Import Process**
   ```
   Admin Dashboard → Assets Management → Import CSV → Choose File → Import Assets
   ```

3. **Review Results**
   - Check success count
   - Review any errors
   - Verify imported assets in asset list

## Troubleshooting

### Import Fails
- Check file format (must be CSV)
- Verify file size (under 10MB)
- Ensure admin permissions
- Check server logs for errors

### Missing Assets
- Verify CSV structure matches expected format
- Check for empty required fields
- Review error messages for specific issues

### Duplicate Errors
- Assets with existing MAC addresses will be skipped
- Use different MAC addresses or update existing assets manually

## Future Enhancements

- **Template Download**: Provide CSV template for users
- **Batch Updates**: Update existing assets from CSV
- **Advanced Mapping**: Custom field mapping options
- **Scheduled Imports**: Automated import scheduling
- **Import History**: Track and review past imports
