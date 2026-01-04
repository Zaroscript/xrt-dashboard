// Utility functions for handling company logos

// Get API base URL for logo - use the same configuration as the rest of the app
const API_URL = import.meta.env.VITE_API_URL;

export const getApiBaseUrl = (): string => {
  return API_URL;
};

// Construct full logo URL
export const getLogoUrl = (logoPath: string | undefined | null): string | undefined => {
  if (!logoPath) {
    return undefined;
  }
  
  // If already a full URL, return as is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  
  // If it's a relative path, prepend with base URL
  const baseUrl = getApiBaseUrl();
  const fullUrl = `${baseUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
  // Add cache-busting parameter to prevent browser caching issues
  const cacheBustedUrl = `${fullUrl}?t=${Date.now()}`;
  return cacheBustedUrl;
};

// Convert logo URL to data URL for PDF compatibility
export const convertToDataUrl = async (url: string): Promise<string | undefined> => {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      return undefined;
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => {
        resolve(undefined);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return undefined;
  }
};
