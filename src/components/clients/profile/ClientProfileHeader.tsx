import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCanModify } from "@/hooks/useRole";

interface ClientProfileHeaderProps {
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function ClientProfileHeader({ onDelete, isDeleting }: ClientProfileHeaderProps) {
  const navigate = useNavigate();
  const canModify = useCanModify();

  return (
    <div className="flex justify-between items-center mb-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard/clients")}
        className="flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
      </Button>
      
      {canModify && onDelete && (
        <Button
          variant="outline"
          onClick={onDelete}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Client"}
        </Button>
      )}
    </div>
  );
}
