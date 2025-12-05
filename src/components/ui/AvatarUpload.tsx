import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { getAvatarUrl, validateAvatarFile } from '@/utils/avatarUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  initials: string;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-20 w-20',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
  xl: 'h-40 w-40'
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  initials,
  onUpload,
  onDelete,
  className,
  size = 'lg'
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cacheBust, setCacheBust] = useState<number>(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    // Validate file
    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      toast({
        title: 'Invalid file',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setIsUploading(true);
      await onUpload(file);
      // Update cache bust to force refresh
      setCacheBust(Date.now());
      toast({
        title: 'Avatar uploaded',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setPreview(null);
      toast({
        title: 'Upload failed',
        description: error?.response?.data?.message || 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsUploading(true);
      await onDelete();
      setPreview(null);
      setCacheBust(Date.now());
      setShowDeleteDialog(false);
      toast({
        title: 'Avatar removed',
        description: 'Your profile picture has been removed successfully.',
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: error?.response?.data?.message || 'Failed to remove avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const avatarSrc = preview || currentAvatar;
  const displayUrl = avatarSrc ? getAvatarUrl(avatarSrc, cacheBust) : undefined;

  return (
    <>
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <div
          className={cn(
            'relative group',
            sizeClasses[size],
            dragActive && 'ring-2 ring-primary ring-offset-2'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Avatar className={cn('h-full w-full', sizeClasses[size])}>
            <AvatarImage 
              src={displayUrl}
              alt="Profile picture"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
              {initials.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Photo
        </Button>

        {(currentAvatar || preview) && onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG, GIF, or WEBP. Max size 5MB.
      </p>
    </div>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Avatar?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove your profile picture? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUploading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isUploading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
