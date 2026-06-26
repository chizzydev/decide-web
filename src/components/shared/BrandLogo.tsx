// decide-web/src/components/shared/BrandLogo.tsx
// Shared brand mark with a text fallback when a local logo asset is absent.
'use client'

import React from 'react'
import Image from 'next/image'

type LogoSize = 'xs' | 'sm' | 'md' | 'lg'

interface BrandLogoProps {
  brandSlug: string
  brandName: string
  logoUrl?: string | null
  size?: LogoSize
  className?: string
}

const SIZES: Record<LogoSize, { container: string; image: number; text: string }> = {
  xs: { container: 'h-5 w-5', image: 20, text: 'text-[10px]' },
  sm: { container: 'h-6 w-6', image: 24, text: 'text-xs' },
  md: { container: 'h-8 w-8', image: 32, text: 'text-sm' },
  lg: { container: 'h-12 w-12', image: 48, text: 'text-base' },
}

// Only add a slug here after the matching local SVG is a real, non-empty asset.
const LOCAL_BRAND_LOGO_SLUGS = new Set<string>()

const getLogoPath = (slug: string): string | null =>
  LOCAL_BRAND_LOGO_SLUGS.has(slug) ? `/images/brands/${slug}.svg` : null

const getSafeLogoSource = (brandSlug: string, logoUrl?: string | null) => {
  const normalizedSlug = brandSlug.trim().toLowerCase()
  const derivedLogoPath = getLogoPath(normalizedSlug)

  if (!logoUrl) return derivedLogoPath

  if (logoUrl.startsWith('/images/brands/') && !derivedLogoPath) {
    return null
  }

  return logoUrl
}

const getInitials = (name: string): string => {
  const words = name.trim().split(' ').filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()

  return `${words[0]![0]}${words[1]![0]}`.toUpperCase()
}

export const BrandLogo = ({
  brandSlug,
  brandName,
  logoUrl,
  size = 'sm',
  className = '',
}: BrandLogoProps) => {
  const { container, image, text } = SIZES[size]
  const [hasImageError, setHasImageError] = React.useState(false)
  const src = getSafeLogoSource(brandSlug, logoUrl)
  const shouldShowLogo = Boolean(src && !hasImageError)

  return (
    <div
      className={[
        container,
        'relative flex shrink-0 items-center justify-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title={brandName}
    >
      {shouldShowLogo ? (
        <Image
          src={src!}
          alt={`${brandName} logo`}
          width={image}
          height={image}
          className="object-contain"
          onError={() => setHasImageError(true)}
        />
      ) : null}

      <div
        style={{ display: shouldShowLogo ? 'none' : 'flex' }}
        className={[
          'absolute inset-0 items-center justify-center rounded-sm',
          'bg-surfaceHigh font-ui font-bold text-text-secondary',
          text,
        ].join(' ')}
        aria-hidden="true"
      >
        {getInitials(brandName)}
      </div>
    </div>
  )
}
