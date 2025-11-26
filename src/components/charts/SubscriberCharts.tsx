import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useSubscriberData } from '@/hooks/useSubscriberData';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const SubscriberCharts = () => {
  const { stats, growth, planDistribution, isLoading, error } = useSubscriberData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass-card">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="glass-card lg:col-span-2">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p>Failed to load subscriber charts. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics from stats
  const churnRate = stats?.churnRate || 0;
  const mrr = stats?.monthlyRecurringRevenue || 0;
  const totalSubscribers = stats?.totalSubscribers || 0;
  const activeSubscribers = stats?.activeSubscribers || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Subscriber Growth Chart */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Subscriber Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={growth}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorSubscribers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis dataKey="name" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A202C', 
                    borderColor: '#2D3748',
                    borderRadius: '0.5rem',
                  }}
                  itemStyle={{ color: '#E2E8F0' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="subscribers" 
                  name="Subscribers" 
                  stroke="#3B82F6" 
                  fillOpacity={1}
                  fill="url(#colorSubscribers)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue ($)" 
                  stroke="#10B981" 
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Plan Distribution */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-500" />
            Plan Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution.map(item => ({ ...item, value: Number(item.value) }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value}`, name]}
                  contentStyle={{ 
                    backgroundColor: '#1A202C', 
                    borderColor: '#2D3748',
                    borderRadius: '0.5rem',
                  }}
                  itemStyle={{ color: '#E2E8F0' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Recurring Revenue */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-500" />
            Monthly Recurring Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={growth}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis dataKey="name" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A202C', 
                    borderColor: '#2D3748',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  itemStyle={{ color: '#E2E8F0' }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Churn Rate */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Activity className="w-5 h-5 mr-2 text-orange-500" />
            Churn Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="text-center">
                <p className="text-4xl font-bold text-orange-500">{churnRate}%</p>
                <p className="text-muted-foreground text-sm mt-2">Monthly Churn Rate</p>
              </div>
              <div className="mt-4 text-center">
                <p className="text-2xl font-semibold text-blue-500">{activeSubscribers}</p>
                <p className="text-muted-foreground text-sm">Active Subscribers</p>
              </div>
              <div className="mt-4 text-center">
                <p className="text-2xl font-semibold text-green-500">${mrr}</p>
                <p className="text-muted-foreground text-sm">Monthly Recurring Revenue</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriberCharts;
