import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Users,
  DollarSign,
  BarChart2,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscribersStore } from "@/stores/subscribers/useSubscribersStore";
import SubscriberCard from "@/components/subscribers/SubscriberCard";
import { AddSubscriberDialog } from "@/components/subscribers/AddSubscriberDialog";
import { useExportClients } from "@/hooks/useExportClients";
import { useCanModify } from "@/hooks/useRole";
import { useToast } from "@/components/ui/use-toast";

import { EditSubscriberDialog } from "@/components/subscribers/EditSubscriberDialog";
import { Subscriber } from "@/stores/types";

const Subscribers = () => {
  const {
    subscribers,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    updateSubscriber: updateSubscriberApi,
    removeSubscriber,
    fetchSubscribers,
  } = useSubscribersStore();
  const canModify = useCanModify();
  const { toast } = useToast();

  // Load subscribers on component mount
  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Filter subscribers based on search term
  const filteredSubscribers = useMemo(() => {
    const subscribersArray = Array.isArray(subscribers) ? subscribers : [];
    return subscribersArray.filter((subscriber) => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const userName =
          typeof subscriber.user === "string"
            ? ""
            : `${subscriber.user.fName || ""} ${
                subscriber.user.lName || ""
              }`.toLowerCase();

        return userName.includes(searchLower);
      }

      return true;
    });
  }, [subscribers, searchTerm]);

  // Calculate metrics based on subscribers only
  const totalRevenue = useMemo(() => {
    return filteredSubscribers.reduce((sum, subscriber) => {
      const plan =
        typeof subscriber.plan?.plan === "object" ? subscriber.plan.plan : null;
      const amount = plan?.price || 0;
      return sum + amount;
    }, 0);
  }, [filteredSubscribers]);

  const avgClientValue = useMemo(() => {
    return filteredSubscribers.length > 0
      ? totalRevenue / filteredSubscribers.length
      : 0;
  }, [filteredSubscribers, totalRevenue]);

  const handleSubscriberUpdate = (subscriber: any) => {
    setEditingSubscriber(subscriber);
  };

  const handleSubscriberDelete = async (id: string) => {
    await removeSubscriber(id);
  };

  const handleSubscriberStatusChange = async (
    id: string,
    status:
      | "pending_approval"
      | "active"
      | "expired"
      | "cancelled"
      | "rejected"
      | "suspended"
  ) => {
    await updateSubscriberApi(id, { status });
  };

  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(
    null
  );
  const { isExporting, exportToCSV } = useExportClients();

  // Handle sync subscribers from clients
  const handleSyncSubscribers = async () => {
    setIsSyncing(true);
    try {
      await useSubscribersStore.getState().syncSubscribers();
      toast({
        title: "Sync Completed",
        description: "Subscribers have been synced with clients successfully.",
      });
    } catch (error) {
      console.error("Error syncing subscribers:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync subscribers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Subscribers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your premium subscribers and their subscriptions
          </p>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="glass-card"
            onClick={handleSyncSubscribers}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Clients
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="glass-card"
            onClick={() => exportToCSV(subscribers)}
            disabled={isExporting || subscribers.length === 0}
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Export to CSV
              </>
            )}
          </Button>
          {canModify && (
            <Button
              className="glass-card bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              onClick={() => setIsAddClientOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Subscriber
            </Button>
          )}
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <span>Error loading subscribers: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-3 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Subscribers
                    </p>
                    <p className="text-2xl font-bold">
                      {Array.isArray(subscribers) ? subscribers.length : 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Array.isArray(subscribers)
                        ? subscribers.filter((s) => s.plan?.status === "active")
                            .length
                        : 0}{" "}
                      active
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold">
                      ${totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Monthly recurring
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-success/10">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg. Client Value
                    </p>
                    <p className="text-2xl font-bold">
                      ${avgClientValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Per subscriber
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-accent/10">
                    <BarChart2 className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Bar */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subscribers..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscribers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredSubscribers.length > 0 ? (
              filteredSubscribers.map((subscriber) => (
                <SubscriberCard
                  key={subscriber._id}
                  subscriber={subscriber}
                  onUpdate={canModify ? handleSubscriberUpdate : undefined}
                  onDelete={canModify ? handleSubscriberDelete : undefined}
                  onStatusChange={
                    canModify ? handleSubscriberStatusChange : undefined
                  }
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No subscribers found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "No subscribers have been added yet"}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Subscriber Dialog */}
      <AddSubscriberDialog
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
      />

      {/* Edit Subscriber Dialog */}
      <EditSubscriberDialog
        subscriber={editingSubscriber}
        open={!!editingSubscriber}
        onOpenChange={(open) => !open && setEditingSubscriber(null)}
        onSuccess={fetchSubscribers}
      />
    </div>
  );
};

export default Subscribers;
