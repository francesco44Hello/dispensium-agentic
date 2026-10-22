import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stop Next.js writing AGENTS.md (managed agent rules and feedback blocks).
  agentRules: false,
  cacheComponents: true,
  // The dev indicator sits over the bottom nav and intercepts e2e clicks. Off only for the e2e dev server.
  devIndicators: process.env.E2E === '1' ? false : undefined,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Firebase sign-in opens a Google popup and polls its state; this keeps that working.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
