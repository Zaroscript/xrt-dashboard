import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: {
    fileName: string;
    delimiter: ',' | ';';
    includeHeaders: boolean;
  }) => void;
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    activeSubscriptions: number;
    pendingTickets: number;
    portfolioProjects: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user?: string;
  }>;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  onExport,
  stats,
  recentActivities = [],
}) => {
  const [fileName, setFileName] = useState(`xrt-tech-report-${new Date().toISOString().slice(0, 10)}`);
  const [delimiter, setDelimiter] = useState<',' | ';'>(',');
  const [includeHeaders, setIncludeHeaders] = useState(true);

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
    if (includeHeaders) lines.push(headers.join(joiner));
    lines.push(
      ...rows.map((r) => headers.map((h) => escape(r[h])).join(joiner))
    );
    return lines.join('\n');
  };

  const handleExport = () => {
    onExport({
      fileName,
      delimiter,
      includeHeaders,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Export dashboard data as a CSV file for further analysis
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Settings */}
          <div>
            <div className="mb-3">
              <h4 className="text-sm font-medium text-foreground">Settings</h4>
              <p className="text-xs text-muted-foreground">
                Choose format and what to include
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="export-fname">File Name</Label>
                <Input
                  id="export-fname"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Delimiter</Label>
                <Select
                  value={delimiter}
                  onValueChange={(v) => setDelimiter(v as ',' | ';')}
                >
                  <SelectTrigger className="glass-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">Comma (,)</SelectItem>
                    <SelectItem value=";">Semicolon (;)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-3 md:col-span-2">
                <Switch
                  id="include-headers"
                  checked={includeHeaders}
                  onCheckedChange={setIncludeHeaders}
                />
                <Label htmlFor="include-headers" className="text-sm">
                  Include headers
                </Label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-foreground">Preview</h4>
                <p className="text-xs text-muted-foreground">
                  A snapshot of what will be exported
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="mr-2">
                  Rows: {1 + Math.min(5, recentActivities.length)}
                </span>
                <span>
                  Size ~{new Blob([toCSV([{ a: 1 }])]).size} bytes
                </span>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto p-2">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Summary</div>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="min-w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left">totalUsers</th>
                        <th className="px-3 py-2 text-left">activeUsers</th>
                        <th className="px-3 py-2 text-left">totalRevenue</th>
                        <th className="px-3 py-2 text-left">activeSubscriptions</th>
                        <th className="px-3 py-2 text-left">pendingTickets</th>
                        <th className="px-3 py-2 text-left">portfolioProjects</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2">{stats.totalUsers}</td>
                        <td className="px-3 py-2">{stats.activeUsers}</td>
                        <td className="px-3 py-2">{stats.totalRevenue}</td>
                        <td className="px-3 py-2">{stats.activeSubscriptions}</td>
                        <td className="px-3 py-2">{stats.pendingTickets}</td>
                        <td className="px-3 py-2">{stats.portfolioProjects}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {recentActivities.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Recent Activities (first 5)
                  </div>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="min-w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left">id</th>
                          <th className="px-3 py-2 text-left">type</th>
                          <th className="px-3 py-2 text-left">message</th>
                          <th className="px-3 py-2 text-left">timestamp</th>
                          <th className="px-3 py-2 text-left">user</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentActivities.slice(0, 5).map((activity) => (
                          <tr key={activity.id}>
                            <td className="px-3 py-2">{activity.id}</td>
                            <td className="px-3 py-2">{activity.type}</td>
                            <td className="px-3 py-2">{activity.message}</td>
                            <td className="px-3 py-2">
                              {format(new Date(activity.timestamp), 'MMM d, yyyy')}
                            </td>
                            <td className="px-3 py-2">
                              {activity.user || 'System'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            className="bg-gold-gradient text-primary-foreground shadow-gold"
          >
            Export Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
