import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const isProduction = process.env.NODE_ENV === 'production'
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')

const connectSources = [
  "'self'",
  'https://decide-api-production-8aa7.up.railway.app',
  ...(configuredApiUrl && (!isProduction || configuredApiUrl.startsWith('https://'))
    ? [configuredApiUrl]
    : []),
  ...(!isProduction
    ? ['http://localhost:3001', 'http://127.0.0.1:3001']
    : []),
  'https://accounts.google.com',
  'https://*.sentry.io',
  'https://*.ingest.sentry.io',
  'https://vercel.live',
  'wss://ws-us3.pusher.com',
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    localPatterns: [
      {
        pathname: '/images/**',
      },
    ],
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

  async headers() {
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://vercel.live",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://fdn2.gsmarena.com https://ng.jumia.is https://lh3.googleusercontent.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          `connect-src ${Array.from(new Set(connectSources)).join(' ')}`,
          "frame-src 'self' https://accounts.google.com https://vercel.live",
          "upgrade-insecure-requests",
        ].join('; '),
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()',
      },
    ]

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
          },
        ],
      },
      {
        source: '/images/app-security/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
