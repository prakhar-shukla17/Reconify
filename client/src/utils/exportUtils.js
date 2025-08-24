/**
 * Utility functions for exporting data to CSV format
 * Following industry standards for IT Service Management (ITSM) and Help Desk systems
 */

/**
 * Convert a date string to a readable format
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Calculate time-based metrics for tickets
 */
const calculateTimeMetrics = (ticket) => {
  const created = new Date(ticket.created_at);
  const updated = new Date(ticket.updated_at);
  const resolved = ticket.resolved_at ? new Date(ticket.resolved_at) : null;
  const now = new Date();

  // Time to resolution (in hours)
  const timeToResolution = resolved ? 
    Math.round((resolved - created) / (1000 * 60 * 60)) : null;

  // Time since last update (in hours)
  const timeSinceUpdate = Math.round((now - updated) / (1000 * 60 * 60));

  // Age of ticket (in days)
  const ticketAge = Math.round((now - created) / (1000 * 60 * 60 * 24));

  // SLA compliance (assuming 24-hour SLA for critical, 48 for high, 72 for medium, 168 for low)
  const getSLALimit = (priority) => {
    switch (priority) {
      case 'Critical': return 24;
      case 'High': return 48;
      case 'Medium': return 72;
      case 'Low': return 168;
      default: return 72;
    }
  };

  const slaLimit = getSLALimit(ticket.priority);
  const isSLACompliant = resolved ? timeToResolution <= slaLimit : timeSinceUpdate <= slaLimit;

  return {
    timeToResolution: timeToResolution ? `${timeToResolution}h` : 'N/A',
    timeSinceUpdate: `${timeSinceUpdate}h`,
    ticketAge: `${ticketAge}d`,
    slaLimit: `${slaLimit}h`,
    isSLACompliant: isSLACompliant ? 'Yes' : 'No'
  };
};

/**
 * Escape CSV values to prevent injection and formatting issues
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

/**
 * Export tickets data to CSV format with industry-standard fields
 */
export const exportTicketsToCSV = (tickets, filename = 'tickets_report') => {
  if (!tickets || tickets.length === 0) {
    console.warn('No tickets data to export');
    return;
  }

  // Industry-standard CSV headers following ITSM best practices
  const headers = [
    'Ticket ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Category',
    'Subcategory',
    'Created By',
    'Created Date',
    'Assigned To',
    'Asset ID',
    'Asset Hostname',
    'Asset Model',
    'Asset Location',
    'Resolution',
    'Resolution Notes',
    'Resolved By',
    'Resolved Date',
    'Last Updated',
    'Time to Resolution (Hours)',
    'Time Since Update (Hours)',
    'Ticket Age (Days)',
    'SLA Limit (Hours)',
    'SLA Compliant',
    'Business Impact',
    'Escalation Level',
    'Tags',
    'Related Tickets',
    'Customer Satisfaction',
    'Work Notes',
    'Department',
    'Cost Center'
  ];

  // Convert tickets to CSV rows with enhanced data
  const csvRows = tickets.map(ticket => {
    const timeMetrics = calculateTimeMetrics(ticket);
    
    return [
      escapeCSVValue(ticket.ticket_id || 'N/A'),
      escapeCSVValue(ticket.title || 'N/A'),
      escapeCSVValue(ticket.description || 'N/A'),
      escapeCSVValue(ticket.status || 'N/A'),
      escapeCSVValue(ticket.priority || 'N/A'),
      escapeCSVValue(ticket.category || 'N/A'),
      escapeCSVValue(ticket.subcategory || 'N/A'),
      escapeCSVValue(ticket.created_by_name || ticket.created_by?.username || 'N/A'),
      escapeCSVValue(formatDate(ticket.created_at)),
      escapeCSVValue(ticket.assigned_to?.username || 'Unassigned'),
      escapeCSVValue(ticket.asset_id || 'N/A'),
      escapeCSVValue(ticket.asset_hostname || 'N/A'),
      escapeCSVValue(ticket.asset_model || 'N/A'),
      escapeCSVValue(ticket.asset_location || 'N/A'),
      escapeCSVValue(ticket.resolution || 'N/A'),
      escapeCSVValue(ticket.resolution_notes || 'N/A'),
      escapeCSVValue(ticket.resolved_by?.username || 'N/A'),
      escapeCSVValue(formatDate(ticket.resolved_at)),
      escapeCSVValue(formatDate(ticket.updated_at)),
      escapeCSVValue(timeMetrics.timeToResolution),
      escapeCSVValue(timeMetrics.timeSinceUpdate),
      escapeCSVValue(timeMetrics.ticketAge),
      escapeCSVValue(timeMetrics.slaLimit),
      escapeCSVValue(timeMetrics.isSLACompliant),
      escapeCSVValue(ticket.business_impact || 'Medium'),
      escapeCSVValue(ticket.escalation_level || 'None'),
      escapeCSVValue(ticket.tags?.join(', ') || 'N/A'),
      escapeCSVValue(ticket.related_tickets?.join(', ') || 'N/A'),
      escapeCSVValue(ticket.customer_satisfaction || 'N/A'),
      escapeCSVValue(ticket.work_notes || 'N/A'),
      escapeCSVValue(ticket.department || 'IT'),
      escapeCSVValue(ticket.cost_center || 'N/A')
    ];
  });

  // Combine headers and rows
  const csvContent = [headers, ...csvRows]
    .map(row => row.join(','))
    .join('\n');

  // Create and download the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback for older browsers
    const csvData = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    window.open(csvData);
  }
};

