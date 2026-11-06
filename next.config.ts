import type { NextConfig } from "next";

// Unique per build: the service worker uses it to drop caches from older builds.
const buildVersion = Date.now().toString(36);

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_VERSION: buildVersion },
};

export default nextConfig;
