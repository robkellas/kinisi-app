/**
 * Cache busting utilities for development
 */

/**
 * Generate a cache-busting query parameter based on build time
 * This ensures CSS and other assets are refreshed when the app is rebuilt
 */
export function getCacheBuster(): string {
  // In development, use current timestamp
  if (process.env.NODE_ENV === 'development') {
    return `v=${Date.now()}`;
  }
  
  // In production, use build ID if available
  return process.env.BUILD_ID ? `v=${process.env.BUILD_ID}` : `v=${Date.now()}`;
}

/**
 * Add cache-busting query parameter to a URL
 */
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${getCacheBuster()}`;
}

/**
 * Force reload the current page with cache busting
 * Useful for development when you need to ensure fresh assets
 */
export function forceReload(): void {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Clear browser cache programmatically
 * Note: This only works in development and may not work in all browsers
 */
export function clearBrowserCache(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Clear service worker cache if present
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Force reload
    forceReload();
  }
}

/**
 * Development helper to log cache status
 */
export function logCacheStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cache Status:', {
      buildTime: new Date().toISOString(),
      cacheBuster: getCacheBuster(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
    });
  }
}
