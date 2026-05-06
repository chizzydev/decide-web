import type { Metadata } from 'next'
import Link from 'next/link'
import { DealsRetentionPanel } from '@/components/market/DealsRetentionPanel'
import { DealFeed } from '@/components/market/DealFeed'
import { MarketplaceLeadFeed } from '@/components/market/MarketplaceLeadFeed'
import { StructuredData } from '@/components/seo/StructuredData'
import { marketApi } from '@/lib/api'
import { formatNairaCompact, formatRelativeTime } from '@/lib/formatters'
import { absoluteUrl, buildPageMetadata } from '@/lib/seo'
import type { MarketplaceLeadsResponse, PriceDropRadarResponse } from '@/types'

export const metadata: Metadata = buildPageMetadata({
  title: "Today's phone deals - Decide",
  description:
    "See today's tighter shortlist of live phone price drops in Nigeria, built from the latest tracked store updates.",
  path: '/deals/today',
  keywords: [
    'today phone deals Nigeria',
    'today phone price drops Nigeria',
    'best phone deals today Nigeria',
  ],
})

export default async function DealsTodayPage() {
  let error: string | null = null
  let radar: PriceDropRadarResponse | null = null
  let marketplaceLeads: MarketplaceLeadsResponse | null = null
  let marketplaceStatus: 'ready' | 'empty' | 'unavailable' = 'unavailable'

  try {
    radar = await marketApi.getPriceDropRadar({ limit: 12, min_drop_ngn: 10000 })
  } catch {
    error = 'Could not load today’s shortlist right now. Please try again.'
  }

  try {
    marketplaceLeads = await marketApi.getMarketplaceLeads(6)
    marketplaceStatus = marketplaceLeads.offers.length > 0 ? 'ready' : 'empty'
  } catch {
    marketplaceLeads = null
  }

  const deals = radar?.deals ?? []
  const topDeal = deals[0] ?? null
  const totalDrop = deals.reduce((sum, deal) => sum + deal.change_amount_ngn, 0)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: "Today's phone deals - Decide",
    description:
      "See today's tighter shortlist of live phone price drops in Nigeria, built from the latest tracked store updates.",
    url: absoluteUrl('/deals/today'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: deals.slice(0, 10).map((deal, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/phones/${deal.phone_slug}`),
        item: {
          '@type': 'Product',
          name: deal.phone_name,
          brand: {
            '@type': 'Brand',
            name: deal.brand_name,
          },
          image: deal.image_url ?? undefined,
          offers: {
            '@type': 'Offer',
            price: deal.current_price_ngn,
            priceCurrency: 'NGN',
            availability: deal.in_stock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: deal.url ?? absoluteUrl(`/phones/${deal.phone_slug}`),
          },
        },
      })),
    },
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <StructuredData data={structuredData} />
      <section className="overflow-hidden rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-6 py-8 shadow-sm md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
              Daily shortlist
            </p>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                Today&apos;s strongest tracked drops
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
                This page is the tighter daily cut of Decide&apos;s live deals
                radar. It uses the latest tracked store refresh cycle to surface
                the drops most likely to matter today.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <HeroStat label="Shortlist" value={radar ? String(deals.length) : '0'} />
            <HeroStat
              label="Combined value"
              value={radar ? formatNairaCompact(totalDrop) : 'N/A'}
            />
            <HeroStat
              label="Generated"
              value={radar ? formatRelativeTime(radar.generated_at) : 'Waiting'}
            />
          </div>
        </div>
      </section>

      {topDeal ? (
        <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Lead deal right now
              </p>
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-text-primary">
                  {topDeal.phone_name}
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Down {formatNairaCompact(topDeal.change_amount_ngn)} on{' '}
                  {topDeal.store === 'jumia' ? 'Jumia' : 'Slot'}, currently at{' '}
                  {formatNairaCompact(topDeal.current_price_ngn)}.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/buy-now-or-wait/${topDeal.phone_slug}`}
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Read buy/wait verdict
              </Link>
              <Link
                href={`/phones/${topDeal.phone_slug}`}
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                View phone
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-bold text-text-primary">
            Today&apos;s shortlist is unavailable
          </p>
          <p className="mt-2 text-sm text-text-secondary">{error}</p>
        </div>
      ) : (
        <DealFeed
          deals={deals}
          eyebrow="Today"
          title="Daily shortlist"
          description="A tighter, cleaner cut of the live radar for buyers who want the fastest possible read on what moved today."
          action={
            <Link
              href="/deals"
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Open full radar
            </Link>
          }
          emptyTitle="No standout drops in today&apos;s pass"
          emptyDescription="The radar is still tracking live store prices. Once a stronger move lands in the latest refresh cycle, it will show up here."
        />
      )}

      <MarketplaceLeadFeed
        offers={marketplaceLeads?.offers ?? []}
        status={marketplaceStatus}
        title="Today's Jiji bargain leads"
        description="This separate lane can move faster than stable retail stores. Treat it as a shortlist of leads to inspect, not a safe-to-pay signal."
        compact
      />

      <section className="rounded-2xl border border-border bg-surface px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              How to use it
            </p>
            <h2 className="text-xl font-black tracking-tight text-text-primary">
              Treat the shortlist as a starting point, not a blind buy signal
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              A drop can still be a bad buy if support is weak, the price is still
              inflated, or a better option exists nearby. That is why the verdict
              pages and compare flow sit right next to the deals engine.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/compare"
              className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
            >
              Start compare
            </Link>
            <Link
              href="/deals"
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Open full radar
            </Link>
          </div>
        </div>
      </section>

      <DealsRetentionPanel
        title="Keep today’s shortlist working after this tab"
        description="The daily route is strongest when it feeds the retention loop too. Save the live finalists, protect the most price-sensitive one with an alert, and compare the survivors before you rush out to a seller."
      />
    </div>
  )
}

interface HeroStatProps {
  label: string
  value: string
}

const HeroStat = ({ label, value }: HeroStatProps) => (
  <div className="rounded-2xl border border-accent/10 bg-white/80 px-3 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
  </div>
)
