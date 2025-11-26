import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, DollarSign, CreditCard, MessageSquare, Star } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    totalClients: number;
    totalRevenue: number;
    totalTickets: number;
    activeUsers?: number;
    activeSubscriptions?: number;
    pendingTickets?: number;
    portfolioProjects?: number;
  };
  isAdmin?: boolean;
  pendingUsersCount?: number;
  pendingServiceRequestsCount?: number;
  pendingPlanRequestsCount?: number;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon: Icon, color }) => (
  <Card className="glass-card">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  isAdmin = false,
  pendingUsersCount = 0,
  pendingServiceRequestsCount = 0,
  pendingPlanRequestsCount = 0,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  const statsConfig = [
    {
      title: "Total Users",
      value: stats.totalUsers?.toLocaleString() || '0',
      description: "Registered users",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Total Clients",
      value: stats.totalClients?.toLocaleString() || '0',
      description: "Total clients",
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Total Revenue",
      value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
      description: "All-time revenue",
      icon: DollarSign,
      color: "text-purple-500",
    },
    {
      title: "Total Tickets",
      value: (stats.totalTickets || 0).toLocaleString(),
      description: "All support tickets",
      icon: MessageSquare,
      color: "text-yellow-500",
    },
    {
      title: "Active Users",
      value: stats.activeUsers?.toLocaleString() || '0',
      description: "Users this month",
      icon: Activity,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Subscriptions",
      value: stats.activeSubscriptions?.toLocaleString() || '0',
      description: "Active plans",
      icon: CreditCard,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Support Tickets",
      value: stats.pendingTickets?.toLocaleString() || '0',
      description: "Pending response",
      icon: MessageSquare,
      color: "from-red-500 to-red-600",
    },
    {
      title: "Portfolio Projects",
      value: (stats.portfolioProjects || 0).toLocaleString(),
      description: "Total projects",
      icon: Star,
      color: "from-indigo-500 to-indigo-600",
    },
    ...(isAdmin
      ? [
          {
            title: "Pending Approvals",
            value: pendingUsersCount,
            description: "Users waiting approval",
            icon: Users,
            color: "from-amber-500 to-amber-600",
          },
          {
            title: "Service Requests",
            value: pendingServiceRequestsCount,
            description: "Pending service requests",
            icon: MessageSquare,
            color: "from-pink-500 to-pink-600",
          },
          {
            title: "Plan Requests",
            value: pendingPlanRequestsCount,
            description: "Pending plan requests",
            icon: CreditCard,
            color: "from-emerald-500 to-emerald-600",
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {statsConfig.map((stat, index) => (
        <div key={index} className="h-full">
          <StatCard {...stat} />
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
