import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-force-graph-2d", "force-graph"],
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
