import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeletePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planName?: string;
  isDeleting?: boolean;
}

export const DeletePlanDialog = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
  isDeleting = false,
}: DeletePlanDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to delete
            {planName ? ` "${planName}"` : " this plan"}? This action cannot be
            undone and will affect all clients subscribed to this plan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Plan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
