import crypto from 'crypto';

/**
 * Generate a tenant ID from a company name
 * @param {string} companyName - The company name to hash
 * @returns {string} - A 16-character hexadecimal hash
 */
export const generateTenantId = (companyName) => {
  if (!companyName || companyName.trim() === '') {
    return 'default';
  }
  
  // Create SHA-256 hash and take first 16 characters
  return crypto.createHash('sha256')
    .update(companyName.trim().toLowerCase())
    .digest('hex')
    .substring(0, 16);
};

/**
 * Validate if a tenant ID is properly formatted
 * @param {string} tenantId - The tenant ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidTenantId = (tenantId) => {
  return tenantId && 
         typeof tenantId === 'string' && 
         tenantId.length === 16 && 
         /^[a-f0-9]+$/i.test(tenantId);
};
