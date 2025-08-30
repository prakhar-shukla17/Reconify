# MAC Address Editing Feature

## Overview

The ITAM system now includes MAC address editing capabilities directly in the asset information view. This feature allows administrators to modify MAC addresses for individual assets after they have been imported or scanned.

## Features

### MAC Address Editor in Asset Details

When viewing asset details, administrators can now:

- **Inline Editing**: Edit MAC addresses directly in the asset information view
- **Real-time Validation**: MAC address format is validated as you type
- **Visual Feedback**: Clear indication when editing and after successful updates
- **Duplicate Prevention**: System prevents duplicate MAC addresses within the same tenant
- **Keyboard Support**: Press Enter to save, Escape to cancel

## How to Use

### Editing MAC Address in Asset Details

1. **Navigate to Asset Details**: Go to any hardware asset's detailed view
2. **Locate MAC Address**: Find the MAC address in either:
   - The header section (next to platform information)
   - The System Information section
3. **Edit MAC Address**: 
   - Click the edit icon (✏️) next to the MAC address
   - Enter the new MAC address in format: `XX:XX:XX:XX:XX:XX`
   - Press Enter or click the save icon (💾) to save
   - Click the X icon to cancel

## MAC Address Format

All MAC addresses must follow the standard format:
- **Format**: `XX:XX:XX:XX:XX:XX`
- **Characters**: Hexadecimal (0-9, A-F)
- **Separators**: Colons (`:`) or hyphens (`-`)
- **Case**: Automatically converted to uppercase

### Valid Examples:
- `00:1B:44:11:3A:B7`
- `00-1B-44-11-3A-B7`
- `a1:b2:c3:d4:e5:f6` (converted to `A1:B2:C3:D4:E5:F6`)

### Invalid Examples:
- `00:1B:44:11:3A:B` (too short)
- `00:1B:44:11:3A:B7:8` (too long)
- `00:1B:44:11:3A:G7` (invalid character 'G')

## Technical Implementation

### Frontend Components

1. **MacAddressEditor.js**: Reusable component for inline MAC editing
2. **HardwareDetails.js**: Enhanced with MAC address editing in two locations:
   - Header section (next to platform info)
   - System Information section

### Backend Endpoints

1. **PUT /api/hardware/:id/mac-address**: Endpoint for updating MAC addresses

### Database Changes

- MAC addresses are stored as the primary key (`_id`) in the hardware collection
- Updates maintain referential integrity
- Tenant isolation ensures MAC addresses are unique per organization

## Security Features

- **Admin Only**: MAC address editing is restricted to administrators
- **Tenant Isolation**: Users can only edit MAC addresses within their tenant
- **Validation**: Server-side validation prevents invalid MAC addresses
- **Duplicate Prevention**: System prevents duplicate MAC addresses
- **Audit Trail**: Changes are logged with user and timestamp information

## Error Handling

The system provides clear error messages for:

- **Invalid Format**: "Invalid MAC address format. Use format: XX:XX:XX:XX:XX:XX"
- **Duplicate MAC**: "Asset with this MAC address already exists"
- **Authentication**: "Authentication required"
- **Network Issues**: "Network error: [details]"

## User Experience

### Visual Indicators

- **Edit Mode**: Input field appears with save/cancel buttons
- **Success**: Green checkmark and toast notification
- **Error**: Red error message displayed inline
- **Loading**: Disabled buttons during update process

### Keyboard Shortcuts

- **Enter**: Save changes
- **Escape**: Cancel editing
- **Tab**: Navigate between fields

## Best Practices

1. **Verify Before Editing**: Double-check the new MAC address before saving
2. **Use Consistent Format**: Stick to one format (colons or hyphens) for consistency
3. **Document Changes**: Keep records of MAC address changes for audit purposes
4. **Test After Changes**: Verify that the asset is still properly linked after MAC address changes
5. **Backup Data**: Always backup your data before making changes

## Troubleshooting

### Common Issues

1. **MAC Address Not Saving**: Check if the format is correct and no duplicates exist
2. **Permission Denied**: Ensure you have admin privileges
3. **Network Errors**: Check your connection and try again
4. **Duplicate Error**: Verify the new MAC address doesn't already exist in your tenant

### Support

If you encounter issues with MAC address editing:

1. Check the browser console for error messages
2. Verify you have proper permissions
3. Ensure the MAC address format is correct
4. Contact system administrator if problems persist

## Future Enhancements

Planned improvements include:

- **Bulk MAC Address Updates**: Edit multiple assets at once
- **MAC Address Templates**: Predefined MAC address patterns
- **MAC Address History**: Track all changes to MAC addresses over time
- **Advanced Validation**: Check for reserved or special MAC address ranges
- **Import/Export MAC Mappings**: Save and reuse MAC address assignments
