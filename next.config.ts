import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ensure Turbopack uses this project as the root (avoid picking other lockfiles on Desktop)
  turbopack: {
    root: path.resolve(__dirname),
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Allow production builds to complete even if there are ESLint errors
    // !! WARN !!
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
