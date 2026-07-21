import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build standalone: produce un server Node minimale (.next/standalone)
  // con solo le dipendenze runtime necessarie — usato dal Dockerfile per Coolify.
  output: "standalone",
};

export default nextConfig;
