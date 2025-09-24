/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Force Next.js to run on port 3001
  experimental: {
    // This ensures consistent port usage
  },

  // Proxy API requests to backend server
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NODE_ENV === 'production' 
          ? "https://itam-328j.onrender.com/api/:path*"
          : "https://itam-328j.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
