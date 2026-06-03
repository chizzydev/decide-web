import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui'
import { PriceChangeBadge } from '@/components/market/PriceChangeBadge'
import { PriceHistoryChart } from '@/components/market/PriceHistoryChart'
import { PhonePricingIntentPanel } from '@/components/market/PhonePricingIntentPanel'
import { StructuredData } from '@/components/seo/StructuredData'
import { formatNaira, formatNairaCompact, formatRelativeTime } from '@/lib/formatters'
import {
  buildPhoneDetailHref,
  buildPhonePriceDropHref,
  buildPhonePriceHistoryHref,
  buildPhonePriceTodayHref,
} from '@/lib/variantHref'
import {
  getIntentLink,
  getPriceIntentBacklinks,
  getStoreLabel,
  type PhonePricingIntentKey,
  type PhonePricingSeoBundle,
} from '@/lib/phonePricingSeo'
import {
  buildOfferStructuredData,
  buildProductStructuredDataDescription,
  getStructuredDataSellerName,
} from '@/lib/structuredData'
import { absoluteUrl } from '@/lib/seo'

interface PhonePricingSeoPageProps {
  intent: PhonePricingIntentKey
  bundle: PhonePricingSeoBundle
}

const HERO_COPY: Record<
  PhonePricingIntentKey,
  {
    eyebrow: string
    title: (name: string) => string
    description: string
  }
> = {
  'price-history': {
    eyebrow: 'Price history',
    title: (name) => `${name} price history in Nigeria`,
    description:
      'Use Decide to read the tracked price chart, current best price, recent store movement, and timing context before you spend.',
  },
  'cheapest-price': {
    eyebrow: 'Cheapest price',
    title: (name) => `${name} cheapest price in Nigeria`,
    description:
      'This page isolates the cheapest trusted-store price right now, shows how wide the market spread is, and keeps the timing verdict close by.',
  },
  'price-in-nigeria-today': {
    eyebrow: 'Price today',
    title: (name) => `${name} price in Nigeria today`,
    description:
      'Use this daily market snapshot to see the latest tracked store prices, freshness, stock context, and the next smart Decide move.',
  },
  'price-drop': {
    eyebrow: 'Price drop',
    title: (name) => `Has ${name} price dropped?`,
    description:
      'Decide compares the latest tracked price against the prior store snapshot so buyers can tell whether a drop is real or whether the market is simply flat.',
  },
  'price-in-jumia': {
    eyebrow: 'Store page',
    title: (name) => `${name} price on Jumia Nigeria`,
    description:
      'This is the Jumia-specific view: latest tracked price, freshness, and whether that listing still looks competitive against the wider market.',
  },
  'price-in-slot': {
    eyebrow: 'Store page',
    title: (name) => `${name} price at Slot Nigeria`,
    description:
      'This is the Slot-specific view: latest tracked price, freshness, and whether that listing still looks competitive against the wider market.',
  },
}

const getStoreForIntent = (intent: PhonePricingIntentKey): 'jumia' | 'slot' | null => {
  if (intent === 'price-in-jumia') return 'jumia'
  if (intent === 'price-in-slot') return 'slot'
  return null
}

const getSummaryItems = (intent: PhonePricingIntentKey, bundle: PhonePricingSeoBundle) => {
  const freshest =
    bundle.priceHistory?.summary.freshest_scraped_at ??
    bundle.cheapestPrice?.scraped_at ??
    null

  const baseItems = [
    {
      label: 'Best current',
      value: bundle.cheapestPrice
        ? formatNairaCompact(bundle.cheapestPrice.price_ngn)
        : 'Waiting',
    },
    {
      label: 'Tracked stores',
      value: String(bundle.priceHistory?.summary.tracked_store_count ?? bundle.currentPrices.length),
    },
    {
      label: 'Freshest update',
      value: freshest ? formatRelativeTime(freshest) : 'Waiting',
    },
  ]

  if (intent === 'cheapest-price') {
    return [
      {
        label: 'Cheapest store',
        value: bundle.cheapestPrice ? getStoreLabel(bundle.cheapestPrice.store) : 'Waiting',
      },
      {
        label: 'Price spread',
        value:
          bundle.priceSpreadNgn != null ? formatNairaCompact(bundle.priceSpreadNgn) : 'Thin data',
      },
      baseItems[2],
    ]
  }

  if (intent === 'price-drop') {
    return [
      {
        label: 'Largest tracked cut',
        value:
          bundle.strongestDrop?.change_amount_ngn != null
            ? formatNairaCompact(bundle.strongestDrop.change_amount_ngn)
            : 'No live cut',
      },
      {
        label: 'Store',
        value: bundle.strongestDrop ? getStoreLabel(bundle.strongestDrop.store) : 'Watching',
      },
      baseItems[2],
    ]
  }

  return baseItems
}

