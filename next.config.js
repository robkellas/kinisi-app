/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cache busting and development optimizations
  generateBuildId: async () => {
    // Use timestamp for cache busting in development
    if (process.env.NODE_ENV === 'development') {
      return `dev-${Date.now()}`;
    }
    // Use default for production
    return null;
  },
  
  // Add cache headers for better control
  async headers() {
    return [
      {
        // Apply cache headers to all static assets
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate' 
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Specific headers for CSS files
        source: '/(.*)\\.css',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate' 
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Development-specific settings for better cache control
  ...(process.env.NODE_ENV === 'development' && {
    // Ensure fresh builds in development
    generateEtags: false,
  }),
}

module.exports = nextConfig
