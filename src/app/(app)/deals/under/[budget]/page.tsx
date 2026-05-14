import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DealsRetentionPanel } from '@/components/market/DealsRetentionPanel'
import { DealFeed } from '@/components/market/DealFeed'
import { DecisionLoopPanel } from '@/components/market/DecisionLoopPanel'
import { StructuredData } from '@/components/seo/StructuredData'
import { marketApi } from '@/lib/api'
import {
  BUDGET_GUIDES,
  getBudgetGuide,
  getBudgetGuideMetaDescription,
  getBudgetGuideStatLabel,
} from '@/lib/budgetGuides'
import { formatNairaCompact, formatRelativeTime } from '@/lib/formatters'
import { absoluteUrl, buildPageMetadata } from '@/lib/seo'
import {
  buildOfferStructuredData,
  buildProductStructuredDataDescription,
  getStructuredDataSellerName,
} from '@/lib/structuredData'
import type { PriceDropRadarItem, PriceDropRadarResponse } from '@/types'

interface BudgetDealsPageProps {
  params: Promise<{ budget: string }>
}

const pickTopDeal = (deals: PriceDropRadarItem[]) => deals[0] ?? null

const pickCheapestDeal = (deals: PriceDropRadarItem[]) =>
  [...deals].sort((left, right) => left.current_price_ngn - right.current_price_ngn)[0] ?? null

const pickBiggestDrop = (deals: PriceDropRadarItem[]) =>
  [...deals].sort((left, right) => right.change_amount_ngn - left.change_amount_ngn)[0] ?? null

export async function generateStaticParams() {
  return BUDGET_GUIDES.map((guide) => ({ budget: guide.slug }))
}

export async function generateMetadata(
  { params }: BudgetDealsPageProps
): Promise<Metadata> {
  const { budget } = await params
  const guide = getBudgetGuide(budget)

  if (!guide) {
    return { title: 'Budget deals - Decide' }
  }

  return buildPageMetadata({
    title: `${guide.title} - Decide`,
    description: getBudgetGuideMetaDescription(guide),
    path: `/deals/under/${guide.slug}`,
    keywords: [
      `phones under ${guide.label.replace(/^Under\s+/i, '')} Nigeria`,
      `best phones ${guide.label.toLowerCase()} Nigeria`,
      `budget phone deals Nigeria`,
    ],
  })
}