const buildStructuredData = (
  intent: PhonePricingIntentKey,
  bundle: PhonePricingSeoBundle
) => {
  const activeLink = getIntentLink(bundle.intentLinks, intent)
  const storeIntent = getStoreForIntent(intent)
  const primaryPrice =
    (storeIntent
      ? bundle.currentPrices.find((price) => price.store === storeIntent)
      : bundle.cheapestPrice) ?? null

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: HERO_COPY[intent].title(bundle.phone.name),
    description: HERO_COPY[intent].description,
    url: absoluteUrl(activeLink?.href ?? buildPhoneDetailHref(bundle.phone.slug)),
    about: {
      '@type': 'Thing',
      name: bundle.phone.name,
    },
    author: {
      '@type': 'Organization',
      name: 'Decide',
    },
    mainEntity:
      primaryPrice != null
        ? {
            '@type': 'Product',
            name: bundle.phone.name,
            description: buildProductStructuredDataDescription(
              bundle.phone.name,
              storeIntent
                ? `${getStoreLabel(storeIntent)} price tracking, Nigerian market context, timing guidance, and safer alternatives`
                : 'tracked Nigerian prices, price history, timing guidance, and safer alternatives'
            ),
            brand: {
              '@type': 'Brand',
              name: bundle.phone.brand_name,
            },
            image: bundle.phone.image_url ?? undefined,
            releaseDate: bundle.phone.released_year
              ? `${bundle.phone.released_year}-01-01`
              : undefined,
            offers: buildOfferStructuredData({
              price: primaryPrice.price_ngn,
              url: primaryPrice.url ?? absoluteUrl(buildPhoneDetailHref(bundle.phone.slug)),
              sellerName: getStructuredDataSellerName(primaryPrice.store),
            }),
          }
        : undefined,
  }
}

