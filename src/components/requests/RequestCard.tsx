import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Request } from "@/types/request.types";
import { Calendar, User, Package, MessageSquare, Eye } from "lucide-react";

interface RequestCardProps {
  request: Request;
  onView: (request: Request) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function RequestCard({ request, onView, onApprove, onReject }: RequestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'service' 
      ? 'bg-blue-100 text-blue-800 border-blue-300' 
      : 'bg-purple-100 text-purple-800 border-purple-300';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{request.client.companyName}</CardTitle>
              <Badge className={getStatusColor(request.status)}>
                {request.status}
              </Badge>
              <Badge className={getTypeColor(request.type)}>
                {request.type === 'service' ? 'Service' : 'Plan Change'}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {request.user.fName} {request.user.lName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Requested Item */}
        <div className="flex items-start gap-2">
          <Package className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{request.requestedItem?.name}</div>
            {request.requestedItem?.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {request.requestedItem.description}
              </p>
            )}
          </div>
        </div>

        {/* Client Notes */}
        {request.notes && (
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {request.notes}
            </p>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          {new Date(request.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        {/* Admin Notes Preview */}
        {request.adminNotes && (
          <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-sm border border-gray-200 dark:border-gray-700">
            <span className="font-medium">Admin: </span>
            <span className="text-gray-600 dark:text-gray-400 line-clamp-1">
              {request.adminNotes}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(request)}
          className="flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View Details
        </Button>

        {request.status === 'pending' && onApprove && onReject && (
          <>
            <Button
              size="sm"
              onClick={() => onApprove(request._id)}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onReject(request._id)}
              className="flex-1"
            >
              Reject
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
