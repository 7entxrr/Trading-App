import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating dev badge so it doesn't cover the bottom nav on mobile.
  devIndicators: false,
};

export default nextConfig;
