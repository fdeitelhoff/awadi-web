import type { NextConfig } from "next";
import { execSync } from "child_process";
import pkg from "./package.json";

let gitHash = "unknown";
try {
  gitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch {
  // git not available (e.g. some CI environments)
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_COMMIT: gitHash,
  },
};

export default nextConfig;
