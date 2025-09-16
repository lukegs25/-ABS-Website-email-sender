/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silence workspace root inference warning (multiple lockfiles on machine)
  outputFileTracingRoot: process.cwd()
};

export default nextConfig;


