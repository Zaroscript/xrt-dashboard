import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Request } from '@/types/request.types';

interface EditRequestDialogProps {
  request: Request | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { notes?: string; adminNotes?: string; requestedItemId?: string }) => Promise<void>;
  plans?: Array<{ _id: string; name: string; price: number; billingCycle: string }>;
  services?: Array<{ _id: string; name: string; basePrice?: number }>;
}

export function EditRequestDialog({
  request,
  isOpen,
  onClose,
  onSave,
  plans = [],
  services = [],
}: EditRequestDialogProps) {
  const [notes, setNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (request) {
      setNotes(request.notes || '');
      setAdminNotes(request.adminNotes || '');
      // Get the requested item ID - it could be in requestedItem._id or requestedItem as a string
      const itemId = typeof request.requestedItem === 'object' && request.requestedItem?._id
        ? request.requestedItem._id
        : typeof request.requestedItem === 'string'
        ? request.requestedItem
        : '';
      setSelectedItemId(itemId);
    }
  }, [request]);

  const handleSave = async () => {
    if (!request) return;

    setIsSaving(true);
    try {
      const updateData: { notes?: string; adminNotes?: string; requestedItemId?: string } = {};
      
      if (notes !== (request.notes || '')) {
        updateData.notes = notes;
      }
      
      if (adminNotes !== (request.adminNotes || '')) {
        updateData.adminNotes = adminNotes;
      }
      
      if (selectedItemId && selectedItemId !== (typeof request.requestedItem === 'object' && request.requestedItem?._id
        ? request.requestedItem._id
        : typeof request.requestedItem === 'string'
        ? request.requestedItem
        : '')) {
        updateData.requestedItemId = selectedItemId;
      }

      await onSave(request._id, updateData);
      onClose();
    } catch (error) {
      console.error('Error saving request:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!request) return null;

  const isPlanRequest = request.type === 'plan_change';
  const availableItems = isPlanRequest ? plans : services;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Request</DialogTitle>
          <DialogDescription>
            Update the {isPlanRequest ? 'plan' : 'service'} request details before approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Requested Item Selection */}
          <div className="space-y-2">
            <Label htmlFor="requestedItem">
              {isPlanRequest ? 'Plan' : 'Service'}
            </Label>
            <Select
              value={selectedItemId}
              onValueChange={setSelectedItemId}
            >
              <SelectTrigger id="requestedItem">
                <SelectValue placeholder={`Select a ${isPlanRequest ? 'plan' : 'service'}`} />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((item) => (
                  <SelectItem key={item._id} value={item._id}>
                    {item.name}
                    {isPlanRequest && 'price' in item && (
                      <span className="text-muted-foreground ml-2">
                        (${item.price}/{item.billingCycle})
                      </span>
                    )}
                    {!isPlanRequest && 'basePrice' in item && item.basePrice && (
                      <span className="text-muted-foreground ml-2">
                        (${item.basePrice})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Client Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Client's notes or reason for request..."
              className="min-h-[100px]"
            />
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes for approval/rejection..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

