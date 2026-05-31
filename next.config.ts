import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Self-contained server bundle for Docker images.
  output: "standalone",
  // Lint runs as a dedicated CI step (see .github/workflows/ci.yml), not during
  // `next build`, so the production build stays fast and deterministic.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors must never reach production — keep build-time checking on.
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
