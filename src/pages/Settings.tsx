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
  EyeOff
} from "lucide-react";
import { useTheme } from "next-themes";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { profileApi } from "@/services/api/profileApi";
import { uploadMyAvatar, deleteMyAvatar } from "@/services/api/avatarApi";
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
  const { 
    moderators, 
    fetchModerators, 
    addModerator, 
    updateModerator,
    removeModerator, 
    isLoadingModerators 
  } = useSettingsStore();
  const { toast } = useToast();
  
  // Profile State
  const [profileData, setProfileData] = useState({
    fName: '',
    lName: '',
    email: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Moderator State
  const [newModerator, setNewModerator] = useState({ name: '', email: '', password: '' });
  const [isAddingModerator, setIsAddingModerator] = useState(false);

  // Edit Moderator State
  const [editingModerator, setEditingModerator] = useState<{ id: string; name: string; email: string; password?: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingModerator, setIsUpdatingModerator] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        fName: user.fName || '',
        lName: user.lName || '',
        email: user.email || ''
      });
    }
    fetchModerators();
  }, [user, fetchModerators]);

  const handleAvatarUpload = async (file: File) => {
    try {
      const newAvatarUrl = await uploadMyAvatar(file);
      if (user) {
        setAuth({ ...user, avatar: newAvatarUrl }, useAuthStore.getState().tokens);
      }
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await deleteMyAvatar();
      if (user) {
        setAuth({ ...user, avatar: undefined }, useAuthStore.getState().tokens);
      }
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove avatar",
        variant: "destructive"
      });
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
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const { data } = await profileApi.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Update token if returned (usually needed after password change)
      if (data.accessToken && user) {
        setAuth(user, { accessToken: data.accessToken });
      }

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update password",
        variant: "destructive"
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
        setNewModerator({ name: '', email: '', password: '' });
        toast({
          title: "Moderator added",
          description: "New moderator has been added successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: useSettingsStore.getState().moderatorError || "Failed to add moderator",
          variant: "destructive"
        });
      }
    } finally {
      setIsAddingModerator(false);
    }
  };

  const handleEditClick = (mod: any) => {
    setEditingModerator({
      id: mod._id,
      name: `${mod.fName} ${mod.lName}`,
      email: mod.email,
      password: '' // Don't pre-fill password
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
        password: editingModerator.password || undefined
      });

      if (success) {
        setIsEditDialogOpen(false);
        setEditingModerator(null);
        toast({
          title: "Moderator updated",
          description: "Moderator details have been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: useSettingsStore.getState().moderatorError || "Failed to update moderator",
          variant: "destructive"
        });
      }
    } finally {
      setIsUpdatingModerator(false);
    }
  };

  const handleRemoveModerator = async (id: string) => {
    if (confirm('Are you sure you want to remove this moderator?')) {
      const success = await removeModerator(id);
      if (success) {
        toast({
          title: "Moderator removed",
          description: "Moderator has been removed successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove moderator",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and team settings</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="flex space-x-2 w-full md:w-auto overflow-x-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2 flex-1 md:flex-none">
            <UserIcon className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="moderators" className="flex items-center gap-2 flex-1 md:flex-none">
            <Users className="h-4 w-4" />
            Moderators
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and public profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center mb-6">
                  <AvatarUpload 
                    currentAvatar={user?.avatar}
                    initials={user?.initials || 'U'}
                    onUpload={handleAvatarUpload}
                    onDelete={handleAvatarDelete}
                  />
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fName">First Name</Label>
                      <Input
                        id="fName"
                        value={profileData.fName}
                        onChange={(e) => setProfileData({ ...profileData, fName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lName">Last Name</Label>
                      <Input
                        id="lName"
                        value={profileData.lName}
                        onChange={(e) => setProfileData({ ...profileData, lName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSavingProfile}>
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

            {/* Password */}
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your password and security settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="outline" disabled={isSavingPassword}>
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
          </div>
        </TabsContent>

        {/* MODERATORS TAB */}
        <TabsContent value="moderators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage moderators who have access to the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add Moderator Form - Only for Super Admin */}
                {user?.role === 'super_admin' && (
                  <form onSubmit={handleAddModerator} className="flex flex-col md:flex-row gap-4 items-end border-b pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
                      <div className="space-y-2">
                        <Label htmlFor="modName">Full Name</Label>
                        <Input 
                          id="modName" 
                          placeholder="John Doe"
                          value={newModerator.name}
                          onChange={(e) => setNewModerator({...newModerator, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modEmail">Email Address</Label>
                        <Input 
                          id="modEmail" 
                          type="email" 
                          placeholder="john@example.com"
                          value={newModerator.email}
                          onChange={(e) => setNewModerator({...newModerator, email: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modPassword">Password (Optional)</Label>
                        <Input 
                          id="modPassword" 
                          type="password" 
                          placeholder="Auto-generated if empty"
                          value={newModerator.password}
                          onChange={(e) => setNewModerator({...newModerator, password: e.target.value})}
                          minLength={8}
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={isAddingModerator}>
                      {isAddingModerator ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Moderator
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Moderators List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Active Moderators</h3>
                  {isLoadingModerators && moderators.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : moderators.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No moderators found.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {moderators.map((mod: any) => (
                        <div key={mod._id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {mod.fName?.[0]}{mod.lName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium">{mod.fName} {mod.lName}</p>
                              <p className="text-sm text-muted-foreground">{mod.email}</p>
                              {mod.plainPassword && (
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                                    {visiblePasswords[mod._id] ? mod.plainPassword : '••••••••'}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => togglePasswordVisibility(mod._id)}
                                  >
                                    {visiblePasswords[mod._id] ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          {user?.role === 'super_admin' && (
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => handleEditClick(mod)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveModerator(mod._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Moderator Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Moderator</DialogTitle>
            <DialogDescription>
              Update moderator details. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          {editingModerator && (
            <form onSubmit={handleUpdateModerator} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Full Name</Label>
                <Input 
                  id="editName" 
                  value={editingModerator.name}
                  onChange={(e) => setEditingModerator({...editingModerator, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email Address</Label>
                <Input 
                  id="editEmail" 
                  type="email" 
                  value={editingModerator.email}
                  onChange={(e) => setEditingModerator({...editingModerator, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPassword">New Password (Optional)</Label>
                <Input 
                  id="editPassword" 
                  type="password" 
                  placeholder="Leave blank to keep current"
                  value={editingModerator.password || ''}
                  onChange={(e) => setEditingModerator({...editingModerator, password: e.target.value})}
                  minLength={8}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingModerator}>
                  {isUpdatingModerator && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Settings;
