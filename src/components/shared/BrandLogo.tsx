// decide-web/src/components/shared/BrandLogo.tsx
// Renders the correct brand SVG logo from public/images/brands/.
// Falls back to a text abbreviation if the logo file is not found.
// Used in phone cards, the brand picker, and the navbar search results.
'use client'

import React from 'react'
import Image from 'next/image'

type LogoSize = 'xs' | 'sm' | 'md' | 'lg'

interface BrandLogoProps {
  brandSlug:  string
  brandName:  string
  logoUrl?:   string | null
  size?:      LogoSize
  className?: string
}

const SIZES: Record<LogoSize, { container: string; image: number; text: string }> = {
  xs: { container: 'w-5 h-5',   image: 20, text: 'text-[10px]' },
  sm: { container: 'w-6 h-6',   image: 24, text: 'text-xs'     },
  md: { container: 'w-8 h-8',   image: 32, text: 'text-sm'     },
  lg: { container: 'w-12 h-12', image: 48, text: 'text-base'   },
}

// Derives the logo path from the brand slug when no explicit
// logoUrl is provided — covers all seeded brands.
const getLogoPath = (slug: string): string => {
  return `/images/brands/${slug}.svg`
}

// Returns the first 1–2 characters of the brand name as a
// text fallback when no logo is available.
// e.g. "Samsung" → "SA" | "Apple" → "AP" | "Itel" → "IT"
const getInitials = (name: string): string => {
  const words = name.trim().split(' ')
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
}

export const BrandLogo = ({
  brandSlug,
  brandName,
  logoUrl,
  size      = 'sm',
  className = '',
}: BrandLogoProps) => {
  const { container, image, text } = SIZES[size]

  // Use the explicit logoUrl if provided,
  // otherwise derive from the brand slug
  const src = logoUrl ?? getLogoPath(brandSlug)

  return (
    <div
      className={[
        container,
        'relative flex items-center justify-center shrink-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title={brandName}
    >
      <Image
        src={src}
        alt={`${brandName} logo`}
        width={image}
        height={image}
        className="object-contain"
        // On error, hide the broken image and show the text fallback.
        // The onError prop is a client-side handler — this works because
        // next/image renders an <img> tag that supports onError natively.
        onError={(e) => {
          const target = e.currentTarget
          target.style.display = 'none'

          // Show the sibling fallback div
          const fallback = target.nextElementSibling as HTMLElement | null
          if (fallback) fallback.style.display = 'flex'
        }}
      />

      {/* Text fallback — hidden by default, shown if image fails to load */}
      <div
        style={{ display: 'none' }}
        className={[
          'absolute inset-0 items-center justify-center',
          'bg-surfaceHigh rounded-sm',
          'font-ui font-bold text-text-secondary',
          text,
        ].join(' ')}
        aria-hidden="true"
      >
        {getInitials(brandName)}
      </div>
    </div>
  )
}