import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Clock,
  User,
  CreditCard,
  Settings,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  useClientActivities,
  ActivityItem,
} from "../../../hooks/useClientActivities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecentActivityProps {
  clientId: string;
}

export function RecentActivity({ clientId }: RecentActivityProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isPaginating, setIsPaginating] = useState(false);

  const {
    data: activities = [],
    isLoading,
    error,
  } = useClientActivities(clientId);

  // Reset current page when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Calculate pagination
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = activities.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setIsPaginating(true);
      setTimeout(() => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
        setIsPaginating(false);
      }, 150);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setIsPaginating(true);
      setTimeout(() => {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
        setIsPaginating(false);
      }, 150);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setIsPaginating(true);
    setTimeout(() => {
      setCurrentPage(pageNumber);
      setIsPaginating(false);
    }, 150);
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "login":
        return <User className="w-4 h-4" />;
      case "payment":
        return <CreditCard className="w-4 h-4" />;
      case "profile_update":
        return <Settings className="w-4 h-4" />;
      case "subscription_change":
        return <FileText className="w-4 h-4" />;
      case "support_ticket":
        return <FileText className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "login":
        return "text-primary";
      case "payment":
        return "text-green-500";
      case "profile_update":
        return "text-orange-500";
      case "subscription_change":
        return "text-primary";
      case "support_ticket":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusVariant = (status?: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity
          </div>
          {activities.length > 0 && (
            <span className="text-sm text-muted-foreground font-normal">
              {activities.length}{" "}
              {activities.length === 1 ? "activity" : "activities"}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg"
              >
                <Skeleton className="w-4 h-4 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load activity data. Please try again later.
            </AlertDescription>
          </Alert>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No recent activity to show.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, activities.length)} of {activities.length} activities
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Show:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-16 h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Loading overlay for pagination */}
            {isPaginating && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            
            <div className="space-y-2 relative">
              {currentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-muted/30 border border-border/50 
                             rounded-lg hover:bg-muted/50 hover:border-border transition-all duration-200"
                >
                  <div className={`mt-0.5 ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {activity.status && (
                          <Badge
                            variant={getStatusVariant(activity.status)}
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(
                            new Date(activity.timestamp),
                            "MMM d, h:mm a"
                          )}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isPaginating}
                    className="h-8 w-8 p-0"
                  >
                    {isPaginating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          disabled={isPaginating}
                          className="h-8 w-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || isPaginating}
                    className="h-8 w-8 p-0"
                  >
                    {isPaginating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
