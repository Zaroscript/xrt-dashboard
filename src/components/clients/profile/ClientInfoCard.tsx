import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Key,
  Save,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  CheckCircle2,
  Ban,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { type Client } from "@/types/client.types";
import { useCanModify } from "@/hooks/useRole";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { adminService } from "@/services/api/adminService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ClientInfoCardProps {
  client: Client;
  onEdit?: () => void;
  isEditing: boolean;
  isLoading?: boolean;
  form?: UseFormReturn<any>;
  onSave?: () => void;
  onCancel?: () => void;
  onResetPassword?: () => void;
}

export function ClientInfoCard({
  client,
  onEdit,
  isEditing,
  isLoading = false,
  form,
  onSave,
  onCancel,
  onResetPassword,
}: ClientInfoCardProps) {
  const canModify = useCanModify();

  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (
    newStatus: "active" | "inactive" | "suspended" | "blocked"
  ) => {
    if (
      !client.user ||
      typeof client.user !== "object" ||
      !("_id" in client.user)
    )
      return;

    setIsUpdatingStatus(true);
    try {
      await adminService.updateUserStatus(client.user._id, newStatus);
      toast({
        title: "Status Updated",
        description: `Client status changed to ${newStatus}`,
      });
      if (onSave) onSave(); // Trigger refresh
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderViewMode = () => (
    <>
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Contact Information</h3>
        <div className="space-y-1 text-sm">
          {typeof client.user === "object" && client.user?.email && (
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
              <a
                href={`mailto:${client.user.email}`}
                className="hover:underline"
              >
                {client.user.email}
              </a>
            </div>
          )}
          {typeof client.user === "object" && client.user?.phone && (
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
              <a href={`tel:${client.user.phone}`} className="hover:underline">
                {client.user.phone}
              </a>
            </div>
          )}
          {client.businessLocation && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>
                {[
                  client.businessLocation.street,
                  client.businessLocation.city,
                  client.businessLocation.state,
                  client.businessLocation.postalCode ||
                    client.businessLocation.zipCode,
                  client.businessLocation.country,
                ]
                  .filter(Boolean)
                  .join(", ") || "No address provided"}
              </span>
            </div>
          )}
          {client.oldWebsite && (
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
              <a
                href={
                  client.oldWebsite.startsWith("http")
                    ? client.oldWebsite
                    : `https://${client.oldWebsite}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {client.oldWebsite}
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Security</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
            <div className="flex items-center">
              <Key className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="font-mono">
                {showPassword
                  ? (typeof client.user === "object" &&
                      client.user &&
                      (client.user as any).plainPassword) ||
                    "Not available"
                  : "••••••••••••"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Company Information</h3>
        <div className="space-y-1 text-sm">
          {client.companyName && (
            <div className="flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>{client.companyName}</span>
            </div>
          )}
          {client.taxId && (
            <div className="flex items-center text-muted-foreground">
              <span className="w-4 mr-2" />
              <span>Tax ID: {client.taxId}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderEditMode = () => {
    if (!form) return null;

    return (
      <Form {...form}>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax ID</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Business Location</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessLocation.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessLocation.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessLocation.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessLocation.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessLocation.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onResetPassword}
            >
              <Key className="w-4 h-4 mr-2" />
              Reset Password
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  return (
    <Card className="relative">
      {(isLoading || isUpdatingStatus) && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
              {typeof client.user === "object" && client.user
                ? `${client.user.fName} ${client.user.lName}`.charAt(0)
                : "C"}
            </div>
            <div>
              <CardTitle className="text-xl">
                {typeof client.user === "object" && client.user
                  ? `${client.user.fName} ${client.user.lName}`
                  : "Client"}
              </CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 hover:bg-transparent"
                    >
                      <Badge
                        variant={
                          client.status === "active" ? "default" : "secondary"
                        }
                        className={cn(
                          "mr-2 cursor-pointer hover:opacity-80 transition-opacity",
                          (() => {
                            const status =
                              (typeof client.user === "object" &&
                                client.user?.status) ||
                              client.status;
                            return cn(
                              status === "blocked" &&
                                "bg-gray-800 hover:bg-gray-700",
                              status === "suspended" &&
                                "bg-red-100 text-red-800 hover:bg-red-200",
                              status === "inactive" &&
                                "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            );
                          })()
                        )}
                      >
                        {(() => {
                          const status =
                            (typeof client.user === "object" &&
                              client.user?.status) ||
                            client.status ||
                            "active";
                          return (
                            status.charAt(0).toUpperCase() + status.slice(1)
                          );
                        })()}
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("active")}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("suspended")}
                    >
                      <Ban className="w-4 h-4 mr-2 text-orange-500" />
                      Suspended
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("blocked")}
                    >
                      <ShieldAlert className="w-4 h-4 mr-2 text-red-500" />
                      Blocked
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("inactive")}
                    >
                      <XCircle className="w-4 h-4 mr-2 text-gray-500" />
                      Inactive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {client.subscription && (
                  <Badge variant="default" className="mr-2">
                    {client.subscription.plan.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {canModify && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={onSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    Edit Profile
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? renderEditMode() : renderViewMode()}
      </CardContent>
    </Card>
  );
}
