import type { Metadata } from 'next'

export const SITE_NAME = 'Decide'
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://decide.com.ng')
const DEFAULT_OG_IMAGE = '/images/og-image.png'

interface BuildPageMetadataOptions {
  title: string
  description: string
  path?: string
  keywords?: string[]
  type?: 'website' | 'article'
  image?: string
}

export const buildPageMetadata = ({
  title,
  description,
  path,
  keywords,
  type = 'website',
  image = DEFAULT_OG_IMAGE,
}: BuildPageMetadataOptions): Metadata => {
  const metadata: Metadata = {
    title,
    description,
    keywords,
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }

  if (path) {
    metadata.alternates = {
      canonical: path,
    }
    metadata.openGraph = {
      ...metadata.openGraph,
      url: path,
    }
  }

  return metadata
}

export const absoluteUrl = (path: string) =>
  path.startsWith('http') ? path : `${SITE_URL}${path}`
