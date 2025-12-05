import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the dashboard. Please contact an administrator if you believe this is an error.
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 border border-destructive/20">
          <p className="text-sm text-muted-foreground">
            <strong>Unauthorized Access:</strong> Your account does not have the required permissions to view this page.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
          <Button 
            onClick={handleGoToLogin}
            className="w-full sm:w-auto"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
