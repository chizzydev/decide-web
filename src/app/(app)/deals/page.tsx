import type { Metadata } from 'next'
import Link from 'next/link'
import { DealsRetentionPanel } from '@/components/market/DealsRetentionPanel'
import { DealFeed } from '@/components/market/DealFeed'
import { MarketplaceLeadFeed } from '@/components/market/MarketplaceLeadFeed'
import { StructuredData } from '@/components/seo/StructuredData'
import { marketApi } from '@/lib/api'
import { BUDGET_GUIDES } from '@/lib/budgetGuides'
import { formatNairaCompact, formatRelativeTime } from '@/lib/formatters'
import { absoluteUrl, buildPageMetadata } from '@/lib/seo'
import {
  buildOfferStructuredData,
  buildProductStructuredDataDescription,
  getStructuredDataSellerName,
} from '@/lib/structuredData'
import type {
  MarketplaceLeadsResponse,
  PriceDropRadarItem,
  PriceDropRadarResponse,
} from '@/types'

const DEALS_PAGE_TITLE = 'Live Phone Deals in Nigeria: Drops & Market Radar - Decide'
const DEALS_PAGE_DESCRIPTION =
  'See tracked Jumia and Slot price drops, Jiji bargain leads, market confidence, best alternatives, and safer buy-or-wait guidance before you spend.'

export const metadata: Metadata = buildPageMetadata({
  title: DEALS_PAGE_TITLE,
  description: DEALS_PAGE_DESCRIPTION,
  path: '/deals',
  keywords: [
    'phone deals Nigeria',
    'price drop phones Nigeria',
    'best phone deals Nigeria',
    'Jumia Slot phone prices',
  ],
})

const BUDGET_CAP_NGN = 250_000
const FULL_RADAR_LIMIT = 50
const MARKETPLACE_LEAD_LIMIT = 50

const pickFreshestDeal = (deals: PriceDropRadarItem[]) =>
  [...deals].sort(
    (left, right) =>
      new Date(right.scraped_at).getTime() - new Date(left.scraped_at).getTime()
  )[0] ?? null

const pickBiggestPercentDeal = (deals: PriceDropRadarItem[]) =>
  [...deals]
    .filter((deal) => (deal.change_percent ?? 0) > 0)
    .sort((left, right) => (right.change_percent ?? 0) - (left.change_percent ?? 0))[0] ??
  null

const pickBudgetDeal = (deals: PriceDropRadarItem[]) =>
  deals.find((deal) => deal.current_price_ngn <= BUDGET_CAP_NGN) ?? null

const filterStoreDeals = (
  deals: PriceDropRadarItem[],
  store: PriceDropRadarItem['store']
) => deals.filter((deal) => deal.store === store)

const filterBudgetDeals = (deals: PriceDropRadarItem[]) =>
  deals.filter((deal) => deal.current_price_ngn <= BUDGET_CAP_NGN)

