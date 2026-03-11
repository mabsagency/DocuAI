/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    esmExternals: "loose",
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
