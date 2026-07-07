/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  images: {
    domains: ["cdn.sanity.io", "image.mux.com"],
  },
};

export default nextConfig;
