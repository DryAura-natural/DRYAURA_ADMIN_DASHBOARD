import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during builds
  },
  typescript: {
    ignoreBuildErrors: true, // Disable TypeScript checks during build
  },
  images: {
    domains: [
      "res.cloudinary.com"
    ],
  },
};

export default nextConfig;
