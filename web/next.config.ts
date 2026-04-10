import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-force-graph-2d", "force-graph"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
