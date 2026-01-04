/**
 * Handy utilities for working with avatar images and user initials
 */

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get the full avatar URL from a relative path or full URL
 * @param avatarPath - The avatar path (can be relative or absolute)
 * @param cacheBust - Optional cache busting parameter (timestamp)
 * @returns The full avatar URL or undefined if no avatar
 */
export const getAvatarUrl = (
  avatarPath?: string | null,
  cacheBust?: number
): string | undefined => {
  if (!avatarPath) return undefined;

  // If they gave us a full URL already or a data URI, just use it
  if (
    avatarPath.startsWith("http://") ||
    avatarPath.startsWith("https://") ||
    avatarPath.startsWith("data:")
  ) {
    return cacheBust && !avatarPath.startsWith("data:")
      ? `${avatarPath}?t=${cacheBust}`
      : avatarPath;
  }

  // This is a relative path, so we need to build the full URL
  const baseUrl = avatarPath.startsWith("/") ? API_URL : `${API_URL}/`;
  const url = `${baseUrl}${avatarPath}`;

  return cacheBust ? `${url}?t=${cacheBust}` : url;
};

/**
 * Get user initials from name
 * @param fName - First name
 * @param lName - Last name
 * @param email - Email (fallback)
 * @returns Initials string
 */
export const getUserInitials = (
  fName?: string,
  lName?: string,
  email?: string
): string => {
  if (fName && lName) {
    return `${fName.charAt(0)}${lName.charAt(0)}`.toUpperCase();
  }
  if (fName) {
    return fName.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return "U";
};

/**
 * Validate avatar file
 * @param file - File to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateAvatarFile = (
  file: File
): { isValid: boolean; error?: string } => {
  // Make sure it's an image we can actually use
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Please upload a valid image file (JPG, PNG, GIF, or WEBP)",
    };
  }

  // Keep files under 5MB to avoid slowdowns
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "Image size must be less than 5MB",
    };
  }

  return { isValid: true };
};
