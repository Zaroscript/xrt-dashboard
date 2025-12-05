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
import { Send } from "lucide-react";

interface SendInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSending?: boolean;
}

export const SendInvoiceDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isSending = false,
}: SendInvoiceDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Send className="h-5 w-5 text-primary" />
            <AlertDialogTitle>Send Invoice?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This will send the invoice to the client via email. The invoice
            status will be updated to "sent". This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isSending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSending ? "Sending..." : "Send Invoice"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