/**
 * Export tickets resolved today
 */
export const exportTicketsResolvedToday = (tickets, filename = 'tickets_resolved_today') => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const resolvedToday = tickets.filter(ticket => {
    if (!ticket.resolved_at) return false;
    const resolvedDate = new Date(ticket.resolved_at);
    return resolvedDate >= startOfDay && resolvedDate <= endOfDay;
  });

  const todayFilename = `${filename}_${today.toISOString().split('T')[0]}`;
  exportTicketsToCSV(resolvedToday, todayFilename);
  return resolvedToday.length;
};

/**
 * Export tickets created today
 */
export const exportTicketsCreatedToday = (tickets, filename = 'tickets_created_today') => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const createdToday = tickets.filter(ticket => {
    const createdDate = new Date(ticket.created_at);
    return createdDate >= startOfDay && createdDate <= endOfDay;
  });

  const todayFilename = `${filename}_${today.toISOString().split('T')[0]}`;
  exportTicketsToCSV(createdToday, todayFilename);
  return createdToday.length;
};

/**
 * Export tickets by time period (last 24h, 7 days, 30 days, etc.)
 */
export const exportTicketsByTimePeriod = (tickets, period = '7d', filename = 'tickets_by_period') => {
  const now = new Date();
  let startDate;

  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      break;
    case '7d':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case '30d':
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      break;
    case '90d':
      startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      break;
    default:
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  }

  const filteredTickets = tickets.filter(ticket => {
    const ticketDate = new Date(ticket.created_at);
    return ticketDate >= startDate;
  });

  const periodFilename = `${filename}_${period}_${now.toISOString().split('T')[0]}`;
  exportTicketsToCSV(filteredTickets, periodFilename);
  return filteredTickets.length;
};

/**
 * Export tickets by SLA compliance
 */
export const exportTicketsBySLACompliance = (tickets, compliance = 'compliant', filename = 'tickets_by_sla') => {
  const filteredTickets = tickets.filter(ticket => {
    const timeMetrics = calculateTimeMetrics(ticket);
    if (compliance === 'compliant') {
      return timeMetrics.isSLACompliant === 'Yes';
    } else {
      return timeMetrics.isSLACompliant === 'No';
    }
  });

  const slaFilename = `${filename}_${compliance}_${new Date().toISOString().split('T')[0]}`;
  exportTicketsToCSV(filteredTickets, slaFilename);
  return filteredTickets.length;
};

/**
 * Export tickets by priority with SLA analysis
 */
export const exportTicketsByPriorityWithSLA = (tickets, priority, filename = 'tickets_by_priority_sla') => {
  const filteredTickets = tickets.filter(ticket => ticket.priority === priority);
  
  // Add SLA analysis to the filename
  const slaFilename = `${filename}_${priority}_SLA_${new Date().toISOString().split('T')[0]}`;
  exportTicketsToCSV(filteredTickets, slaFilename);
  return filteredTickets.length;
};

/**
 * Export tickets with advanced filtering options
 */
