import Link from 'next/link'
import { formatNaira, formatNairaCompact, formatRelativeTime } from '@/lib/formatters'
import type { MarketplaceLeadItem } from '@/types'

interface MarketplaceLeadFeedProps {
  offers?: MarketplaceLeadItem[] | null
  title?: string
  description?: string
  compact?: boolean
  status?: 'ready' | 'empty' | 'unavailable'
}

const qualityLabel: Record<MarketplaceLeadItem['deal_quality'], string> = {
  strong_lead: 'Strong lead',
  fair_lead: 'Fair lead',
  context_only: 'Context only',
  risky: 'High risk',
}

const riskClass: Record<MarketplaceLeadItem['risk_level'], string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  high: 'border-red-200 bg-red-50 text-red-700',
}

const fallbackReasonLabels = [
  'Marketplace price context',
  'Inspect the exact phone first',
  'Use a safe handoff before paying',
]

const getReasonLabels = (offer: MarketplaceLeadItem) =>
  Array.isArray(offer.reason_labels) && offer.reason_labels.length > 0
    ? offer.reason_labels
    : fallbackReasonLabels

const getRiskLevel = (offer: MarketplaceLeadItem): MarketplaceLeadItem['risk_level'] =>
  offer.risk_level ?? 'medium'

const getDealQuality = (
  offer: MarketplaceLeadItem
): MarketplaceLeadItem['deal_quality'] => offer.deal_quality ?? 'context_only'

const getVariantLabel = (offer: MarketplaceLeadItem) => {
  if (offer.variant_label) return offer.variant_label

  const parts = [
    offer.variant_storage_gb ? `${offer.variant_storage_gb}GB` : null,
    offer.variant_ram_gb ? `${offer.variant_ram_gb}GB RAM` : null,
  ].filter(Boolean)

  return parts.length ? parts.join(' / ') : null
}

