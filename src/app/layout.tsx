import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Geist } from 'next/font/google'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { SavedPhonesProvider } from '@/components/providers/SavedPhonesProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { SITE_URL } from '@/lib/seo'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Decide',
  title: {
    default: "Decide - Nigeria's Smartest Phone Advisor",
    template: '%s | Decide',
  },
  description:
    'Decide helps Nigerian buyers choose the right phone with live local prices, buy-or-wait verdicts, Jiji marketplace context, alerts, and gray-market warnings.',
  keywords: [
    'buy phone Nigeria',
    'best phone Nigeria',
    'phone recommendation Nigeria',
    'phone price alerts Nigeria',
    'Jiji phone deals Nigeria',
    'used iPhone Nigeria',
    'Android phones Nigeria',
    'cheap phones Nigeria',
    'Jumia phones',
    'Slot phones',
  ],
  authors: [{ name: 'Decide' }],
  creator: 'Decide',
  publisher: 'Decide',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: '/',
    siteName: 'Decide',
    title: "Decide - Nigeria's Smartest Phone Advisor",
    description:
      'Live Nigerian phone prices, buy-or-wait verdicts, Jiji marketplace context, alerts, and safer buying guidance.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: "Decide - Nigeria's phone buying intelligence",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Decide - Nigeria's Smartest Phone Advisor",
    description:
      'Live Nigerian phone prices, buy-or-wait verdicts, Jiji marketplace context, alerts, and safer buying guidance.',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F0F0D',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const sameAs = [
    process.env.NEXT_PUBLIC_SOCIAL_X_URL,
    process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP_URL,
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL,
  ].filter((url): url is string => Boolean(url))

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Decide',
    url: SITE_URL,
    description:
      'Nigeria phone buying intelligence for live prices, alerts, buy-or-wait verdicts, and marketplace guidance.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/phones?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Decide',
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      ...(sameAs.length > 0 ? { sameAs } : {}),
    },
  }

  return (
    <html lang="en" className={geist.variable} data-scroll-behavior="smooth">
      <body className="font-ui bg-bg text-text-primary antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <SessionProvider>
          <SavedPhonesProvider>{children}</SavedPhonesProvider>
        </SessionProvider>
        <Suspense fallback={null}>
          <AnalyticsProvider />
        </Suspense>
      </body>
    </html>
  )
}
