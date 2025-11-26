import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { User, UserStatus } from '@/store/slices/usersSlice';
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
import { useAppDispatch } from '@/store/store';
import { updateUser } from '@/store/slices/usersSlice';
import { useToast } from '@/components/ui/use-toast';
import { X, Plus, Trash2, Globe } from 'lucide-react';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import { uploadMyAvatar, deleteMyAvatar } from '@/services/api/avatarApi';
import { useState } from 'react';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^\+?[0-9\s-]+$/, 'Please enter a valid phone number'),
  hasOldWebsite: z.boolean().default(false),
  websites: z.array(z.object({
    url: z.string().url('Please enter a valid URL').or(z.literal('')),
  })).default([{ url: '' }]),
  businessLocation: z.string().min(2, 'Please enter a valid location').max(100),
});

interface EditProfileProps {
  user: User;
  onSuccess?: () => void;
  onCancel: () => void;
}

export const EditProfile = ({ user, onSuccess, onCancel }: EditProfileProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar || null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      hasOldWebsite: user.websites && user.websites.length > 0,
      websites: user.websites && user.websites.length > 0 
        ? user.websites.map(url => ({ url })) 
        : [{ url: '' }],
      businessLocation: user.businessLocation || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'websites',
  });

  const hasOldWebsite = form.watch('hasOldWebsite');
  const firstName = form.watch('firstName');

  const handleAvatarUpload = async (file: File) => {
    try {
      const newAvatarUrl = await uploadMyAvatar(file);
      setAvatarUrl(newAvatarUrl);
      
      // Update user in store immediately to reflect change
      dispatch(updateUser({
        ...user,
        avatar: newAvatarUrl
      }));

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
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
      dispatch(updateUser({
        ...user,
        avatar: undefined
      }));

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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Filter out empty website URLs
    const websites = values.websites
      .map(website => website.url.trim())
      .filter(url => url !== '');

    const updatedUser: User = {
      ...user,
      name: `${values.firstName} ${values.lastName}`,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      phoneNumber: values.phoneNumber,
      businessLocation: values.businessLocation,
      websites: websites.length > 0 ? websites : undefined,
      avatar: avatarUrl || undefined,
    };

    dispatch(updateUser(updatedUser));
    
    toast({
      title: 'Profile updated',
      description: `${values.firstName}'s profile has been updated successfully.`,
    });

    if (onSuccess) onSuccess();
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
              initials={firstName || user.firstName || '?'}
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

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasOldWebsite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Has Existing Website?</FormLabel>
                        <FormDescription>
                          Does this user have an existing website that needs to be migrated?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {hasOldWebsite && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel>Website URLs</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ url: '' })}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add URL
                      </Button>
                    </div>
                    
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name={`websites.${index}.url`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <div className="relative">
                                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    placeholder="https://example.com"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
