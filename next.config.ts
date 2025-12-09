import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-ignore - instrumentationHook is required for cron jobs but not in current Next.js types
    instrumentationHook: true,
  },
};

export default nextConfig;
