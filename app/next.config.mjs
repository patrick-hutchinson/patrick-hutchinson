import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  turbopack: {
    root: appDir,
  },
  images: {
    domains: ["cdn.sanity.io", "image.mux.com"],
  },
};

export default nextConfig;
