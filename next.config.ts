import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/**": [
      "./lib/generated/**/*",
      "./node_modules/better-sqlite3/**/*",
      "./prisma/**/*",
      "./.cursor/references/complete-attendance-tracker/**/*",
    ],
  },
};

export default nextConfig;