export const exportFilteredTicketsToCSV = (tickets, filters = {}, filename = 'filtered_tickets') => {
  let filteredTickets = [...tickets];
  
  // Apply filters if provided
  if (filters.status && filters.status !== 'all') {
    filteredTickets = filteredTickets.filter(ticket => ticket.status === filters.status);
  }
  
  if (filters.priority && filters.priority !== 'all') {
    filteredTickets = filteredTickets.filter(ticket => ticket.priority === filters.priority);
  }
  
  if (filters.category && filters.category !== 'all') {
    filteredTickets = filteredTickets.filter(ticket => ticket.category === filters.category);
  }

  // Date range filtering
  if (filters.startDate) {
    filteredTickets = filteredTickets.filter(ticket => 
      new Date(ticket.created_at) >= new Date(filters.startDate)
    );
  }
  
  if (filters.endDate) {
    filteredTickets = filteredTickets.filter(ticket => 
      new Date(ticket.created_at) <= new Date(filters.endDate)
    );
  }

  // Search term filtering
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket =>
      ticket.title?.toLowerCase().includes(searchLower) ||
      ticket.description?.toLowerCase().includes(searchLower) ||
      ticket.ticket_id?.toLowerCase().includes(searchLower) ||
      ticket.created_by_name?.toLowerCase().includes(searchLower) ||
      ticket.asset_hostname?.toLowerCase().includes(searchLower)
    );
  }

  // SLA compliance filtering
  if (filters.slaCompliance) {
    filteredTickets = filteredTickets.filter(ticket => {
      const timeMetrics = calculateTimeMetrics(ticket);
      return timeMetrics.isSLACompliant === filters.slaCompliance;
    });
  }

  // Create filename with filter info
  let exportFilename = filename;
  if (filters.status && filters.status !== 'all') {
    exportFilename += `_${filters.status}`;
  }
  if (filters.priority && filters.priority !== 'all') {
    exportFilename += `_${filters.priority}`;
  }
  if (filters.category && filters.category !== 'all') {
    exportFilename += `_${filters.category}`;
  }
  if (filters.startDate) {
    exportFilename += `_from_${filters.startDate}`;
  }
  if (filters.endDate) {
    exportFilename += `_to_${filters.endDate}`;
  }
  if (filters.slaCompliance) {
    exportFilename += `_SLA_${filters.slaCompliance}`;
  }

  exportTicketsToCSV(filteredTickets, exportFilename);
};

/**
 * Export tickets by date range
 */
export const exportTicketsByDateRange = (tickets, startDate, endDate, filename = 'tickets_by_date') => {
  const filteredTickets = tickets.filter(ticket => {
    const ticketDate = new Date(ticket.created_at);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return ticketDate >= start && ticketDate <= end;
  });

  const dateRangeFilename = `${filename}_${startDate}_to_${endDate}`;
  exportTicketsToCSV(filteredTickets, dateRangeFilename);
};

/**
 * Export tickets by status
 */
export const exportTicketsByStatus = (tickets, status, filename = 'tickets_by_status') => {
  const filteredTickets = tickets.filter(ticket => ticket.status === status);
  const statusFilename = `${filename}_${status.toLowerCase()}`;
  exportTicketsToCSV(filteredTickets, statusFilename);
};

/**
 * Export tickets by priority
 */
export const exportTicketsByPriority = (tickets, priority, filename = 'tickets_by_priority') => {
  const filteredTickets = tickets.filter(ticket => ticket.priority === priority);
  const priorityFilename = `${filename}_${priority.toLowerCase()}`;
  exportTicketsToCSV(filteredTickets, priorityFilename);
};

/**
 * Export tickets by category
 */
export const exportTicketsByCategory = (tickets, category, filename = 'tickets_by_category') => {
  const filteredTickets = tickets.filter(ticket => ticket.category === category);
  const categoryFilename = `${filename}_${category.toLowerCase().replace(/\s+/g, '_')}`;
  exportTicketsToCSV(filteredTickets, categoryFilename);
};

/**
 * Export tickets by assigned user
 */
export const exportTicketsByAssignee = (tickets, assigneeUsername, filename = 'tickets_by_assignee') => {
  const filteredTickets = tickets.filter(ticket => 
    ticket.assigned_to?.username === assigneeUsername
  );
  const assigneeFilename = `${filename}_${assigneeUsername}`;
  exportTicketsToCSV(filteredTickets, assigneeFilename);
};

/**
 * Export tickets by creator
 */
