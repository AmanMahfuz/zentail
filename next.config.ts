import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for optimized serverless deployment
  output: "standalone",

  // Compress responses
  compress: true,

  // Cache static assets aggressively to avoid re-fetching on navigation
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
