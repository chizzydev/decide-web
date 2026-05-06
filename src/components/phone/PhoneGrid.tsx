// decide-web/src/components/phone/PhoneGrid.tsx
// Renders a responsive grid of PhoneCard components.
// Handles loading, empty, and error states internally so
// every page that shows a grid of phones does not repeat this logic.

import React from 'react'
import { PhoneCard } from './PhoneCard'
import { PhoneGridSkeleton } from '@/components/ui'
import { SectionHeader } from '@/components/shared'
import { getPrimaryPhoneCardCompareAction } from '@/lib/relatedCompare'
import type { CatalogDiscoverySignal, PhoneCard as PhoneCardType } from '@/types'

interface PhoneGridProps {
  phones:     PhoneCardType[]
  loading?:   boolean
  error?:     string | null
  // Optional title and subtitle rendered above the grid
  title?:     string
  subtitle?:  string
  // Optional trailing action in the section header (e.g. "View All")
  action?:    React.ReactNode
  // Number of skeleton cards shown while loading
  skeletonCount?: number
  // Empty state message override
  emptyMessage?:  string
  signalsBySlug?: Record<string, CatalogDiscoverySignal | undefined>
  className?:     string
}

export const PhoneGrid = ({
  phones,
  loading       = false,
  error         = null,
  title,
  subtitle,
  action,
  skeletonCount = 6,
  emptyMessage  = 'No phones found.',
  signalsBySlug = {},
  className     = '',
}: PhoneGridProps) => {
  const compareActionsBySlug = phones.reduce<Record<string, ReturnType<typeof getPrimaryPhoneCardCompareAction>>>(
    (acc, phone) => {
      acc[phone.slug] = getPrimaryPhoneCardCompareAction(phone, phones)
      return acc
    },
    {}
  )

  return (
    <section
      className={['space-y-6', className].filter(Boolean).join(' ')}
      aria-label={title ?? 'Phone grid'}
      aria-busy={loading}
    >
      {/* Section header — only rendered when title is provided */}
      {title && (
        <SectionHeader
          title={title}
          subtitle={subtitle}
          action={action}
        />
      )}

      {/* Loading state */}
      {loading && (
        <PhoneGridSkeleton count={skeletonCount} />
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          role="alert"
        >
          <div className="text-4xl mb-3" aria-hidden="true">⚠️</div>
          <p className="text-base font-semibold text-text-primary mb-1">
            Something went wrong
          </p>
          <p className="text-sm text-text-secondary max-w-xs">
            {error}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && phones.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          role="status"
        >
          <div className="text-4xl mb-3" aria-hidden="true">📱</div>
          <p className="text-base font-semibold text-text-primary mb-1">
            {emptyMessage}
          </p>
          <p className="text-sm text-text-secondary max-w-xs">
            Try adjusting your filters or search term.
          </p>
        </div>
      )}

      {/* Phone grid */}
      {!loading && !error && phones.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {phones.map((phone) => (
            <PhoneCard
              key={phone.slug}
              phone={phone}
              signal={signalsBySlug[phone.slug]}
              compareAction={compareActionsBySlug[phone.slug] ?? undefined}
              featured={phone.is_featured}
            />
          ))}
        </div>
      )}
    </section>
  )
}
