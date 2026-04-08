// decide-web/src/app/(app)/phones/page.tsx
// Browse all phones — server component that reads URL search params
// for pre-filtering (brand, os_type, max_price, search query).
// Hands filtered data to PhoneGrid for rendering.

import type { Metadata } from 'next'
import type { PhoneCard } from '@/types'
import { phonesApi } from '@/lib/api'
import { PhoneGrid } from '@/components/phone'
import { PhoneFilters } from '@/components/phone'

export const metadata: Metadata = {
  title: 'Browse Phones — Decide',
  description:
    'Browse all phones available in Nigeria with real Naira prices across Jumia, Konga, and Slot.',
}

interface PhonesPageProps {
  searchParams: Promise<{
    brand?:     string
    os_type?:   string
    max_price?: string
    q?:         string
  }>
}

export default async function PhonesPage({ searchParams }: PhonesPageProps) {
  const params = await searchParams
  let phones: PhoneCard[] = []
  let error: string | null = null

  try {
    phones = await phonesApi.getAll({
      brand_slug: params.brand,
      os_type:    params.os_type as 'android' | 'ios' | undefined,
      max_price:  params.max_price ? Number(params.max_price) : undefined,
      search:     params.q,
    })
  } catch {
    error = 'Could not load phones. Please try again.'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          Browse Phones
        </h1>
        <p className="text-base text-text-secondary">
          {phones.length > 0
            ? `${phones.length} phone${phones.length === 1 ? '' : 's'} available in Nigeria`
            : 'All phones available in Nigeria'}
        </p>
      </div>

      {/* Filters — client component for interactivity */}
      <PhoneFilters
        currentBrand={params.brand}
        currentOs={params.os_type}
        currentMaxPrice={params.max_price ? Number(params.max_price) : undefined}
        currentSearch={params.q}
      />

      {/* Results */}
      {error ? (
        <div className="py-24 text-center space-y-2">
          <p className="text-base font-semibold text-text-primary">
            Something went wrong
          </p>
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      ) : phones.length === 0 ? (
        <div className="py-24 text-center space-y-2">
          <p className="text-2xl" aria-hidden="true">📱</p>
          <p className="text-base font-semibold text-text-primary">
            No phones found
          </p>
          <p className="text-sm text-text-secondary">
            Try adjusting your filters or{' '}
            <a href="/phones" className="text-accent hover:text-accent-hover">
              clear all filters
            </a>
          </p>
        </div>
      ) : (
        <PhoneGrid phones={phones} />
      )}
    </div>
  )
}