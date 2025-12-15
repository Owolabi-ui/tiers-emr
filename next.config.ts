import type { NextConfig } from "next";
import path from "path";

const nextConfig = {
  // Ensure Turbopack uses this project as the root (avoid picking other lockfiles on Desktop)
  turbopack: {
    root: path.resolve(__dirname),
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
} satisfies NextConfig as any;

export default nextConfig;
