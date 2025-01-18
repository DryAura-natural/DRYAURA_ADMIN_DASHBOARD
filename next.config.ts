import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during builds
  },
  images:{
    domains:[
      "res.cloudinary.com"
    ]
  }
};

export default nextConfig;
