import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import type { User } from '@/stores/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useUsersStore } from '@/stores/index';
import { useToast } from '@/components/ui/use-toast';
import { X, Plus, Trash2, Globe } from 'lucide-react';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import { uploadMyAvatar, deleteMyAvatar } from '@/services/api/avatarApi';
import { useState } from 'react';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  oldWebsite: z.string().url('Invalid URL').optional().or(z.literal('')),
});

interface EditProfileProps {
  user: User;
  onSuccess?: () => void;
  onCancel: () => void;
}

export const EditProfile = ({ user, onSuccess, onCancel }: EditProfileProps) => {
  const { updateUser } = useUsersStore();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar || null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.fName || '',
      lastName: user.lName || '',
      email: user.email,
      phone: user.phone || '',
      companyName: user.companyName || '',
      oldWebsite: user.oldWebsite || '',
    },
  });

  const firstName = form.watch('firstName');

  const handleAvatarUpload = async (file: File) => {
    try {
      const newAvatarUrl = await uploadMyAvatar(file);
      setAvatarUrl(newAvatarUrl);
      
      // Update user in store immediately to reflect change
      await updateUser({
        _id: user._id,
        avatar: newAvatarUrl,
      });
      
      toast({
        title: 'Avatar uploaded',
        description: 'Your avatar has been updated successfully.',
      });
    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await deleteMyAvatar();
      setAvatarUrl(null);
      
      // Update user in store
      await updateUser({
        _id: user._id,
        avatar: undefined
      });

      toast({
        title: 'Avatar removed',
        description: 'Your profile picture has been removed.',
      });
    } catch (error) {
      console.error('Avatar delete failed:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to remove avatar. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const updatedUser = {
        _id: user._id,
        fName: values.firstName,
        lName: values.lastName,
        email: values.email,
        phone: values.phone,
        companyName: values.companyName,
        oldWebsite: values.oldWebsite || undefined,
        avatar: avatarUrl || undefined,
      };

      await updateUser(updatedUser);
      
      toast({
        title: 'Profile updated',
        description: `${values.firstName}'s profile has been updated successfully.`,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div 
        className="bg-card rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-card z-10 pb-4 border-b">
            <h2 className="text-2xl font-bold text-foreground">Edit Profile</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex justify-center mb-6">
            <AvatarUpload
              currentAvatar={avatarUrl}
              initials={firstName || user.fName || '?'}
              onUpload={handleAvatarUpload}
              onDelete={handleAvatarDelete}
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        {...field} 
                        disabled // Email is typically not editable
                      />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
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
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="oldWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Existing Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditProfile;
