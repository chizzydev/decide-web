// decide-web/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    // ✅ ALLOW LOCAL IMAGES (THIS FIXES YOUR ERROR)
    localPatterns: [
      {
        pathname: '/images/**', // allows /images/phones/... with query params
      },
    ],

    // ✅ REMOTE IMAGES (UNCHANGED)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fdn2.gsmarena.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ng.jumia.is',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
  },
}

export default nextConfig