const getMovementCopy = (offer: MarketplaceLeadItem) => {
  if (!offer.previous_price_ngn || offer.previous_price_ngn <= 0) return null

  const amount = offer.previous_price_ngn - offer.price_ngn
  if (amount > 0) {
    return {
      label: `Down ${formatNairaCompact(amount)}`,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }
  if (amount < 0) {
    return {
      label: `Up ${formatNairaCompact(Math.abs(amount))}`,
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    }
  }

  return {
    label: 'No Jiji move',
    className: 'border-border bg-surfaceHigh text-text-secondary',
  }
}

const getOfferAgeHours = (offer: MarketplaceLeadItem) => {
  const scrapedAt = new Date(offer.scraped_at).getTime()
  return Number.isFinite(scrapedAt)
    ? Math.max(0, (Date.now() - scrapedAt) / 3_600_000)
    : Number.POSITIVE_INFINITY
}

const getCanonicalOfferUrl = (offer: MarketplaceLeadItem) => {
  try {
    const parsed = new URL(offer.url)
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return offer.url
  }
}

const getFreshMarketplaceOffers = (offers: MarketplaceLeadItem[]) => {
  const seen = new Set<string>()
  return offers.filter((offer) => {
    if (getOfferAgeHours(offer) > 24) return false

    const key = getCanonicalOfferUrl(offer)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const getFreshnessCopy = (offer: MarketplaceLeadItem) => {
  const ageHours = getOfferAgeHours(offer)

  if (ageHours <= 6) {
    return {
      label: 'Fresh lead',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }

  if (ageHours <= 24) {
    return {
      label: 'Today',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
    }
  }

  return {
    label: 'Recheck first',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  }
}

export const MarketplaceLeadFeed = ({
  offers,
  title = 'Jiji marketplace intelligence',
  description = 'Separate used-market leads for buyers hunting bargains. These are not trusted Jumia or Slot retail prices.',
  compact = false,
  status = offers?.length ? 'ready' : 'empty',
}: MarketplaceLeadFeedProps) => {
  const visibleOffers = getFreshMarketplaceOffers(offers ?? [])
  const isReady = status === 'ready' && visibleOffers.length > 0

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/60 px-5 py-5 shadow-sm">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Marketplace lane
            </p>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-text-primary">
                {title}
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-amber-900">
                {description}
              </p>
            </div>
          </div>
          <Link
            href="/deals"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-black text-white shadow-sm transition-colors duration-fast hover:bg-accent-hover sm:w-fit"
          >
            Open market radar
          </Link>
        </div>

        {isReady ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-200 bg-white/70 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                Fresh leads
              </p>
              <p className="mt-1 text-lg font-black text-text-primary">
                {visibleOffers.length}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white/70 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                Source
              </p>
              <p className="mt-1 text-lg font-black text-text-primary">
                Jiji only
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white/70 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                Rule
              </p>
              <p className="mt-1 text-lg font-black text-text-primary">
                Inspect first
              </p>
            </div>
          </div>
        ) : null}

        {isReady ? (
          <div className={`grid gap-3 ${compact ? 'lg:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
            {visibleOffers.slice(0, compact ? 3 : 6).map((offer) => {
            const variantLabel = getVariantLabel(offer)
            const riskLevel = getRiskLevel(offer)
            const dealQuality = getDealQuality(offer)
            const reasonLabels = getReasonLabels(offer)
            const movement = getMovementCopy(offer)
            const freshness = getFreshnessCopy(offer)

            return (
              <article
                key={offer.id}
                className="rounded-2xl border border-amber-200 bg-white/90 px-4 py-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
                        {offer.brand_name}
                      </p>
                      <h3 className="text-lg font-black leading-tight tracking-tight text-text-primary">
                        {offer.phone_name}
                      </h3>
                      {variantLabel ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                          {variantLabel}
                        </p>
                      ) : null}
                      <p className="line-clamp-2 text-xs font-semibold text-text-secondary">
                        {offer.listing_title}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${riskClass[riskLevel]}`}
                    >
                      {riskLevel} risk
                    </span>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-3">
                    <p className="text-xl font-black text-amber-900">
                      {formatNaira(offer.price_ngn)}
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      {offer.location ?? 'Location not shown'} - synced{' '}
                      {formatRelativeTime(offer.scraped_at)}
                    </p>
                    {offer.trusted_price_ngn ? (
                      <p className="mt-2 text-xs font-semibold text-amber-900">
                        Trusted-store context: {formatNairaCompact(offer.trusted_price_ngn)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${freshness.className}`}>
                      {freshness.label}
                    </span>
                    {movement ? (
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${movement.className}`}>
                        {movement.label}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-accent-subtle px-2.5 py-1 text-[11px] font-bold text-accent">
                      {qualityLabel[dealQuality]}
                    </span>
                    <span className="rounded-full bg-surfaceHigh px-2.5 py-1 text-[11px] font-bold text-text-secondary">
                      {Math.round(offer.confidence_score)}% match
                    </span>
                  </div>

                  <ul className="space-y-1 text-xs leading-relaxed text-text-secondary">
                    {reasonLabels.slice(0, 3).map((reason) => (
                      <li key={reason}>- {reason}</li>
                    ))}
                  </ul>

                  <p className="text-xs leading-relaxed text-amber-900">
                    {offer.buyer_note ??
                      'Treat this as a marketplace lead only. Inspect the phone and seller before money moves.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/phones/${offer.phone_slug}`}
                      className="text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
                    >
                      View Decide page
                    </Link>
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center rounded-md border border-amber-300 bg-amber-50 px-3 text-sm font-bold text-amber-900 transition-colors duration-fast hover:bg-amber-100"
                    >
                      Open Jiji listing
                    </a>
                  </div>
                </div>
              </article>
            )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-white/80 px-5 py-6">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                {status === 'unavailable' ? 'Marketplace feed unavailable' : 'Marketplace radar waiting'}
              </p>
              <h3 className="text-xl font-black tracking-tight text-text-primary">
                {status === 'unavailable'
                  ? 'Jiji leads are not connected in this running build yet'
                  : 'No fresh Jiji leads worth spotlighting right now'}
              </h3>
              <p className="max-w-3xl text-sm leading-relaxed text-amber-900">
                {status === 'unavailable'
                  ? 'The web lane is ready, but the running API did not return the marketplace route. Restart the API after deploying the market route so this section can fill with scored Jiji leads.'
                  : 'Decide now keeps this lane fresh and separate from trusted Jumia and Slot pricing. When a useful recent Jiji lead is available, it will appear here with quality, risk, and safe-buying guidance.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/phones"
                  className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
                >
                  Browse phones
                </Link>
                <Link
                  href="/deals/today"
                  className="inline-flex h-10 items-center rounded-md border border-amber-300 bg-white px-4 text-sm font-bold text-amber-800 transition-colors duration-fast hover:bg-amber-50"
                >
                  Open today's radar
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
            Safety rule
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-900">
            Do not pay first. If the seller is outside your city, use a trusted person near the
            seller to inspect and complete the handoff before money moves.
          </p>
        </div>
      </div>
    </section>
  )
}
