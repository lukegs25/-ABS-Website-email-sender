/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silence workspace root inference warning (multiple lockfiles on machine)
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      { source: "/student", destination: "/join", permanent: true },
      { source: "/teacher", destination: "/join", permanent: true },
    ];
  },
};

export default nextConfig;


