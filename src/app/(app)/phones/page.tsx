// decide-web/src/app/(app)/phones/page.tsx
// Browse all phones — server component that reads URL search params
// for pre-filtering (brand, os_type, max_price, search query).
// Hands filtered data to PhoneGrid for rendering.

import type { Metadata } from 'next'
import Link from 'next/link'
import type { Brand, CatalogDiscoverySignal, PhoneCard } from '@/types'
import { marketApi, phonesApi } from '@/lib/api'
import {
  CATALOG_BROWSE_MAX_VISIBLE,
  CATALOG_BROWSE_PAGE_SIZE,
  filterUserFacingBrands,
  filterUserFacingPhones,
  sortAndroidBrandsForUi,
} from '@/lib/brandCatalog'
import { normalizePhoneBrowseSearch } from '@/lib/phoneBrowseFilters'
import { buildCatalogSignals } from '@/lib/catalogSignals'
import { formatNairaCompact } from '@/lib/formatters'
import { getPrimaryPhoneCardCompareAction } from '@/lib/relatedCompare'
import { getCachedAndroidBrands } from '@/lib/serverCatalogCache'
import { ShortlistBuilderPanel } from '@/components/market/ShortlistBuilderPanel'
import { PhoneGrid } from '@/components/phone'
import { PhoneFilters } from '@/components/phone'

export const metadata: Metadata = {
  title: 'Browse Phones — Decide',
  description:
    'Browse all phones available in Nigeria with real Naira prices across Jumia and Slot.',
}

interface PhonesPageProps {
  searchParams: Promise<{
    brand?:     string
    os_type?:   string
    max_price?: string
    q?:         string
    limit?:     string
  }>
}

const getLowestTrackedPrice = (phone: PhoneCard) => {
  const prices = phone.prices
    .filter((price) => price.price_ngn > 0)
    .map((price) => price.price_ngn)

  if (prices.length === 0) {
    return null
  }

  return Math.min(...prices)
}

const getValueLead = (phones: PhoneCard[]) =>
  [...phones].sort((left, right) => right.score_value - left.score_value)[0] ?? null

const getSupportLead = (phones: PhoneCard[]) =>
  [...phones].sort((left, right) => {
    const leftSupport =
      Math.max(left.android_updates_years ?? 0, left.security_updates_years ?? 0)
    const rightSupport =
      Math.max(right.android_updates_years ?? 0, right.security_updates_years ?? 0)

    return rightSupport - leftSupport
  })[0] ?? null

const getEntryLead = (phones: PhoneCard[]) =>
  [...phones].sort((left, right) => {
    const leftPrice = getLowestTrackedPrice(left) ?? Number.MAX_SAFE_INTEGER
    const rightPrice = getLowestTrackedPrice(right) ?? Number.MAX_SAFE_INTEGER

    return leftPrice - rightPrice
  })[0] ?? null

