import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stop Next.js writing AGENTS.md (managed agent rules and feedback blocks).
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Firebase sign-in opens a Google popup and polls its state; this keeps that working.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
