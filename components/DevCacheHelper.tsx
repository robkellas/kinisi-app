'use client';

import { useEffect, useState } from 'react';
import { logCacheStatus, getCacheBuster, clearBrowserCache } from '@/lib/cacheUtils';

/**
 * Development-only component to help with cache debugging
 * Add this temporarily to your app when debugging cache issues
 */
export default function DevCacheHelper() {
  const [isVisible, setIsVisible] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<any>(null);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setCacheInfo({
        cacheBuster: getCacheBuster(),
        buildTime: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
      logCacheStatus();
    }
  }, []);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
        title="Cache Debug Helper"
      >
        🧹
      </button>

      {/* Cache info panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Cache Debug</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          {cacheInfo && (
            <div className="space-y-2 text-xs">
              <div>
                <strong>Cache Buster:</strong>
                <br />
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                  {cacheInfo.cacheBuster}
                </code>
              </div>
              
              <div>
                <strong>Build Time:</strong>
                <br />
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                  {new Date(cacheInfo.buildTime).toLocaleTimeString()}
                </code>
              </div>
              
              <div className="pt-2 space-y-1">
                <button
                  onClick={clearBrowserCache}
                  className="w-full px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                >
                  Clear Cache & Reload
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                >
                  Force Reload
                </button>
                
                <button
                  onClick={() => {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      registrations.forEach(registration => registration.unregister());
                      console.log('Service workers unregistered');
                    });
                  }}
                  className="w-full px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-xs"
                >
                  Clear Service Workers
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
