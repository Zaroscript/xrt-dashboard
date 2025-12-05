import {
  Users,
  Activity,
  DollarSign,
  CreditCard,
  MessageSquare,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import StatCard from "./StatCard";
import { DashboardStats } from "@/services/api/dashboardService";

interface StatsCardsProps {
  stats: DashboardStats;
  isAdmin?: boolean;
  pendingUsersCount?: number;
  pendingServiceRequestsCount?: number;
  pendingPlanRequestsCount?: number;
  isLoading?: boolean;
}

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
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  const statsConfig = [
    {
      title: "Total Revenue",
      value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
      description: "All-time revenue",
      icon: DollarSign,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Monthly Revenue",
      value: `$${(stats.monthlyRevenue || 0).toLocaleString()}`,
      description: "Recurring revenue (MRR)",
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Active Subscribers",
      value: stats.activePlans?.toLocaleString() || "0",
      description: "Active paid plans",
      icon: CreditCard,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Active Clients",
      value: stats.totalClients?.toLocaleString() || "0",
      description: "Total active clients",
      icon: UserCheck,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Total Users",
      value: stats.totalUsers?.toLocaleString() || "0",
      description: "Registered users",
      icon: Users,
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
            title: "Pending Plans",
            value: pendingPlanRequestsCount,
            description: "Awaiting approval",
            icon: CreditCard,
            color: "from-emerald-500 to-emerald-600",
          },
          {
            title: "Portfolio Projects",
            value: stats.portfolioProjects?.toLocaleString() || "0",
            description: "Total projects",
            icon: TrendingUp,
            color: "from-cyan-500 to-cyan-600",
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
