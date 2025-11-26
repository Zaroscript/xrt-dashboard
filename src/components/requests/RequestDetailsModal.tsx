import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { Request } from "@/types/request.types";
import { Calendar, User, Package, MessageSquare, FileText } from "lucide-react";

interface RequestDetailsModalProps {
  request: Request | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, notes: string) => Promise<void>;
  onUpdate: (id: string, data: { adminNotes?: string }) => Promise<void>;
}

export function RequestDetailsModal({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onUpdate,
}: RequestDetailsModalProps) {
  const [adminNotes, setAdminNotes] = useState(request?.adminNotes || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!request) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(request._id, adminNotes);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setIsProcessing(true);
    try {
      await onReject(request._id, adminNotes);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsProcessing(true);
    try {
      await onUpdate(request._id, { adminNotes });
      setIsEditing(false);
    } finally {
      setIsProcessing(false);
    }
  };

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            Request Details
            <Badge className={getStatusColor(request.status)}>
              {request.status.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View and manage this {request.type === 'service' ? 'service' : 'plan change'} request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Request Type */}
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-500" />
            <Badge className={getTypeColor(request.type)}>
              {request.type === 'service' ? 'Service Request' : 'Plan Change Request'}
            </Badge>
          </div>

          {/* Client Information */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <User className="w-5 h-5" />
              Client Information
            </Label>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
              <div>
                <span className="font-medium">Company:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">{request.client.companyName}</span>
              </div>
              <div>
                <span className="font-medium">Contact:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">
                  {request.user.fName} {request.user.lName}
                </span>
              </div>
              <div>
                <span className="font-medium">Email:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">{request.user.email}</span>
              </div>
            </div>
          </div>

          {/* Requested Item */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <FileText className="w-5 h-5" />
              Requested Item
            </Label>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="font-medium text-lg">{request.requestedItem?.name}</div>
              {request.requestedItem?.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {request.requestedItem.description}
                </p>
              )}
              {request.requestedItem?.basePrice && (
                <div className="mt-2">
                  <span className="font-medium">Price:</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">
                    ${request.requestedItem.basePrice}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Client Notes */}
          {request.notes && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <MessageSquare className="w-5 h-5" />
                Client Notes
              </Label>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {request.notes}
                </p>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <MessageSquare className="w-5 h-5" />
                Admin Notes
              </Label>
              {request.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              )}
            </div>
            {isEditing || request.status === 'pending' ? (
              <div className="space-y-2">
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for approval/rejection or internal tracking..."
                  className="min-h-[100px]"
                />
                {isEditing && (
                  <Button
                    onClick={handleSaveNotes}
                    disabled={isProcessing}
                    size="sm"
                  >
                    Save Notes
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {request.adminNotes || 'No admin notes'}
                </p>
              </div>
            )}
          </div>

          {/* Request Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Requested on {new Date(request.createdAt).toLocaleString()}</span>
          </div>

          {/* Processed Information */}
          {request.processedBy && request.processedAt && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">Processed by:</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">
                    {request.processedBy.fName} {request.processedBy.lName}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Processed at:</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(request.processedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {request.status === 'pending' && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
