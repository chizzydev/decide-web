import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DealFeed } from '@/components/market/DealFeed'
import type { Brand, CatalogDiscoverySignal, PhoneCard } from '@/types'
import { marketApi, phonesApi } from '@/lib/api'
import { CATALOG_BROWSE_MAX_VISIBLE } from '@/lib/brandCatalog'
import { buildCatalogSignals } from '@/lib/catalogSignals'
import { formatNairaCompact } from '@/lib/formatters'
import { getPrimaryPhoneCardCompareAction } from '@/lib/relatedCompare'
import { getCachedBrandBySlug } from '@/lib/serverCatalogCache'
import { ShortlistBuilderPanel } from '@/components/market/ShortlistBuilderPanel'
import { PhoneGrid } from '@/components/phone'
import { BrandLogo } from '@/components/shared'

interface BrandPageProps {
  params: Promise<{ brand: string }>
}

const getTrackedPriceRange = (phones: PhoneCard[]) => {
  const prices = phones.flatMap((phone) =>
    phone.prices
      .filter((price) => price.price_ngn > 0)
      .map((price) => price.price_ngn)
  )

  if (prices.length === 0) {
    return null
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
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

const getPriceLead = (phones: PhoneCard[]) =>
  [...phones].sort((left, right) => {
    const leftPrice = getLowestTrackedPrice(left) ?? Number.MAX_SAFE_INTEGER
    const rightPrice = getLowestTrackedPrice(right) ?? Number.MAX_SAFE_INTEGER

    return leftPrice - rightPrice
  })[0] ?? null

interface BrandCompareSuggestion {
  left: PhoneCard
  right: PhoneCard
  href: string
  reason: string
}

const getBrandCompareSuggestions = (phones: PhoneCard[], limit = 2) => {
  const suggestions: BrandCompareSuggestion[] = []
  const seenPairs = new Set<string>()

  for (const phone of phones) {
    const compareAction = getPrimaryPhoneCardCompareAction(phone, phones)

    if (!compareAction) {
      continue
    }

    const pairKey = [phone.slug, compareAction.counterpart.slug].sort().join('::')

    if (seenPairs.has(pairKey)) {
      continue
    }

    suggestions.push({
      left: phone,
      right: compareAction.counterpart,
      href: compareAction.href,
      reason:
        compareAction.reason ??
        `Pressure-test ${phone.name} against ${compareAction.counterpart.name} before you commit to the ${phone.brand_name} lineup.`,
    })

    seenPairs.add(pairKey)

    if (suggestions.length >= limit) {
      break
    }
  }

  return suggestions
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  try {
    const { brand } = await params
    const data = await getCachedBrandBySlug(brand)

    return {
      title: `${data.name} Phones - Decide`,
      description: `Browse ${data.name} phones in Nigeria with Decide scores, tracked prices, and side-by-side comparisons.`,
    }
  } catch {
    return {
      title: 'Brand Phones - Decide',
    }
  }
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand: brandSlug } = await params

  let brand: Brand
  let phones: PhoneCard[] = []
  let signalsBySlug: Record<string, CatalogDiscoverySignal | undefined> = {}
  let brandDeals: Awaited<ReturnType<typeof marketApi.getPriceDropRadar>>['deals'] = []

  try {
    const [brandResult, phoneResults, radar] = await Promise.all([
      getCachedBrandBySlug(brandSlug),
      phonesApi.getAll({
        brand_slug: brandSlug,
        limit: CATALOG_BROWSE_MAX_VISIBLE,
      }),
      marketApi
        .getPriceDropRadar({
          limit: 50,
          brand_slug: brandSlug,
          min_drop_ngn: 5000,
        })
        .catch(() => null),
    ])

    brand = brandResult
    phones = phoneResults
    signalsBySlug = buildCatalogSignals(phones, radar?.deals ?? [])
    brandDeals = radar?.deals ?? []
  } catch {
    notFound()
  }

  const priceRange = getTrackedPriceRange(phones)
  const valueLead = getValueLead(phones)
  const supportLead = getSupportLead(phones)
  const priceLead = getPriceLead(phones)
  const compareSuggestions = getBrandCompareSuggestions(phones)

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link
          href="/brands"
          className="transition-colors duration-fast hover:text-text-secondary"
        >
          Brands
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-text-secondary">{brand.name}</span>
      </nav>

      <section className="overflow-hidden rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface">
        <div className="flex flex-col gap-6 px-5 py-6 md:px-8 md:py-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface shadow-sm">
                <BrandLogo
                  brandSlug={brand.slug}
                  brandName={brand.name}
                  logoUrl={brand.logo_url}
                  size="lg"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Brand guide
                </p>
                <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                  {brand.name} phones in Nigeria
                </h1>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Browse the current {brand.os_type === 'ios' ? 'iPhone' : brand.name} lineup with tracked prices, Decide scores, and quick paths into compare.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <BrandStatPill
                label="Catalog"
                value={`${phones.length} phone${phones.length === 1 ? '' : 's'}`}
              />
              <BrandStatPill
                label="Platform"
                value={brand.os_type === 'ios' ? 'iPhone' : 'Android'}
              />
              <BrandStatPill
                label="Tracked prices"
                value={
                  priceRange
                    ? `${formatNairaCompact(priceRange.min)} - ${formatNairaCompact(priceRange.max)}`
                    : 'Limited data'
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/phones?brand=${brand.slug}`}
              className="inline-flex items-center justify-center rounded-full border border-accent/15 bg-tealTint px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-accent transition-colors duration-fast hover:border-accent/25 hover:bg-accent-subtle"
            >
              Open filtered browse
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-text-primary transition-colors duration-fast hover:border-borderHigh hover:bg-surfaceHigh"
            >
              Start compare
            </Link>
          </div>
        </div>
      </section>

      {phones.length > 0 ? (
        <ShortlistBuilderPanel
          contextLabel={`${brand.name} shortlist`}
          title={`Narrow the ${brand.name} lineup before you buy`}
          description={`Brand pages are where shortlist decisions usually start getting real. Save the ${brand.name} phones that survive your first cut, then use Watchlist and Compare to decide which model actually deserves your money.`}
        />
      ) : null}

      {phones.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <BrandInsightCard
            eyebrow="Value lead"
            title={valueLead?.name ?? `No ${brand.name} value lead yet`}
            description={
              valueLead
                ? `${valueLead.name} currently looks like the strongest Decide value pick inside the ${brand.name} lineup.`
                : 'Waiting for enough tracked models to surface a clear value lead.'
            }
            href={
              valueLead ? `/worth-it/${valueLead.slug}` : `/phones?brand=${brand.slug}`
            }
            actionLabel={valueLead ? 'Read still worth it' : 'Browse lineup'}
          />
          <BrandInsightCard
            eyebrow="Support lead"
            title={supportLead?.name ?? `No ${brand.name} support lead yet`}
            description={
              supportLead
                ? `${supportLead.name} currently carries one of the healthier support runways in this brand lane, which matters if you plan to keep the phone for a while.`
                : 'As more support data fills in, the stronger long-term pick will surface here.'
            }
            href={
              supportLead
                ? `/buy-now-or-wait/${supportLead.slug}`
                : `/phones?brand=${brand.slug}`
            }
            actionLabel={supportLead ? 'Read buy or wait' : 'Browse lineup'}
          />
          <BrandInsightCard
            eyebrow="Entry price"
            title={priceLead?.name ?? `No ${brand.name} price entry yet`}
            description={
              priceLead && getLowestTrackedPrice(priceLead) != null
                ? `${priceLead.name} is currently the lowest tracked price entry in the ${brand.name} lineup at ${formatNairaCompact(getLowestTrackedPrice(priceLead)!)}.`
                : 'As soon as the tracked price lane is clearer, the easiest current entry point will show up here.'
            }
            href={priceLead ? `/phones/${priceLead.slug}` : `/phones?brand=${brand.slug}`}
            actionLabel={priceLead ? 'View phone' : 'Browse lineup'}
          />
        </section>
      ) : null}

      {brandDeals.length > 0 ? (
        <DealFeed
          deals={brandDeals.slice(0, 6)}
          eyebrow={`${brand.name} market pulse`}
          title={`${brand.name} models moving right now`}
          description={`These are the current tracked ${brand.name} price cuts Decide has picked up across Jumia and Slot, so you can see where the lineup is actually shifting instead of browsing it as a static catalog.`}
          action={
            <Link
              href="/deals"
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Open full deals radar
            </Link>
          }
        />
      ) : null}

      {compareSuggestions.length > 0 ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Brand finalists
            </p>
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              Head-to-head paths inside the {brand.name} lineup
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              Once a brand page gets close to a decision, the next smartest move is usually a direct compare between the two models living in the same buying lane.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {compareSuggestions.map((suggestion) => (
              <BrandCompareCard
                key={`${suggestion.left.slug}-${suggestion.right.slug}`}
                suggestion={suggestion}
              />
            ))}
          </div>
        </section>
      ) : null}

      <PhoneGrid
        phones={phones}
        signalsBySlug={signalsBySlug}
        title={`${brand.name} phones`}
        subtitle={
          phones.length > 0
            ? `Tracked models available for side-by-side comparison and price checking.`
            : `No tracked ${brand.name} phones are available yet.`
        }
        emptyMessage={`No ${brand.name} phones found yet.`}
      />
    </div>
  )
}

interface BrandStatPillProps {
  label: string
  value: string
}

const BrandStatPill = ({ label, value }: BrandStatPillProps) => (
  <div className="rounded-full border border-border bg-surfaceHigh px-3 py-1.5 text-xs">
    <span className="font-bold uppercase tracking-[0.14em] text-text-muted">
      {label}
    </span>
    <span className="ml-2 font-semibold text-text-primary">{value}</span>
  </div>
)

interface BrandInsightCardProps {
  eyebrow: string
  title: string
  description: string
  href: string
  actionLabel: string
}

const BrandInsightCard = ({
  eyebrow,
  title,
  description,
  href,
  actionLabel,
}: BrandInsightCardProps) => (
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

const BrandCompareCard = ({
  suggestion,
}: {
  suggestion: BrandCompareSuggestion
}) => (
  <article className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Compare inside the lineup
        </p>
        <h3 className="text-xl font-black tracking-tight text-text-primary">
          {suggestion.left.name} vs {suggestion.right.name}
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {suggestion.reason}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[suggestion.left, suggestion.right].map((phone) => (
          <div
            key={phone.slug}
            className="rounded-2xl border border-border bg-surfaceHigh px-4 py-4"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                {phone.brand_name}
              </p>
              <h4 className="text-sm font-bold text-text-primary">{phone.name}</h4>
              <p className="text-sm text-text-secondary">
                {getLowestTrackedPrice(phone) != null
                  ? formatNairaCompact(getLowestTrackedPrice(phone)!)
                  : 'Waiting for tracked price'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href={suggestion.href}
        className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        Open comparison
      </Link>
    </div>
  </article>
)
