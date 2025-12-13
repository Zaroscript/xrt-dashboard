import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Shield,
  Save,
  Users,
  Loader2,
  Trash2,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";
import { useTheme } from "next-themes";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { useIsSuperAdmin } from "@/hooks/useRole";
import { debugAuthState, canAccessAdmin } from "@/utils/debugAuth";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { profileApi } from "@/services/api/profileApi";
import { uploadMyAvatar, deleteMyAvatar } from "@/services/api/avatarApi";
import {
  companySettingsApi,
  CompanySettings,
} from "@/services/api/companySettingsApi";
import { getLogoUrl } from "@/utils/logoUtils";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Settings = () => {
  const { user, setAuth } = useAuthStore();
  const isSuperAdmin = useIsSuperAdmin();
  const {
    moderators,
    fetchModerators,
    addModerator,
    updateModerator,
    removeModerator,
    isLoadingModerators,
    moderatorError,
  } = useSettingsStore();
  const { toast } = useToast();

  // Profile State
  const [profileData, setProfileData] = useState({
    fName: "",
    lName: "",
    email: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Moderator State
  const [newModerator, setNewModerator] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isAddingModerator, setIsAddingModerator] = useState(false);

  // Edit Moderator State
  const [editingModerator, setEditingModerator] = useState<{
    id: string;
    name: string;
    email: string;
    password?: string;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingModerator, setIsUpdatingModerator] = useState(false);

  // Delete Moderator State
  const [moderatorToDelete, setModeratorToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});

  // Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    email: "",
    phone: "",
    taxId: "",
    website: "",
    logo: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    currency: "USD",
  });
  const [isLoadingCompanySettings, setIsLoadingCompanySettings] =
    useState(true);
  const [isSavingCompanySettings, setIsSavingCompanySettings] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        fName: user.fName || "",
        lName: user.lName || "",
        email: user.email || "",
      });
    }

    // Only fetch admin data if user is super admin
    if (isSuperAdmin) {
      console.log("User is super admin, fetching admin data...");
      fetchModerators();
      fetchCompanySettings();
    } else {
      console.warn("User is not super admin, skipping admin data fetch");
      toast({
        title: "Access Restricted",
        description: "You need super admin privileges to access admin settings",
        variant: "destructive",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSuperAdmin]);

  const fetchCompanySettings = async () => {
    // Only fetch if user is super admin
    if (!isSuperAdmin) {
      console.warn("Cannot fetch company settings - user is not super admin");
      return;
    }

    try {
      setIsLoadingCompanySettings(true);
      const settings = await companySettingsApi.getSettings();
      setCompanySettings(settings);
      // Set logo preview if logo exists
      if (settings.logo) {
        setLogoPreview(getLogoUrl(settings.logo));
      }
    } catch (error: any) {
      console.error("Error fetching company settings:", error);
      if (error.response?.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access company settings",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load company settings",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingCompanySettings(false);
    }
  };

  const handleCompanySettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompanySettings(true);
    try {
      const updatedSettings = await companySettingsApi.updateSettings(
        companySettings
      );
      setCompanySettings(updatedSettings);
      toast({
        title: "Company settings updated",
        description: "Your company information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update company settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingCompanySettings(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true);
      const logoPath = await companySettingsApi.uploadLogo(file);
      setCompanySettings({ ...companySettings, logo: logoPath });

      // Update preview
      setLogoPreview(getLogoUrl(logoPath));

      toast({
        title: "Logo uploaded",
        description: "Company logo has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Logo upload failed:", error);
      toast({
        title: "Upload failed",
        description:
          error.response?.data?.message ||
          "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    try {
      setIsUploadingLogo(true);
      await companySettingsApi.deleteLogo();
      setCompanySettings({ ...companySettings, logo: "" });
      setLogoPreview(null);
      toast({
        title: "Logo removed",
        description: "Company logo has been removed successfully.",
      });
    } catch (error: any) {
      console.error("Logo delete failed:", error);
      toast({
        title: "Delete failed",
        description:
          error.response?.data?.message ||
          "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    // 1. Create a preview immediately (Optimistic UI)
    const reader = new FileReader();
    const originalAvatar = user?.avatar; // Keep reference to revert if needed

    reader.onloadend = () => {
      const base64data = reader.result as string;
      if (user) {
        // Update global state immediately with the base64 string
        // The getAvatarUrl utility now handles data: URIs correctly
        setAuth(
          { ...user, avatar: base64data },
          useAuthStore.getState().tokens
        );
      }
    };
    reader.readAsDataURL(file);

    try {
      // 2. Perform actual upload
      const newAvatarUrl = await uploadMyAvatar(file);

      // 3. Update with the real URL from server
      if (user) {
        setAuth(
          { ...user, avatar: newAvatarUrl },
          useAuthStore.getState().tokens
        );
      }
      // Note: Toast notification is handled by AvatarUpload component
    } catch (error: any) {
      // 4. Revert on failure
      if (user) {
        setAuth(
          { ...user, avatar: originalAvatar },
          useAuthStore.getState().tokens
        );
      }
      // Error toast is handled by AvatarUpload component
      throw error; // Re-throw to let AvatarUpload handle it
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await deleteMyAvatar();
      if (user) {
        setAuth({ ...user, avatar: undefined }, useAuthStore.getState().tokens);
      }
      // Note: Toast notification is handled by AvatarUpload component
    } catch (error: any) {
      // Error toast is handled by AvatarUpload component
      throw error; // Re-throw to let AvatarUpload handle it
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updatedUser = await profileApi.updateProfile(profileData);

      // Update local user state
      if (user) {
        setAuth({ ...user, ...updatedUser }, useAuthStore.getState().tokens);
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const { data } = await profileApi.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      // Update token if returned (usually needed after password change)
      if (data.accessToken && user) {
        setAuth(user, { accessToken: data.accessToken });
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAddModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingModerator(true);
    try {
      const success = await addModerator(newModerator);
      if (success) {
        setNewModerator({ name: "", email: "", password: "" });
        // Refresh the moderators list to ensure we have the latest data
        await fetchModerators();
        toast({
          title: "Moderator added",
          description: "New moderator has been added successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: moderatorError || "Failed to add moderator",
          variant: "destructive",
        });
      }
    } finally {
      setIsAddingModerator(false);
    }
  };

  const handleEditClick = (mod: any) => {
    setEditingModerator({
      id: mod._id,
      name:
        mod.fName && mod.lName ? `${mod.fName} ${mod.lName}` : mod.name || "",
      email: mod.email,
      password: "", // Don't pre-fill password
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModerator) return;

    setIsUpdatingModerator(true);
    try {
      const success = await updateModerator(editingModerator.id, {
        name: editingModerator.name,
        email: editingModerator.email,
        password: editingModerator.password || undefined,
      });

      if (success) {
        setIsEditDialogOpen(false);
        setEditingModerator(null);
        // Refresh the moderators list to ensure we have the latest data
        await fetchModerators();
        toast({
          title: "Moderator updated",
          description: "Moderator details have been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: moderatorError || "Failed to update moderator",
          variant: "destructive",
        });
      }
    } finally {
      setIsUpdatingModerator(false);
    }
  };

  const handleRemoveModerator = (id: string, name: string) => {
    setModeratorToDelete({ id, name });
    setIsDeleteDialogOpen(true);
  };

  const confirmRemoveModerator = async () => {
    if (!moderatorToDelete) return;

    const success = await removeModerator(moderatorToDelete.id);
    if (success) {
      // Refresh the moderators list to ensure we have the latest data
      await fetchModerators();
      toast({
        title: "Moderator removed",
        description: "Moderator has been removed successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: moderatorError || "Failed to remove moderator",
        variant: "destructive",
      });
    }

    // Close dialog and reset state
    setIsDeleteDialogOpen(false);
    setModeratorToDelete(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="container mx-auto px-4 py-6 md:py-8 max-w-7xl"
    >
      {/* Enhanced Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-base">
          Manage your account, company information, and team settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6 md:space-y-8">
        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full md:w-auto">
          <TabsTrigger
            value="profile"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-1 md:flex-none"
          >
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="company"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-1 md:flex-none"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger
            value="moderators"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-1 md:flex-none"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Moderators</span>
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Personal Information
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Update your personal details and public profile
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center py-2">
                    <AvatarUpload
                      currentAvatar={user?.avatar}
                      initials={user?.initials || "U"}
                      onUpload={handleAvatarUpload}
                      onDelete={handleAvatarDelete}
                    />
                  </div>

                  <Separator />

                  <form onSubmit={handleProfileUpdate} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fName" className="text-sm font-medium">
                          First Name
                        </Label>
                        <Input
                          id="fName"
                          value={profileData.fName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              fName: e.target.value,
                            })
                          }
                          required
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lName" className="text-sm font-medium">
                          Last Name
                        </Label>
                        <Input
                          id="lName"
                          value={profileData.lName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              lName: e.target.value,
                            })
                          }
                          required
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        required
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This email will be used for account notifications
                      </p>
                    </div>

                    <Separator />

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={isSavingProfile}
                        className="min-w-[140px]"
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Security</CardTitle>
                      <CardDescription className="mt-1">
                        Manage your password and security settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="currentPassword"
                        className="text-sm font-medium"
                      >
                        Current Password
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        required
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="newPassword"
                          className="text-sm font-medium"
                        >
                          New Password
                        </Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          required
                          minLength={8}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Must be at least 8 characters long
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-sm font-medium"
                        >
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                          minLength={8}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={isSavingPassword}
                        className="min-w-[140px]"
                      >
                        {isSavingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* COMPANY INFORMATION TAB */}
        <TabsContent value="company" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Company Information
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Manage your company details that will appear on invoices
                      and documents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCompanySettings ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Loading company settings...
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleCompanySettingsUpdate}
                    className="space-y-8"
                  >
                    {/* Logo Upload Section */}
                    <div className="space-y-4 p-6 rounded-lg border bg-muted/30">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">
                          Company Logo
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Upload your company logo to display on invoices and
                          documents
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {logoPreview && (
                          <div className="relative group">
                            <div className="absolute inset-0 bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <img
                              src={logoPreview}
                              alt="Company Logo"
                              className="h-28 w-auto object-contain border-2 border-border rounded-lg p-3 bg-background shadow-sm"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-3 flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="logo-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Validate file type
                                if (!file.type.startsWith("image/")) {
                                  toast({
                                    title: "Invalid file",
                                    description: "Please upload an image file",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                // Validate file size (5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  toast({
                                    title: "File too large",
                                    description:
                                      "Image size must be less than 5MB",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                handleLogoUpload(file);
                              }
                            }}
                            disabled={isUploadingLogo}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                document.getElementById("logo-upload")?.click()
                              }
                              disabled={isUploadingLogo}
                              className="transition-all hover:bg-accent"
                            >
                              {isUploadingLogo ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" />
                                  {logoPreview ? "Change Logo" : "Upload Logo"}
                                </>
                              )}
                            </Button>
                            {logoPreview && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleLogoDelete}
                                disabled={isUploadingLogo}
                                className="transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Recommended: JPG, PNG or GIF. Max size 5MB. Optimal
                            dimensions: 200x200px or higher.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Company Details Section */}
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold">
                          Company Details
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Basic information about your company
                        </p>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        {/* Company Name */}
                        <div className="space-y-2 md:col-span-2">
                          <Label
                            htmlFor="companyName"
                            className="text-sm font-medium"
                          >
                            Company Name *
                          </Label>
                          <Input
                            id="companyName"
                            value={companySettings.companyName}
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                companyName: e.target.value,
                              })
                            }
                            required
                            placeholder="Your Company Name"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        {/* Address Fields Group */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="address"
                            className="text-sm font-medium"
                          >
                            Street Address
                          </Label>
                          <Input
                            id="address"
                            value={companySettings.address}
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                address: e.target.value,
                              })
                            }
                            placeholder="123 Business Street"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium">
                            City
                          </Label>
                          <Input
                            id="city"
                            value={companySettings.city}
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                city: e.target.value,
                              })
                            }
                            placeholder="City"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="state"
                            className="text-sm font-medium"
                          >
                            State/Province
                          </Label>
                          <Input
                            id="state"
                            value={companySettings.state}
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                state: e.target.value,
                              })
                            }
                            placeholder="State"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="zip" className="text-sm font-medium">
                            ZIP/Postal Code
                          </Label>
                          <Input
                            id="zip"
                            value={companySettings.zip}
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                zip: e.target.value,
                              })
                            }
                            placeholder="12345"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label
                            htmlFor="country"
                            className="text-sm font-medium"
                          >
                            Country
                          </Label>
                          <Input
                            id="country"
                            value={companySettings.country}
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                country: e.target.value,
                              })
                            }
                            placeholder="Country"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Information Section */}
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold">
                          Contact Information
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          How clients can reach your company
                        </p>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="companyEmail"
                            className="text-sm font-medium"
                          >
                            Email
                          </Label>
                          <Input
                            id="companyEmail"
                            type="email"
                            value={companySettings.email}
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                email: e.target.value,
                              })
                            }
                            placeholder="contact@example.com"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="phone"
                            className="text-sm font-medium"
                          >
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            value={companySettings.phone}
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                phone: e.target.value,
                              })
                            }
                            placeholder="+1 (555) 123-4567"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="website"
                            className="text-sm font-medium"
                          >
                            Website
                          </Label>
                          <Input
                            id="website"
                            type="url"
                            value={companySettings.website}
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                website: e.target.value,
                              })
                            }
                            placeholder="https://example.com"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="taxId"
                            className="text-sm font-medium"
                          >
                            Tax ID
                          </Label>
                          <Input
                            id="taxId"
                            value={companySettings.taxId}
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                taxId: e.target.value,
                              })
                            }
                            placeholder="TAX-123456789"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={isSavingCompanySettings}
                        className="min-w-[180px]"
                      >
                        {isSavingCompanySettings ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Company Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* MODERATORS TAB */}
        <TabsContent value="moderators" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Team Members</CardTitle>
                    <CardDescription className="mt-1">
                      Manage moderators who have access to the dashboard
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add Moderator Form - Only for Super Admin */}
                  {user?.role === "super_admin" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-5 rounded-lg border bg-muted/30 space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Moderator
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Create a new team member with dashboard access
                          </p>
                        </div>
                        <form
                          onSubmit={handleAddModerator}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="modName"
                                className="text-sm font-medium"
                              >
                                Full Name
                              </Label>
                              <Input
                                id="modName"
                                placeholder="John Doe"
                                value={newModerator.name}
                                onChange={(e) =>
                                  setNewModerator({
                                    ...newModerator,
                                    name: e.target.value,
                                  })
                                }
                                required
                                className="transition-all focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="modEmail"
                                className="text-sm font-medium"
                              >
                                Email Address
                              </Label>
                              <Input
                                id="modEmail"
                                type="email"
                                placeholder="john@example.com"
                                value={newModerator.email}
                                onChange={(e) =>
                                  setNewModerator({
                                    ...newModerator,
                                    email: e.target.value,
                                  })
                                }
                                required
                                className="transition-all focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="modPassword"
                                className="text-sm font-medium"
                              >
                                Password (Optional)
                              </Label>
                              <Input
                                id="modPassword"
                                type="password"
                                placeholder="Auto-generated if empty"
                                value={newModerator.password}
                                onChange={(e) =>
                                  setNewModerator({
                                    ...newModerator,
                                    password: e.target.value,
                                  })
                                }
                                minLength={8}
                                className="transition-all focus:ring-2 focus:ring-primary/20"
                              />
                              <p className="text-xs text-muted-foreground">
                                Leave empty for auto-generated password
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={isAddingModerator}
                              className="min-w-[140px]"
                            >
                              {isAddingModerator ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Moderator
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}

                  {/* Moderators List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">
                        Active Moderators
                      </h3>
                      <div className="flex items-center gap-3">
                        {moderators && moderators.length > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {moderators.length}{" "}
                            {moderators.length === 1 ? "member" : "members"}
                          </span>
                        )}
                      </div>
                    </div>
                    {isLoadingModerators &&
                    (!moderators || moderators.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Loading moderators...
                        </p>
                      </div>
                    ) : moderatorError ? (
                      <div className="text-center py-12 space-y-3">
                        <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                          <Users className="h-8 w-8 text-destructive" />
                        </div>
                        <div>
                          <p className="text-base font-medium text-foreground">
                            Error loading moderators
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {moderatorError}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => fetchModerators()}
                          >
                            Try Again
                          </Button>
                        </div>
                      </div>
                    ) : !moderators || moderators.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-base font-medium text-foreground">
                            No moderators found
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Get started by adding your first team member
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {moderators.map((mod: any, index: number) => (
                          <motion.div
                            key={mod._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200 hover:shadow-sm group"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                                {mod.fName?.[0] || mod.name?.[0] || "U"}
                                {mod.lName?.[0] || ""}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-base truncate">
                                  {mod.fName && mod.lName
                                    ? `${mod.fName} ${mod.lName}`
                                    : mod.name || "Unknown"}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {mod.email}
                                </p>
                                {mod.plainPassword && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-xs font-mono">
                                      <span className="text-muted-foreground">
                                        {visiblePasswords[mod._id]
                                          ? mod.plainPassword
                                          : "••••••••"}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 hover:bg-transparent"
                                        onClick={() =>
                                          togglePasswordVisibility(mod._id)
                                        }
                                      >
                                        {visiblePasswords[mod._id] ? (
                                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                        ) : (
                                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {user?.role === "super_admin" && (
                              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => handleEditClick(mod)}
                                  title="Edit moderator"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    handleRemoveModerator(
                                      mod._id,
                                      `${mod.fName} ${mod.lName}`
                                    )
                                  }
                                  title="Remove moderator"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Edit Moderator Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 shadow-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Edit Moderator
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update moderator details. Leave password blank to keep current
              password.
            </DialogDescription>
          </DialogHeader>
          {editingModerator && (
            <form onSubmit={handleUpdateModerator} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="editName"
                  className="text-sm font-medium text-foreground"
                >
                  Full Name
                </Label>
                <Input
                  id="editName"
                  value={editingModerator.name}
                  onChange={(e) =>
                    setEditingModerator({
                      ...editingModerator,
                      name: e.target.value,
                    })
                  }
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="editEmail"
                  className="text-sm font-medium text-foreground"
                >
                  Email Address
                </Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingModerator.email}
                  onChange={(e) =>
                    setEditingModerator({
                      ...editingModerator,
                      email: e.target.value,
                    })
                  }
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="editPassword"
                  className="text-sm font-medium text-foreground"
                >
                  New Password (Optional)
                </Label>
                <Input
                  id="editPassword"
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editingModerator.password || ""}
                  onChange={(e) =>
                    setEditingModerator({
                      ...editingModerator,
                      password: e.target.value,
                    })
                  }
                  minLength={8}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-background placeholder:text-muted-foreground/60"
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters if provided
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full sm:w-auto border-border hover:bg-accent/50 hover:text-accent-foreground transition-colors duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingModerator}
                  className="w-full sm:w-auto min-w-[120px] bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
                >
                  {isUpdatingModerator ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Moderator Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Moderator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">{moderatorToDelete?.name}</span>{" "}
              as a moderator? This action cannot be undone and will revoke their
              administrative access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveModerator}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Moderator
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default Settings;
