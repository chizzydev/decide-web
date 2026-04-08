// decide-web/src/app/layout.tsx
// Root layout — wraps every page in the app.
// Loads fonts, sets metadata, applies providers.

import type { Metadata, Viewport } from 'next'
import { Geist }            from 'next/font/google'
import { SessionProvider }  from '@/components/providers/SessionProvider'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'

const geist = Geist({
  subsets:  ['latin'],
  variable: '--font-geist',
  display:  'swap',
})

export const metadata: Metadata = {
  title: {
    default:  "Decide — Nigeria's Smartest Phone Advisor",
    template: '%s | Decide',
  },
  description:
    'Answer five questions. Get the perfect phone for your budget and lifestyle — with real Nigerian prices, store links, and gray market warnings.',
  keywords: [
    'buy phone Nigeria',
    'best phone Nigeria',
    'phone recommendation Nigeria',
    'cheap phones Nigeria',
    'Jumia phones',
    'Slot phones',
  ],
  authors:      [{ name: 'Decide' }],
  creator:      'Decide',
  metadataBase: new URL('https://decide.com.ng'),
  openGraph: {
    type:        'website',
    locale:      'en_NG',
    url:         'https://decide.com.ng',
    siteName:    'Decide',
    title:       "Decide — Nigeria's Smartest Phone Advisor",
    description: 'Answer five questions. Get the perfect phone for your budget and lifestyle.',
    images: [
      {
        url:    '/images/og-image.png',
        width:  1200,
        height: 630,
        alt:    "Decide — Nigeria's Smartest Phone Advisor",
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       "Decide — Nigeria's Smartest Phone Advisor",
    description: 'Answer five questions. Get the perfect phone for your budget and lifestyle.',
    images:      ['/images/og-image.png'],
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#0F0F0D',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="font-ui bg-bg text-text-primary antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}