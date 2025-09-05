import type { NextConfig } from "next";
import path from "path";

const nextConfig = {
  // Ensure Turbopack uses this project as the root (avoid picking other lockfiles on Desktop)
  turbopack: {
    root: path.resolve(__dirname),
  },
} satisfies NextConfig as any;

export default nextConfig;
