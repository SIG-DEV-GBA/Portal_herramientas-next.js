import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  logging: {
    fetches: {
      fullUrl: false
    }
  },
  // Mejorar performance en desarrollo
  swcMinify: true,
};