export const exportTicketsByCreator = (tickets, creatorUsername, filename = 'tickets_by_creator') => {
  const filteredTickets = tickets.filter(ticket => 
    ticket.created_by_name === creatorUsername || 
    ticket.created_by?.username === creatorUsername
  );
  const creatorFilename = `${filename}_${creatorUsername}`;
  exportTicketsToCSV(filteredTickets, creatorFilename);
};

/**
 * Export ticket statistics summary to CSV with industry metrics
 */
export const exportTicketStatsToCSV = (tickets, filename = 'ticket_statistics') => {
  if (!tickets || tickets.length === 0) {
    console.warn('No tickets data to export statistics');
    return;
  }

  // Calculate comprehensive statistics
  const total = tickets.length;
  const open = tickets.filter(t => t.status === 'Open').length;
  const inProgress = tickets.filter(t => t.status === 'In Progress').length;
  const resolved = tickets.filter(t => t.status === 'Resolved').length;
  const closed = tickets.filter(t => t.status === 'Closed').length;
  const rejected = tickets.filter(t => t.status === 'Rejected').length;

  const critical = tickets.filter(t => t.priority === 'Critical').length;
  const high = tickets.filter(t => t.priority === 'High').length;
  const medium = tickets.filter(t => t.priority === 'Medium').length;
  const low = tickets.filter(t => t.priority === 'Low').length;

  // SLA compliance statistics
  const slaCompliant = tickets.filter(t => {
    const timeMetrics = calculateTimeMetrics(t);
    return timeMetrics.isSLACompliant === 'Yes';
  }).length;

  const slaNonCompliant = total - slaCompliant;
  const slaComplianceRate = ((slaCompliant / total) * 100).toFixed(1);

  // Time-based statistics
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
  const avgResolutionTime = resolvedTickets.length > 0 ? 
    resolvedTickets.reduce((sum, t) => {
      const created = new Date(t.created_at);
      const resolved = new Date(t.resolved_at || t.updated_at);
      return sum + (resolved - created);
    }, 0) / resolvedTickets.length : 0;

  const avgResolutionHours = Math.round(avgResolutionTime / (1000 * 60 * 60));

  // Group by category
  const categoryStats = {};
  tickets.forEach(ticket => {
    const category = ticket.category || 'Uncategorized';
    categoryStats[category] = (categoryStats[category] || 0) + 1;
  });

  // Create CSV content for comprehensive statistics
  const statsHeaders = ['Metric', 'Count', 'Percentage', 'Details'];
  const statsRows = [
    ['Total Tickets', total, '100%', 'All tickets in the system'],
    ['Open Tickets', open, `${((open / total) * 100).toFixed(1)}%`, 'Awaiting resolution'],
    ['In Progress', inProgress, `${((inProgress / total) * 100).toFixed(1)}%`, 'Currently being worked on'],
    ['Resolved', resolved, `${((resolved / total) * 100).toFixed(1)}%`, 'Successfully resolved'],
    ['Closed', closed, `${((closed / total) * 100).toFixed(1)}%`, 'Archived tickets'],
    ['Rejected', rejected, `${((rejected / total) * 100).toFixed(1)}%`, 'Declined tickets'],
    ['', '', '', ''],
    ['Critical Priority', critical, `${((critical / total) * 100).toFixed(1)}%`, 'Highest priority'],
    ['High Priority', high, `${((high / total) * 100).toFixed(1)}%`, 'High priority'],
    ['Medium Priority', medium, `${((medium / total) * 100).toFixed(1)}%`, 'Medium priority'],
    ['Low Priority', low, `${((low / total) * 100).toFixed(1)}%`, 'Lowest priority'],
    ['', '', '', ''],
    ['SLA Compliant', slaCompliant, `${slaComplianceRate}%`, 'Within SLA limits'],
    ['SLA Non-Compliant', slaNonCompliant, `${((slaNonCompliant / total) * 100).toFixed(1)}%`, 'Exceeded SLA limits'],
    ['Average Resolution Time', avgResolutionHours, 'hours', 'Mean time to resolve'],
    ['', '', '', ''],
    ...Object.entries(categoryStats).map(([category, count]) => [
      `${category} Category`,
      count,
      `${((count / total) * 100).toFixed(1)}%`,
      'Tickets by category'
    ])
  ];

  const csvContent = [statsHeaders, ...statsRows]
    .map(row => row.map(cell => escapeCSVValue(cell)).join(','))
    .join('\n');

  // Create and download the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback for older browsers
    const csvData = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    window.open(csvData);
  }
};