export default async function BudgetDealsPage({ params }: BudgetDealsPageProps) {
  const { budget } = await params
  const guide = getBudgetGuide(budget)

  if (!guide) {
    notFound()
  }

  let error: string | null = null
  let radar: PriceDropRadarResponse | null = null

  try {
    radar = await marketApi.getPriceDropRadar({
      limit: 18,
      max_price: guide.maxPrice,
      min_drop_ngn: guide.minDropNgN,
    })
  } catch {
    error = `Could not load the ${guide.label.toLowerCase()} guide right now. Please try again.`
  }

  const deals = radar?.deals ?? []
  const topDeal = pickTopDeal(deals)
  const cheapestDeal = pickCheapestDeal(deals)
  const biggestDrop = pickBiggestDrop(deals)
  const totalDrop = deals.reduce((sum, deal) => sum + deal.change_amount_ngn, 0)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: guide.title,
    description: getBudgetGuideMetaDescription(guide),
    url: absoluteUrl(`/deals/under/${guide.slug}`),
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
            `${guide.label.toLowerCase()} Nigerian price drops, trusted-store availability, and budget buying guidance`
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
              Budget intelligence
            </p>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                {guide.title}
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
                {guide.description} Decide keeps the commercial links behind the verdict layer so this page helps you spend the budget well, not just click the cheapest thing first.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={`/phones?max_price=${guide.maxPrice}`}
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Browse phones under {getBudgetGuideStatLabel(guide.maxPrice)}
              </Link>
              <Link
                href="/deals"
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                Open full deals radar
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <BudgetHeroStat label="Budget cap" value={getBudgetGuideStatLabel(guide.maxPrice)} />
            <BudgetHeroStat label="Live drops" value={radar ? String(deals.length) : '0'} />
            <BudgetHeroStat label="Combined value" value={radar ? formatNairaCompact(totalDrop) : 'N/A'} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {BUDGET_GUIDES.map((item) => (
          <BudgetRouteCard key={item.slug} guide={item} activeSlug={guide.slug} />
        ))}
      </section>

      {deals.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <BudgetInsightCard
            eyebrow="Lead deal"
            title={topDeal?.phone_name ?? 'No lead deal yet'}
            description={
              topDeal
                ? `Currently ${formatNairaCompact(topDeal.current_price_ngn)} after a ${formatNairaCompact(topDeal.change_amount_ngn)} drop on ${topDeal.store === 'jumia' ? 'Jumia' : 'Slot'}.`
                : 'Waiting for the next meaningful drop.'
            }
            href={topDeal ? `/buy-now-or-wait/${topDeal.phone_slug}` : `/phones?max_price=${guide.maxPrice}`}
            actionLabel={topDeal ? 'Read Decide take' : 'Browse this budget'}
          />
          <BudgetInsightCard
            eyebrow="Cheapest tracked"
            title={cheapestDeal?.phone_name ?? 'No low-cost lead yet'}
            description={
              cheapestDeal
                ? `The lowest tracked live price in this lane is ${formatNairaCompact(cheapestDeal.current_price_ngn)}. Use it as context, not as an automatic buy signal.`
                : 'As soon as a new low-cost tracked option lands, it will show up here.'
            }
            href={cheapestDeal ? `/phones/${cheapestDeal.phone_slug}` : `/phones?max_price=${guide.maxPrice}`}
            actionLabel={cheapestDeal ? 'View phone' : 'Browse phones'}
          />
          <BudgetInsightCard
            eyebrow="Biggest cash save"
            title={biggestDrop?.phone_name ?? 'No standout saving yet'}
            description={
              biggestDrop
                ? `The biggest absolute cut in this budget lane is ${formatNairaCompact(biggestDrop.change_amount_ngn)}. Compare it before you rush out to the store.`
                : 'This card will highlight the strongest raw drop once it appears in the lane.'
            }
            href={biggestDrop ? '/compare' : '/deals/today'}
            actionLabel={biggestDrop ? 'Compare options' : 'Open today'}
          />
        </section>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-bold text-text-primary">Budget guide unavailable</p>
          <p className="mt-2 text-sm text-text-secondary">{error}</p>
        </div>
      ) : (
        <DealFeed
          deals={deals}
          eyebrow="Budget guide"
          title={`Tracked drops ${guide.label.toLowerCase()}`}
          description={`A live budget cut of the deals radar for buyers trying to stay disciplined around ${getBudgetGuideStatLabel(guide.maxPrice)}.`}
          action={
            <Link
              href={`/phones?max_price=${guide.maxPrice}`}
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Browse full budget catalog
            </Link>
          }
          emptyTitle={`No live drops ${guide.label.toLowerCase()} right now`}
          emptyDescription={`Decide is still tracking this budget lane. Once a stronger move lands within ${getBudgetGuideStatLabel(guide.maxPrice)}, it will show up here.`}
        />
      )}

      <DecisionLoopPanel
        title="Use the budget well"
        description="A cheap phone can still be the wrong phone. These Decide paths help you pressure-test the pick before you leave the product for a retailer."
        items={[
          {
            eyebrow: 'Verdict first',
            title: 'Read the timing verdict',
            description:
              'Use Buy now or wait when a budget phone looks tempting but you need to know if the current price is actually worth acting on.',
            href: topDeal ? `/buy-now-or-wait/${topDeal.phone_slug}` : '/deals/today',
            label: topDeal ? 'Open lead verdict' : "Open today's shortlist",
          },
          {
            eyebrow: 'Compare',
            title: 'Pressure-test the finalists',
            description:
              'If two phones in this lane are close, Compare is the fastest way to see where the money actually goes further.',
            href: '/compare',
            label: 'Compare phones',
          },
          {
            eyebrow: 'Catalog',
            title: 'Browse the full lane',
            description:
              'Open the full filtered browse route when you want more than just live drops and need a wider look at the budget ceiling.',
            href: `/phones?max_price=${guide.maxPrice}`,
            label: 'Browse this budget',
          },
        ]}
      />

      <DealsRetentionPanel
        title="Carry this budget lane into Watchlist and Alerts"
        description={`A budget ceiling helps you narrow the lane, but the smarter Decide move is to keep promising picks in Watchlist and protect the most price-sensitive ones with alerts before the listings shift again around ${getBudgetGuideStatLabel(guide.maxPrice)}.`}
      />

      <section className="rounded-2xl border border-border bg-surface px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Freshness note
            </p>
            <h2 className="text-xl font-black tracking-tight text-text-primary">
              Keep the budget route in sync with the live market
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              {radar?.generated_at
                ? `This budget page was generated ${formatRelativeTime(radar.generated_at)} from the current tracked store data. Recheck the live radar and the verdict pages before you act on any single listing.`
                : 'Budget guides work best when paired with the live radar and Decide verdicts, especially when the market is moving quickly.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/deals/today"
              className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
            >
              Open today&apos;s shortlist
            </Link>
            <Link
              href="/used/checker"
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Open used checker
            </Link>
            <Link
              href="/analyze"
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Analyze a phone
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

interface BudgetHeroStatProps {
  label: string
  value: string
}

const BudgetHeroStat = ({ label, value }: BudgetHeroStatProps) => (
  <div className="rounded-2xl border border-accent/10 bg-white/80 px-3 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
  </div>
)

interface BudgetRouteCardProps {
  guide: (typeof BUDGET_GUIDES)[number]
  activeSlug: string
}

const BudgetRouteCard = ({ guide, activeSlug }: BudgetRouteCardProps) => {
  const isActive = guide.slug === activeSlug

  return (
    <section
      className={[
        'rounded-2xl border px-4 py-4 shadow-sm transition-colors duration-fast',
        isActive
          ? 'border-accent/20 bg-tealTint'
          : 'border-borderHigh bg-surface',
      ].join(' ')}
    >
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Budget lane
        </p>
        <div className="space-y-1">
          <h2 className="text-lg font-black tracking-tight text-text-primary">
            {guide.label}
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            {guide.shortDescription}
          </p>
        </div>
        {isActive ? (
          <span className="inline-flex items-center rounded-full border border-accent/15 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Current page
          </span>
        ) : (
          <Link
            href={`/deals/under/${guide.slug}`}
            className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
          >
            Open guide
          </Link>
        )}
      </div>
    </section>
  )
}

interface BudgetInsightCardProps {
  eyebrow: string
  title: string
  description: string
  href: string
  actionLabel: string
}

const BudgetInsightCard = ({
  eyebrow,
  title,
  description,
  href,
  actionLabel,
}: BudgetInsightCardProps) => (
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
