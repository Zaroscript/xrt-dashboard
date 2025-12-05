interface ExportOptions {
  fileName: string;
  delimiter: ',' | ';';
  includeHeaders: boolean;
}
export interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingTickets: number;
  portfolioProjects: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user?: string;
}

export const exportDashboardData = (
  stats: Stats,
  activities: Activity[],
  options: ExportOptions
) => {
  const { fileName, delimiter, includeHeaders } = options;
  
  const toCSV = (rows: Array<Record<string, string | number | undefined>>): string => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (val: string | number | undefined) => {
      const s = String(val ?? '');
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    
    const joiner = delimiter;
    const lines: string[] = [];
    
    if (includeHeaders) {
      lines.push(headers.join(joiner));
    }
    
    lines.push(
      ...rows.map((row) => 
        headers.map((header) => escape(row[header])).join(joiner)
      )
    );
    
    return lines.join('\n');
  };

  // Let's get the summary stats ready for export
  const summary = [{
    totalUsers: stats.totalUsers || 0,
    activeUsers: stats.activeUsers || 0,
    totalRevenue: stats.totalRevenue || 0,
    activeSubscriptions: stats.activeSubscriptions || 0,
    pendingTickets: stats.pendingTickets || 0,
    portfolioProjects: stats.portfolioProjects || 0,
  }];

  // Format the activity data so it looks nice in the CSV
  const formattedActivities = activities.map(activity => ({
    id: activity.id,
    type: activity.type,
    message: activity.message,
    timestamp: activity.timestamp,
    user: activity.user || 'System'
  }));

  // Build the final CSV with both sections
  const csv = `Summary\n${toCSV(summary)}\n\nRecentActivities\n${toCSV(formattedActivities)}\n`;
  
  // Start the file download for the user
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
