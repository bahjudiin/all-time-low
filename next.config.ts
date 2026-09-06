import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "@tanstack/react-table"],
  },
  async redirects() {
    return [
      { source: "/prediction", destination: "/", permanent: true },
      { source: "/liquidations", destination: "/", permanent: true },
    ];
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
