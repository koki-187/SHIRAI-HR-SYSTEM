/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  // BACKEND_URL removed — all API routes are now Next.js serverless functions
}

module.exports = nextConfig