export default async function DealsPage() {
  let error: string | null = null
  let radar: PriceDropRadarResponse | null = null
  let marketplaceLeads: MarketplaceLeadsResponse | null = null
  let marketplaceStatus: 'ready' | 'empty' | 'unavailable' = 'unavailable'

  const [radarResult, marketplaceResult] = await Promise.allSettled([
    marketApi.getPriceDropRadar({ limit: FULL_RADAR_LIMIT, min_drop_ngn: 5000 }),
    marketApi.getMarketplaceLeads(MARKETPLACE_LEAD_LIMIT),
  ])

  if (radarResult.status === 'fulfilled') {
    radar = radarResult.value
  } else {
    error = 'Could not load live deals right now. Please try again.'
  }

  if (marketplaceResult.status === 'fulfilled') {
    marketplaceLeads = marketplaceResult.value
    marketplaceStatus = marketplaceLeads.offers.length > 0 ? 'ready' : 'empty'
  }

  const deals = radar?.deals ?? []
  const topDeal = deals[0] ?? null
  const totalDrop = deals.reduce((sum, deal) => sum + deal.change_amount_ngn, 0)
  const budgetDeals = filterBudgetDeals(deals)
  const jumiaDeals = filterStoreDeals(deals, 'jumia')
  const slotDeals = filterStoreDeals(deals, 'slot')
  const freshestDeal = pickFreshestDeal(deals)
  const biggestPercentDeal = pickBiggestPercentDeal(deals)
  const budgetLead = pickBudgetDeal(deals)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: DEALS_PAGE_TITLE,
    description: DEALS_PAGE_DESCRIPTION,
    url: absoluteUrl('/deals'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: deals.slice(0, 10).map((deal, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/phones/${deal.phone_slug}`),
        item: {
          '@type': 'Product',
          name: deal.phone_name,
          description: buildProductStructuredDataDescription(
            deal.phone_name,
            'live Nigerian price drops, trusted-store availability, and safer buy-or-wait guidance'
          ),
          brand: {
            '@type': 'Brand',
            name: deal.brand_name,
          },
          image: deal.image_url ?? undefined,
          offers: buildOfferStructuredData({
            price: deal.current_price_ngn,
            inStock: deal.in_stock,
            sellerName: getStructuredDataSellerName(deal.store),
            url: deal.url ?? absoluteUrl(`/phones/${deal.phone_slug}`),
          }),
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
              Price intelligence engine
            </p>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                Live deals radar for Nigeria
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
                Decide watches trusted store prices for real drops, then keeps Jiji in
                a separate marketplace lane for bargain leads, risk labels, and safe
                buying steps. Today&apos;s tighter shortlist lives on the daily route.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/deals/today"
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Open today&apos;s shortlist
              </Link>
              <Link
                href="/phones"
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                Browse all phones
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <HeroStat
              label="Live drops"
              value={radar ? String(deals.length) : '0'}
            />
            <HeroStat
              label="Combined value"
              value={radar ? formatNairaCompact(totalDrop) : 'N/A'}
            />
            <HeroStat
              label="Jiji leads"
              value={
                marketplaceStatus === 'ready'
                  ? String(marketplaceLeads?.offers.length ?? 0)
                  : marketplaceStatus === 'empty'
                    ? 'Watching'
                    : 'Connect API'
              }
            />
          </div>
        </div>
      </section>

      {deals.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <InsightCard
            eyebrow="Biggest live drop"
            title={topDeal?.phone_name ?? 'No lead deal yet'}
            description={
              topDeal
                ? `Down ${formatNairaCompact(topDeal.change_amount_ngn)} on ${topDeal.store === 'jumia' ? 'Jumia' : 'Slot'}, now at ${formatNairaCompact(topDeal.current_price_ngn)}.`
                : 'Waiting for the next meaningful drop.'
            }
            href={topDeal ? `/phones/${topDeal.phone_slug}` : '/phones'}
            actionLabel={topDeal ? 'View phone' : 'Browse phones'}
          />
          <InsightCard
            eyebrow="Best budget lead"
            title={budgetLead?.phone_name ?? `No live picks under ${formatNairaCompact(BUDGET_CAP_NGN)}`}
            description={
              budgetLead
                ? `Currently ${formatNairaCompact(budgetLead.current_price_ngn)} after a ${formatNairaCompact(budgetLead.change_amount_ngn)} drop. Good place to start if budget matters first.`
                : 'Budget-friendly drops will show up here once the live radar catches one.'
            }
            href="/deals/under/200k"
            actionLabel="Open budget guides"
          />
          <InsightCard
            eyebrow="Strongest percent move"
            title={biggestPercentDeal?.phone_name ?? 'No standout percentage shift yet'}
            description={
              biggestPercentDeal
                ? `Down ${Math.abs(biggestPercentDeal.change_percent ?? 0)}% in the latest tracked change window, which makes it one of the sharpest live moves in the catalog.`
                : 'Once a sharper percentage move lands, it will surface here.'
            }
            href={
              biggestPercentDeal
                ? `/buy-now-or-wait/${biggestPercentDeal.phone_slug}`
                : '/deals/today'
            }
            actionLabel={biggestPercentDeal ? 'Read verdict' : 'Open today'}
          />
        </section>
      ) : null}

      <MarketplaceLeadFeed
        offers={marketplaceLeads?.offers ?? []}
        status={marketplaceStatus}
        title="Jiji marketplace bargain radar"
        description="A separate used-market lane for fast-moving Jiji leads. These are not trusted retail prices, so Decide labels opportunity, risk, and safety steps before sending buyers out."
      />

      {error ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-bold text-text-primary">Live deals are unavailable</p>
          <p className="mt-2 text-sm text-text-secondary">{error}</p>
        </div>
      ) : (
        <>
          <DealFeed
            deals={deals}
            title="Fresh drops worth checking"
            description="This is the main radar feed: the strongest currently tracked drops across the stores Decide monitors."
            action={
              <Link
                href="/deals/today"
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                View today&apos;s tighter shortlist
              </Link>
            }
          />

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-text-primary">
                  Budget guides that stay tied to the live market
                </h2>
                <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                  These routes turn Decide&apos;s live price engine into cleaner under-X landing pages for buyers who start from a hard budget ceiling.
                </p>
              </div>
              <Link
                href="/phones"
                className="text-sm font-semibold text-accent transition-colors duration-fast hover:text-accent-hover"
              >
                Browse full catalog
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {BUDGET_GUIDES.map((guide) => (
                <BudgetGuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          </section>

          <div className="grid gap-8 xl:grid-cols-2">
            <DealFeed
              deals={budgetDeals}
              eyebrow="Budget radar"
              title={`Good live drops under ${formatNairaCompact(BUDGET_CAP_NGN)}`}
              description="For buyers who care about real affordability first, this section narrows the radar down to stronger budget-range movement."
              emptyTitle="No live budget drops right now"
              emptyDescription="Budget-friendly phones are still being tracked. When the next meaningful cut lands below the current threshold, it will surface here."
              action={
                <Link
                  href="/deals/under/200k"
                  className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                >
                  Open budget pages
                </Link>
              }
            />

            <div className="space-y-8">
              <DealFeed
                deals={jumiaDeals}
                eyebrow="Store focus"
                title="Jumia moves"
                description="A narrower cut of the radar for buyers who prefer to start with Jumia pricing."
                emptyTitle="No Jumia drops in this pass"
                emptyDescription="Jumia is still being tracked. This section will refill once the next meaningful Jumia-side drop lands."
              />

              <DealFeed
                deals={slotDeals}
                eyebrow="Store focus"
                title="Slot moves"
                description="The latest live cuts tied specifically to Slot listings."
                emptyTitle="No Slot drops in this pass"
                emptyDescription="Slot listings are still being tracked. This section will refill once the next meaningful Slot-side drop lands."
              />
            </div>
          </div>

          <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Freshest signal
                </p>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-text-primary">
                    {freshestDeal ? freshestDeal.phone_name : 'Waiting for the next store refresh'}
                  </h2>
                  <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                    {freshestDeal
                      ? `Latest tracked update came from ${freshestDeal.store === 'jumia' ? 'Jumia' : 'Slot'} ${formatRelativeTime(freshestDeal.scraped_at)}. Use the verdict pages if you want Decide to tell you whether the drop is worth acting on.`
                      : 'The live radar will surface the freshest tracked deal here as soon as the next qualifying update lands.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={freshestDeal ? `/buy-now-or-wait/${freshestDeal.phone_slug}` : '/deals/today'}
                  className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
                >
                  {freshestDeal ? 'Read buy/wait verdict' : 'Open today'}
                </Link>
                <Link
                  href="/compare"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-teal-600/30 bg-tealTint px-4 text-sm font-black text-teal-700 transition-colors duration-fast hover:border-teal-600/40 hover:bg-accent/10 hover:text-teal-800"
                >
                  Compare phones
                </Link>
              </div>
            </div>
          </section>

          <DealsRetentionPanel />
        </>
      )}
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

interface InsightCardProps {
  eyebrow: string
  title: string
  description: string
  href: string
  actionLabel: string
}

const InsightCard = ({
  eyebrow,
  title,
  description,
  href,
  actionLabel,
}: InsightCardProps) => (
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

const BudgetGuideCard = ({ guide }: { guide: (typeof BUDGET_GUIDES)[number] }) => (
  <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
        Budget guide
      </p>
      <div className="space-y-1">
        <h3 className="text-xl font-black tracking-tight text-text-primary">
          {guide.label}
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {guide.shortDescription}
        </p>
      </div>
      <Link
        href={`/deals/under/${guide.slug}`}
        className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        Open guide
      </Link>
    </div>
  </section>
)
