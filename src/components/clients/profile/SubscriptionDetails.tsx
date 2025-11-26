import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Client } from "@/types/client.types";

interface SubscriptionDetailsProps {
  subscription: Client['subscription'];
}

export function SubscriptionDetails({ subscription }: SubscriptionDetailsProps) {
  if (!subscription) {
    return (
      <div className="text-sm text-muted-foreground">
        No subscription information available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">
          Plan
        </span>
        <div className="flex items-center">
          <Badge variant="outline" className="mr-2">
            {subscription.plan || 'Unknown Plan'}
          </Badge>
        </div>
      </div>
      
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">
          Status
        </span>
        <Badge
          variant={
            subscription.status === "active"
              ? "default"
              : subscription.status === "pending"
              ? "secondary"
              : "destructive"
          }
        >
          {subscription.status}
        </Badge>
      </div>
      
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">
          Expires
        </span>
        <span className="text-sm">
          {subscription.expiresAt ? format(
            new Date(subscription.expiresAt),
            "MMM d, yyyy"
          ) : "N/A"}
        </span>
      </div>
      
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">
          Amount
        </span>
        <span className="font-medium">
          ${subscription.amount || 0}/month
        </span>
      </div>
      
      {subscription.startDate && (
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            Started
          </span>
          <span className="text-sm">
            {format(new Date(subscription.startDate), "MMM d, yyyy")}
          </span>
        </div>
      )}
    </div>
  );
}