export default async function PhonesPage({ searchParams }: PhonesPageProps) {
  const params = await searchParams
  let phones: PhoneCard[] = []
  let androidBrands: Brand[] = []
  let signalsBySlug: Record<string, CatalogDiscoverySignal | undefined> = {}
  let error: string | null = null
  let hasMorePhones = false

  const requestedLimit = Number(params.limit)
  const visibleLimit =
    Number.isFinite(requestedLimit) && requestedLimit > CATALOG_BROWSE_PAGE_SIZE
      ? Math.min(Math.floor(requestedLimit), CATALOG_BROWSE_MAX_VISIBLE)
      : CATALOG_BROWSE_PAGE_SIZE

  try {
    androidBrands = sortAndroidBrandsForUi(
      filterUserFacingBrands(await getCachedAndroidBrands().catch(() => []))
    )

    const normalizedSearch = normalizePhoneBrowseSearch(
      params.q,
      params.brand,
      androidBrands
    )
    const shouldFetchRadar = !normalizedSearch

    const filters = {
      brand_slug: params.brand,
      os_type:    params.os_type as 'android' | 'ios' | undefined,
      max_price:  params.max_price ? Number(params.max_price) : undefined,
      search:     normalizedSearch,
    }

    const [phoneResults, radar] = await Promise.all([
      phonesApi.getAll({
        ...filters,
        limit: visibleLimit + 1,
      }),
      shouldFetchRadar
        ? marketApi
            .getPriceDropRadar({
              limit: 50,
              brand_slug: filters.brand_slug,
              os_type: filters.os_type,
              max_price: filters.max_price,
              min_drop_ngn: 5000,
            })
            .catch(() => null)
        : Promise.resolve(null),
    ])

    const userFacingResults = filterUserFacingPhones(phoneResults)
    hasMorePhones = userFacingResults.length > visibleLimit
    phones = userFacingResults.slice(0, visibleLimit)
    signalsBySlug = buildCatalogSignals(phones, radar?.deals ?? [])
  } catch {
    error = 'Could not load phones. Please try again.'
  }

  const valueLead = getValueLead(phones)
  const supportLead = getSupportLead(phones)
  const entryLead = getEntryLead(phones)
  const compareLead =
    phones.length > 1 && phones[0]
      ? getPrimaryPhoneCardCompareAction(phones[0], phones)
      : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          Browse Phones
        </h1>
        <p className="text-base text-text-secondary">
          {phones.length > 0
            ? hasMorePhones
              ? `Showing ${phones.length} phones. Use filters or load more for the wider catalog.`
              : `${phones.length} phone${phones.length === 1 ? '' : 's'} available in Nigeria`
            : 'All phones available in Nigeria'}
        </p>
      </div>

      <section className="group overflow-hidden rounded-2xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-5 py-5 transition-colors duration-fast hover:border-accent/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              New
            </p>
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-text-primary">
                Live price drops across tracked stores
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
                Open the deals radar to see the latest tracked cuts before you browse the full catalog.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/deals"
              className="text-sm font-bold text-accent transition-colors duration-fast group-hover:text-accent-hover"
            >
              Open deals radar
            </Link>
            <span className="hidden text-sm text-text-muted md:inline">or</span>
            <Link
              href="/deals/today"
              className="text-sm font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
            >
              Today&apos;s shortlist
            </Link>
            <span className="hidden text-sm text-text-muted md:inline">or</span>
            <Link
              href="/deals/under/200k"
              className="text-sm font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
            >
              Budget guides
            </Link>
          </div>
        </div>
      </section>

      {/* Filters — client component for interactivity */}
      <PhoneFilters
        currentBrand={params.brand}
        currentOs={params.os_type}
        currentMaxPrice={params.max_price ? Number(params.max_price) : undefined}
        currentSearch={params.q}
        androidBrands={androidBrands}
      />

      <ShortlistBuilderPanel
        contextLabel="Browse workflow"
        title="Shortlist while you browse"
        description="Browse should help you narrow the field, not restart the decision every time. Save the phones that still look strong, then open Watchlist or Compare before you buy."
      />

      {phones.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <BrowseInsightCard
            eyebrow="Value lead"
            title={valueLead?.name ?? 'Waiting for a value lead'}
            description={
              valueLead
                ? `${valueLead.name} currently looks like one of the strongest Decide value picks in this result set.`
                : 'As the result set fills in, the stronger value candidate will show up here.'
            }
            href={valueLead ? `/worth-it/${valueLead.slug}` : '/phones'}
            actionLabel={valueLead ? 'Read still worth it' : 'Refresh browse'}
          />
          <BrowseInsightCard
            eyebrow="Support lead"
            title={supportLead?.name ?? 'Waiting for a support lead'}
            description={
              supportLead
                ? `${supportLead.name} currently looks like one of the healthier long-term ownership picks in this lane.`
                : 'The stronger long-term support candidate will show up here once the result set is clearer.'
            }
            href={supportLead ? `/buy-now-or-wait/${supportLead.slug}` : '/phones'}
            actionLabel={supportLead ? 'Read buy or wait' : 'Refresh browse'}
          />
          <BrowseInsightCard
            eyebrow="Entry price"
            title={entryLead?.name ?? 'Waiting for a lowest tracked entry'}
            description={
              entryLead && getLowestTrackedPrice(entryLead) != null
                ? `${entryLead.name} is currently the lowest tracked price entry here at ${formatNairaCompact(getLowestTrackedPrice(entryLead)!)}.`
                : 'As price coverage improves, the easiest current entry point will show up here.'
            }
            href={entryLead ? `/phones/${entryLead.slug}` : '/phones'}
            actionLabel={entryLead ? 'View phone' : 'Refresh browse'}
          />
        </section>
      ) : null}

      {compareLead && phones[0] ? (
        <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Compare next
              </p>
              <h2 className="text-2xl font-black tracking-tight text-text-primary">
                {phones[0].name} vs {compareLead.counterpart.name}
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                {compareLead.reason ??
                  `These two phones sit close enough in the current lane to justify a direct head-to-head before you keep browsing.`}
              </p>
            </div>

            <Link
              href={compareLead.href}
              className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
            >
              Open comparison
            </Link>
          </div>
        </section>
      ) : null}

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
        <div className="space-y-6">
          <PhoneGrid phones={phones} signalsBySlug={signalsBySlug} />
          {hasMorePhones ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-borderHigh bg-surface px-5 py-5 text-center shadow-sm">
              <p className="text-sm font-semibold text-text-primary">
                Showing {phones.length} phones so Browse stays fast.
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-text-secondary">
                Keep narrowing by brand, budget, or search, or load the next batch when you want to keep scanning.
              </p>
              <Link
                href={buildLoadMoreHref(params, Math.min(visibleLimit + CATALOG_BROWSE_PAGE_SIZE, CATALOG_BROWSE_MAX_VISIBLE))}
                scroll={false}
                className="mt-2 inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Show more phones
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

const buildLoadMoreHref = (
  params: Awaited<PhonesPageProps['searchParams']>,
  nextLimit: number
) => {
  const query = new URLSearchParams()

  if (params.brand) query.set('brand', params.brand)
  if (params.os_type) query.set('os_type', params.os_type)
  if (params.max_price) query.set('max_price', params.max_price)
  if (params.q) query.set('q', params.q)
  query.set('limit', String(nextLimit))

  return `/phones?${query.toString()}`
}

interface BrowseInsightCardProps {
  eyebrow: string
  title: string
  description: string
  href: string
  actionLabel: string
}

const BrowseInsightCard = ({
  eyebrow,
  title,
  description,
  href,
  actionLabel,
}: BrowseInsightCardProps) => (
  <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
        {eyebrow}
      </p>
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-text-primary">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        {actionLabel}
      </Link>
    </div>
  </section>
)