const renderStoreCards = (bundle: PhonePricingSeoBundle) => (
  <div className="grid gap-3 md:grid-cols-2">
    {bundle.currentPrices.length > 0 ? (
      bundle.currentPrices.map((price) => (
        <div
          key={`${price.store}-${price.variant_id ?? 'default'}`}
          className="rounded-2xl border border-border bg-white px-4 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                {getStoreLabel(price.store)}
              </p>
              <p className="text-2xl font-black tracking-tight text-text-primary">
                {formatNaira(price.price_ngn)}
              </p>
              <p className="text-xs text-text-muted">
                Updated {formatRelativeTime(price.scraped_at)}
              </p>
            </div>
            {price.url ? (
              <a
                href={price.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-accent hover:text-accent-hover"
              >
                Open listing
              </a>
            ) : null}
          </div>
          {price.variant_label ? (
            <p className="mt-3 text-sm text-text-secondary">
              Tracking variant: <span className="font-semibold text-text-primary">{price.variant_label}</span>
            </p>
          ) : null}
        </div>
      ))
    ) : (
      <div className="rounded-2xl border border-border bg-surfaceHigh px-4 py-4 text-sm leading-relaxed text-text-secondary md:col-span-2">
        Decide does not have a live in-stock trusted-store price for this phone right now. Keep the page bookmarked and check the timing verdict or alert flow while the next tracked update lands.
      </div>
    )}
  </div>
)

export const PhonePricingSeoPage = ({
  intent,
  bundle,
}: PhonePricingSeoPageProps) => {
  const hero = HERO_COPY[intent]
  const activeLink = getIntentLink(bundle.intentLinks, intent)
  const summaryItems = getSummaryItems(intent, bundle)
  const backlinks = getPriceIntentBacklinks(bundle)
  const storeIntent = getStoreForIntent(intent)
  const storeSeries = storeIntent
    ? bundle.priceHistory?.series.find((series) => series.store === storeIntent) ?? null
    : null

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <StructuredData data={buildStructuredData(intent, bundle)} />

      <Card className="overflow-hidden border-borderHigh bg-surface shadow-sm">
        <div className="border-b border-border bg-gradient-to-br from-tealTint via-surface to-surface px-5 py-6 md:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                {hero.eyebrow}
              </p>
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-text-primary">
                  {hero.title(bundle.phone.name)}
                </h1>
                <p className="text-base leading-relaxed text-text-secondary">
                  {hero.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {backlinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border bg-white px-4 py-4 lg:w-[300px]">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-border bg-surfaceHigh">
                {bundle.phone.image_url ? (
                  <Image
                    src={bundle.phone.image_url}
                    alt={bundle.phone.name}
                    fill
                    className="object-contain p-2"
                    sizes="64px"
                  />
                ) : null}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-text-primary">{bundle.phone.name}</p>
                <p className="text-sm text-text-secondary">{bundle.phone.brand_name}</p>
                {bundle.selectedVariantLabel ? (
                  <p className="text-xs text-text-muted">
                    Variant: {bundle.selectedVariantLabel}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-border bg-surfaceHigh/50 px-5 py-4 sm:grid-cols-3 md:px-6">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-white px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-black tracking-tight text-text-primary">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-6 px-5 py-5 md:px-6">
          {intent === 'price-drop' ? (
            <div className="rounded-2xl border border-border bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                    Latest drop signal
                  </p>
                  <h2 className="text-xl font-black tracking-tight text-text-primary">
                    {bundle.strongestDrop
                      ? `${getStoreLabel(bundle.strongestDrop.store)} cut the tracked price`
                      : 'No active tracked cut right now'}
                  </h2>
                  <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                    {bundle.strongestDrop
                      ? `${bundle.phone.name} is ${formatNairaCompact(bundle.strongestDrop.change_amount_ngn ?? 0)} lower than the prior ${getStoreLabel(bundle.strongestDrop.store)} snapshot. Use this alongside the chart so you can tell whether the move looks fresh or thin.`
                      : `Decide has not recorded a live trusted-store cut for ${bundle.phone.name} in the current tracked window. That does not mean the phone is a bad buy; it just means there is no fresh drop to anchor this page yet.`}
                  </p>
                </div>
                {storeSeries ? (
                  <PriceChangeBadge
                    amount_ngn={storeSeries.change_amount_ngn}
                    percent={storeSeries.change_percent}
                  />
                ) : bundle.strongestDrop ? (
                  <PriceChangeBadge
                    amount_ngn={bundle.strongestDrop.change_amount_ngn}
                    percent={bundle.strongestDrop.change_percent}
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {(intent === 'cheapest-price' || intent === 'price-in-nigeria-today') && bundle.cheapestPrice ? (
            <div className="rounded-2xl border border-border bg-white px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Current market read
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-text-primary">
                {getStoreLabel(bundle.cheapestPrice.store)} is currently the cheaper trusted lane
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Decide is seeing {formatNaira(bundle.cheapestPrice.price_ngn)} as the best current trusted-store price for {bundle.phone.name}
                {bundle.priceSpreadNgn != null
                  ? `, with a spread of ${formatNairaCompact(bundle.priceSpreadNgn)} across the tracked stores.`
                  : '.'}
              </p>
            </div>
          ) : null}

          {(intent === 'price-in-jumia' || intent === 'price-in-slot') && storeSeries ? (
            <div className="rounded-2xl border border-border bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                    Store movement
                  </p>
                  <h2 className="text-xl font-black tracking-tight text-text-primary">
                    {getStoreLabel(storeSeries.store)} tracked price context
                  </h2>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {storeSeries.change_amount_ngn && storeSeries.change_amount_ngn > 0
                      ? `${getStoreLabel(storeSeries.store)} is ${formatNairaCompact(storeSeries.change_amount_ngn)} lower than the previous tracked snapshot for this phone.`
                      : `Decide is currently treating this ${getStoreLabel(storeSeries.store)} listing as the live reference point without a fresh tracked cut yet.`}
                  </p>
                </div>
                <PriceChangeBadge
                  amount_ngn={storeSeries.change_amount_ngn}
                  percent={storeSeries.change_percent}
                />
              </div>
            </div>
          ) : null}

          {renderStoreCards(bundle)}
        </div>
      </Card>

      {bundle.priceHistory?.series.some((series) => series.points.length > 0) ? (
        <PriceHistoryChart
          history={bundle.priceHistory}
          detailPath={
            activeLink?.href ?? buildPhonePriceHistoryHref(bundle.phone.slug, {
              variantId: bundle.selectedVariantId,
            })
          }
        />
      ) : null}

      <PhonePricingIntentPanel links={bundle.intentLinks} activeKey={intent} />

      <Card className="border-borderHigh bg-surface shadow-sm">
        <div className="space-y-4 px-5 py-5 md:px-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight text-text-primary">
              What this page is for
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              This page exists so buyers who search for one narrow pricing question can land directly on the answer, then move deeper into Decide once the phone becomes a serious candidate.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href={buildPhoneDetailHref(bundle.phone.slug, {
                variantId: bundle.selectedVariantId,
              })}
              className="rounded-2xl border border-border bg-white px-4 py-4 transition-colors duration-fast hover:border-borderHigh hover:bg-surfaceHigh"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Full detail
              </p>
              <h3 className="mt-2 text-lg font-black tracking-tight text-text-primary">
                Open the full phone page
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Use the full detail page for specs, fairness verdicts, support notes, reviews, and live store links.
              </p>
            </Link>
            <Link
              href={bundle.buyNowWait ? buildPhonePriceTodayHref(bundle.phone.slug, { variantId: bundle.selectedVariantId }) : buildPhonePriceDropHref(bundle.phone.slug, { variantId: bundle.selectedVariantId })}
              className="rounded-2xl border border-border bg-white px-4 py-4 transition-colors duration-fast hover:border-borderHigh hover:bg-surfaceHigh"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Timing
              </p>
              <h3 className="mt-2 text-lg font-black tracking-tight text-text-primary">
                Keep the market context close
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                A cheap-looking listing can still be a bad move if the wider market is unstable, stale, or about to move again.
              </p>
            </Link>
            <Link
              href={bundle.buyNowWait ? backlinks.find((item) => item.label === 'Read buy or wait')?.href ?? '/deals/today' : '/deals/today'}
              className="rounded-2xl border border-border bg-white px-4 py-4 transition-colors duration-fast hover:border-borderHigh hover:bg-surfaceHigh"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Next move
              </p>
              <h3 className="mt-2 text-lg font-black tracking-tight text-text-primary">
                Use Decide before you pay
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Step into the verdict flow if you want Decide to say whether to buy now, wait longer, or pressure-test a better alternative.
              </p>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
