import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Button } from './button';
import { cn } from '@/lib/utils';

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
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
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
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload avatar');
      setPreview(null);
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
    
    if (confirm('Are you sure you want to remove your avatar?')) {
      try {
        setIsUploading(true);
        await onDelete();
        setPreview(null);
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete avatar');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const avatarSrc = preview || currentAvatar;

  return (
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
            src={avatarSrc ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${avatarSrc}` : undefined} 
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
            onClick={handleDelete}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG or GIF. Max size 5MB.
      </p>
    </div>
  );
};
