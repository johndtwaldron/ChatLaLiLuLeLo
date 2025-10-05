/**
 * Base Path Helper for GitHub Pages Project Sites
 * 
 * GitHub Pages project sites require a base path (e.g., /<repo-name>/).
 * This helper provides the base path for static assets and routing.
 */

// Get base path from build-time environment variables
export const BASE_PATH = 
  // Vite/Metro build-time variable (if available)
  (typeof __DEV__ !== 'undefined' && __DEV__) ? '' :
  // Build-time environment variable
  (process.env.BASE_PATH || '');

/**
 * Prepend base path to asset URLs for GitHub Pages project sites
 * @param path - The asset path (should start with '/')
 * @returns Full path with base path prepended if needed
 */
export const withBasePath = (path: string): string => {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Return base path + clean path, avoiding double slashes
  return BASE_PATH ? `${BASE_PATH}${cleanPath}` : cleanPath;
};

/**
 * Get the current base URL for API requests
 * This handles both local development and production deployment
 */
export const getApiUrl = (): string => {
  // Check for explicit API URL override (GitHub Pages deployment)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Local development fallback
  return 'http://localhost:8787';
};

/**
 * Parse URL parameters for future extensibility
 * Currently handles ?freq= parameter for frequency selection
 */
export const parseUrlParams = () => {
  if (typeof window === 'undefined') {
    return { freq: '140.85' };
  }
  
  const url = new URL(window.location.href);
  const freq = url.searchParams.get('freq') || '140.85';
  
  return { freq };
};
