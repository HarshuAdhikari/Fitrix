import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@fitrix/ui", "@fitrix/types"],
  experimental: {
    optimizePackageImports: ["@fitrix/ui"],
  },
};

export default nextConfig;
