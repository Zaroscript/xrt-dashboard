import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, AlertCircle, TrendingUp } from "lucide-react";

// Hooks
import { useDashboardLogic } from "@/hooks/useDashboardLogic";

// Components
import { StatsCards } from "@/components/dashboard/StatsCards";
import { LineChart, BarChart, DoughnutChart } from "@/components/ui/charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SubscriberCharts } from "@/components/charts/SubscriberCharts";

const Dashboard = () => {
  const {
    // Data
    stats,
    recentActivities,
    revenueChartData,
    usersGrowthData,
    pendingUsers,
    pendingServiceRequests,
    pendingPlanRequests,

    // Loading and error states
    isLoading,
    error,
    refetch,

    // User info
    isAdmin,
  } = useDashboardLogic();

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle export
  const handleExport = () => {
    const dataStr = JSON.stringify({ stats, recentActivities }, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportName = `dashboard-export-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);
    linkElement.click();
  };

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-red-500 dark:text-red-400 mb-4">
            {error instanceof Error
              ? error.message
              : "An unknown error occurred"}
          </p>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  // Prepare client distribution data
  const clientDistribution = {
    labels: ["Active Users", "Active Subscribers", "Total Clients"],
    datasets: [
      {
        data: [
          stats?.activeUsers || 0,
          stats?.activePlans || 0,
          stats?.totalClients || 0,
        ],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)", // Active Users - green
          "rgba(59, 130, 246, 0.8)", // Active Subscribers - blue
          "rgba(139, 92, 246, 0.8)", // Total Clients - purple
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare revenue chart data
  const revenueChart = {
    labels: revenueChartData.map((d) => d.month),
    datasets: [
      {
        label: "Revenue",
        data: revenueChartData.map((d) => d.revenue),
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.5)",
        yAxisID: "y",
      },
      {
        label: "Active Clients",
        data: revenueChartData.map((d) => d.clients),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        yAxisID: "y1",
      },
    ],
  };

  // Prepare growth chart data
  const usersGrowthChart = {
    labels: usersGrowthData.map((d) => d.month),
    datasets: [
      {
        label: "Subscribers",
        data: usersGrowthData.map((d) => d.subscribers),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
      },
      {
        label: "Clients",
        data: usersGrowthData.map((d) => d.clients),
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.5)",
      },
    ],
  };

  return (
    <motion.div
      className="space-y-6 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        stats={stats}
        isAdmin={isAdmin}
        pendingUsersCount={pendingUsers.length}
        pendingServiceRequestsCount={pendingServiceRequests.length}
        pendingPlanRequestsCount={pendingPlanRequests.length}
        isLoading={isLoading}
      />

      {/* Main Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue Overview */}
            <Card className="col-span-1">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>
                      Monthly revenue and user growth
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {new Date().getFullYear()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={revenueChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: "index",
                      intersect: false,
                    },
                    scales: {
                      y: {
                        type: "linear",
                        display: true,
                        position: "left",
                        title: {
                          display: true,
                          text: "Revenue ($)",
                        },
                      },
                      y1: {
                        type: "linear",
                        display: true,
                        position: "right",
                        grid: {
                          drawOnChartArea: false,
                        },
                        title: {
                          display: true,
                          text: "Active Clients",
                        },
                      },
                    },
                  }}
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Most Subscribed Plans */}
            <Card className="col-span-1">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle>Most Subscribed Plans</CardTitle>
                </div>
                <CardDescription>
                  Top performing subscription plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.mostSubscribedPlans &&
                  stats.mostSubscribedPlans.length > 0 ? (
                    stats.mostSubscribedPlans.map((plan, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ${plan.monthlyRevenue?.toLocaleString()}/mo MRR
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{plan.count}</p>
                          <p className="text-xs text-muted-foreground">
                            subscribers
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No subscription data available yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* User Growth */}
            {/* Client & Subscriber Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Client & Subscriber Growth</CardTitle>
                <CardDescription>
                  New clients and subscribers over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={usersGrowthChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Count",
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Month",
                        },
                      },
                    },
                  }}
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Client Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Client Distribution</CardTitle>
                <CardDescription>
                  Breakdown of clients by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <DoughnutChart
                    data={clientDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "right",
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Detailed revenue metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                data={revenueChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: "Monthly Revenue vs. Active Clients",
                    },
                  },
                  interaction: {
                    mode: "index",
                    intersect: false,
                  },
                  scales: {
                    y: {
                      type: "linear",
                      display: true,
                      position: "left",
                      title: {
                        display: true,
                        text: "Revenue ($)",
                      },
                    },
                    y1: {
                      type: "linear",
                      display: true,
                      position: "right",
                      grid: {
                        drawOnChartArea: false,
                      },
                      title: {
                        display: true,
                        text: "Active Clients",
                      },
                    },
                  },
                }}
                height={400}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Client & Subscriber Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Client & Subscriber Growth</CardTitle>
                <CardDescription>
                  New clients and subscribers over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={usersGrowthChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: "Monthly Growth",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Count",
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Month",
                        },
                      },
                    },
                  }}
                  height={350}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Distribution</CardTitle>
                <CardDescription>
                  Breakdown of clients by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] flex items-center justify-center">
                  <DoughnutChart
                    data={clientDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: "Client Status Distribution",
                        },
                        legend: {
                          position: "right",
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-6">
          <SubscriberCharts />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Dashboard;
