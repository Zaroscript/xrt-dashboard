import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueData {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  isLoading?: boolean;
  isAdmin?: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, isLoading = false, isAdmin = true }) => {
  // Process the data to ensure proper formatting and find the first non-zero revenue entry
  const processedData = (data || []).map(item => ({
    ...item,
    revenue: item?.revenue || 0
  }));

  // Find the index of the first non-zero revenue entry
  const firstNonZeroIndex = processedData.findIndex(item => item.revenue > 0);
  
  // If all entries are zero or no data, use the original data
  // Otherwise, slice the array from the first non-zero entry
  const chartData = firstNonZeroIndex === -1 
    ? processedData 
    : processedData.slice(firstNonZeroIndex);

  if (!isAdmin) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <p>Admin dashboard data is only available to administrators</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="h-80 flex items-center justify-center">
          <p>No revenue data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>Revenue</span>
        </CardTitle>
        <CardDescription>Monthly revenue overview</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `$${value}`}
              domain={[0, 'dataMax']}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
