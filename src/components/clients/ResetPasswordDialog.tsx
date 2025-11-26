import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, CheckCircle2, Key, Shuffle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { clientsService } from "@/services/api/clientsService";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "generate">("manual");
  const { toast } = useToast();

  // Reset all state when dialog opens or closes
  useEffect(() => {
    if (!open) {
      setNewPassword("");
      setConfirmPassword("");
      setGeneratedPassword("");
      setCopied(false);
      setActiveTab("manual");
    }
  }, [open]);

  const handleManualReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await clientsService.resetClientPassword(clientId, { newPassword });

      toast({
        title: "Success",
        description: "Password reset successfully",
      });

      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePassword = async () => {
    try {
      setIsLoading(true);
      const response = await clientsService.resetClientPassword(clientId, {
        generateRandom: true,
      });

      setGeneratedPassword(response.data.temporaryPassword || "");

      toast({
        title: "Success",
        description: "Temporary password generated successfully",
      });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error generating password:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to generate password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedPassword);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = generatedPassword;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy password:", error);
      toast({
        title: "Copy Failed",
        description: "Please manually copy the password",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setGeneratedPassword("");
    setCopied(false);
    setActiveTab("manual");
    onOpenChange(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "manual" | "generate");

    // Clear state when switching tabs
    if (value === "manual") {
      setGeneratedPassword("");
      setCopied(false);
    } else if (value === "generate") {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>Reset password for {clientName}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">
              <Key className="w-4 h-4 mr-2" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="generate">
              <Shuffle className="w-4 h-4 mr-2" />
              Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <form onSubmit={handleManualReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4 mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a secure random password for the client
              </p>

              {generatedPassword ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <code className="flex-1 font-mono text-sm">
                      {generatedPassword}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-orange-600 font-medium">
                    ⚠️ Make sure to copy this password. It cannot be retrieved
                    later.
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleGeneratePassword}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Shuffle className="mr-2 h-4 w-4" />
                      Generate Password
                    </>
                  )}
                </Button>
              )}

              {generatedPassword && (
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Done
                  </Button>
                </DialogFooter>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
