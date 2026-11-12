/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep Windows static generation from racing on nested segment output directories.
  experimental: { cpus: 1 },
};
export default nextConfig;
