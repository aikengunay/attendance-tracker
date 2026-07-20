import type { NextConfig } from "next";
import os from "node:os";

/** Next 16 blocks /_next/* from non-localhost origins unless listed here. */
function lanDevOrigins(): string[] {
  const origins = new Set<string>(["127.0.0.1", "localhost"]);
  try {
    for (const addrs of Object.values(os.networkInterfaces())) {
      if (!addrs) continue;
      for (const a of addrs) {
        if (!a.internal && a.family === "IPv4") {
          origins.add(a.address);
        }
      }
    }
  } catch {
    /* ignore */
  }
  return [...origins];
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: lanDevOrigins(),
  outputFileTracingIncludes: {
    "/**": [
      "./lib/generated/**/*",
      "./node_modules/pg/**/*",
      "./node_modules/@prisma/adapter-pg/**/*",
      "./prisma/**/*",
      "./.cursor/references/complete-attendance-tracker/**/*",
    ],
  },
};

export default nextConfig;
