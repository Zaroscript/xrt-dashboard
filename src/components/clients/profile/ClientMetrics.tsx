import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Activity,
} from "lucide-react";
import { type Client } from "@/stores/clients/useClientsStore";

interface ClientMetricsProps {
  client: Client;
}

export function ClientMetrics({ client }: ClientMetricsProps) {
  const getDaysSinceCreation = () => {
    const created = new Date(client.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysSinceLastActive = () => {
    // Use lastActive if available, otherwise fall back to updatedAt
    const lastActiveDate = client.lastActive
      ? new Date(client.lastActive)
      : new Date(client.updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastActiveDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSubscriptionHealth = () => {
    if (!client.subscription)
      return { status: "none", label: "No Subscription", color: "secondary" };

    const expiresAt = new Date(client.subscription.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (client.subscription.status !== "active") {
      return { status: "inactive", label: "Inactive", color: "destructive" };
    }

    if (daysUntilExpiry <= 7) {
      return {
        status: "expiring",
        label: `Expires in ${daysUntilExpiry} days`,
        color: "destructive",
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "warning",
        label: `Expires in ${daysUntilExpiry} days`,
        color: "secondary",
      };
    } else {
      return {
        status: "healthy",
        label: `Active (${daysUntilExpiry} days)`,
        color: "default",
      };
    }
  };

  const metrics = [
    {
      title: "Client Value",
      value: `$${(client.revenue || 0).toLocaleString()}`,
      icon: <DollarSign className="w-4 h-4" />,
      trend: (client.revenue || 0) > 1000 ? "up" : "stable",
      description: "Total revenue",
    },
    {
      title: "Client Age",
      value: `${getDaysSinceCreation()} days`,
      icon: <Calendar className="w-4 h-4" />,
      trend: "stable",
      description: "Since creation",
    },
    {
      title: "Last Active",
      value: `${getDaysSinceLastActive()} days ago`,
      icon: <Activity className="w-4 h-4" />,
      trend: getDaysSinceLastActive() <= 7 ? "up" : "down",
      description: client.lastActive ? "Last activity" : "Based on update",
    },
    {
      title: "Subscription",
      value: getSubscriptionHealth().label,
      icon: <Users className="w-4 h-4" />,
      trend: getSubscriptionHealth().status === "healthy" ? "up" : "down",
      description: "Current status",
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getSubscriptionBadge = () => {
    const health = getSubscriptionHealth();
    return (
      <Badge variant={health.color as any} className="text-xs">
        {health.label}
      </Badge>
    );
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Client Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="p-4 bg-muted/50 border border-border rounded-lg hover:bg-muted 
                         transition-all duration-200 hover:border-primary/20 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                  {metric.icon}
                </div>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  {metric.title}
                </span>
                {metric.title === "Subscription" ? (
                  getSubscriptionBadge()
                ) : (
                  <div className="text-lg font-semibold">{metric.value}</div>
                )}
                <p className="text-xs text-muted-foreground/80">
                  {metric.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Insights */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-3">Quick Insights</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors">
              <span className="text-muted-foreground">Account Status</span>
              <Badge
                variant={client.isActive ? "default" : "secondary"}
                className={
                  client.isActive
                    ? "bg-green-500/10 text-green-400 dark:text-green-400 border-green-500/30"
                    : ""
                }
              >
                {client.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors">
              <span className="text-muted-foreground">Client Type</span>
              <span className="font-medium">
                {client.isClient ? "Client" : "Lead"}
              </span>
            </div>
            {client.currentPlan && (
              <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground">Current Plan</span>
                <span className="font-medium text-primary">
                  {typeof client.currentPlan === "string"
                    ? client.currentPlan
                    : client.currentPlan.name || "Unknown"}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
