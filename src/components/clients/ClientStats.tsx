import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLIENT_STATS, ClientStatKey } from "@/config/client.constants";
import {
  LucideIcon,
  ArrowUp,
  ArrowDown,
  Users,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatValueMap {
  total: number;
  active: number;
  revenue: number;
  monthlyGrowth: number;
  avgValue: number;
  satisfaction: string;
  newThisMonth: number;
  pendingActions: number;
}

interface ClientStatsProps {
  values: Partial<StatValueMap>;
  className?: string;
}

export const ClientStats = ({ values, className }: ClientStatsProps) => {
  const stats = [
    {
      title: "Total Clients",
      value: values.total || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      change: values.monthlyGrowth || 0,
      description: "All time clients",
    },
    {
      title: "Active Clients",
      value: values.active || 0,
      icon: Activity,
      color: "from-emerald-500 to-emerald-600",
      change: 12, // Example value, should come from props
      description: "Active this month",
    },
    {
      title: "Revenue This Month",
      value: values.revenue ? `$${values.revenue.toLocaleString()}` : "$0",
      icon: DollarSign,
      color: "from-violet-500 to-violet-600",
      change: 8.2, // Example value, should come from props
      description: "From all clients",
    },
    {
      title: "Avg. Value",
      value: values.avgValue ? `$${values.avgValue.toLocaleString()}` : "$0",
      icon: CheckCircle,
      color: "from-amber-500 to-amber-600",
      change: 2.3, // Example value, should come from props
      description: "Per client",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {stats.map((stat, index) => {
        const isPositive = stat.change >= 0;
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
          >
            <Card className="h-full glass-card-hover overflow-hidden relative border-border/50 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_25px_-5px_rgba(0,0,0,0.3)]">
              <div
                className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`}
              />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {stat.change !== undefined && (
                    <div
                      className={cn(
                        "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                        isPositive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
                      )}
                    >
                      {isPositive ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(stat.change)}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <h3 className="text-2xl font-bold text-foreground">
                  {stat.value}
                </h3>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ClientStats;
