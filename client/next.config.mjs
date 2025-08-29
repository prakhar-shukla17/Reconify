/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Next.js to run on port 3001
  experimental: {
    // This ensures consistent port usage
  },

  // Proxy API requests to backend server
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "production"
            ? `${process.env.BACKEND_URL || "http://localhost:3000"}/api/:path*`
            : "http://localhost:3000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
