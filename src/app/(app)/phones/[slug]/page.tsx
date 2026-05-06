import type { Metadata } from 'next'
import type {
  BuyNowWaitResponse,
  PhoneCard,
  PhoneDetail,
  PhoneMarketplaceOffersResponse,
  PhonePriceHistoryResponse,
  StillWorthItResponse,
} from '@/types'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { editorialApi, marketApi, phonesApi } from '@/lib/api'
import { formatRelativeTime } from '@/lib/formatters'
import { absoluteUrl, buildPageMetadata } from '@/lib/seo'
import { Badge, Divider } from '@/components/ui'
import { PriceDisplay } from '@/components/shared'
import { ScoreBarGroup, PhoneSpecSheet } from '@/components/phone'
import MustCheckToggle from '@/components/phone/MustCheckToggle'
import { PriceAlertButton } from '@/components/phone/PriceAlertButton'
import { CompareTrayButton } from '@/components/phone/CompareTrayButton'
import { ReviewList } from '@/components/phone/ReviewList'
import { BuyNowWaitCard } from '@/components/market/BuyNowWaitCard'
import { OwnershipSignalPanel } from '@/components/market/OwnershipSignalPanel'
import { PriceHistoryChart } from '@/components/market/PriceHistoryChart'
import { WorthItVerdictCard } from '@/components/market/WorthItVerdictCard'
import { DecisionLoopPanel } from '@/components/market/DecisionLoopPanel'
import { RelatedComparePanel } from '@/components/market/RelatedComparePanel'
import { StructuredData } from '@/components/seo/StructuredData'
import { getTopPhoneDetailCompareActions } from '@/lib/relatedCompare'
import {
  buildBuyNowWaitHref,
  buildUsedGuideHref,
  buildWorthItHref,
} from '@/lib/variantHref'

const hasRealImage = (url: string | null | undefined): boolean =>
  !!url && !url.includes('placeholder')

const formatNaira = (value: number) =>
  value.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  })

const MARKETPLACE_QUALITY_LABELS = {
  strong_lead: 'Strong lead',
  fair_lead: 'Fair lead',
  context_only: 'Context only',
  risky: 'High risk',
} as const

const MARKETPLACE_RISK_CLASSES = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  high: 'border-red-200 bg-red-50 text-red-700',
} as const

const getMarketplaceReasonLabels = (
  labels: PhoneMarketplaceOffersResponse['offers'][number]['reason_labels']
) => (Array.isArray(labels) ? labels : [])

const getMarketplaceSafeSteps = (
  steps: PhoneMarketplaceOffersResponse['offers'][number]['safe_buying_steps']
) =>
  Array.isArray(steps) && steps.length
    ? steps
    : [
        'Inspect the exact phone before paying.',
        'Confirm IMEI, SIM status, screen, charging, cameras, and biometrics.',
        'Use a trusted person near the seller if you cannot inspect it yourself.',
        'Meet in a safe public place and keep evidence of the transaction.',
      ]

const getLowestInStockPrice = (phone: PhoneDetail) =>
  phone.prices
    .filter((price) => price.in_stock && price.price_ngn > 0)
    .sort((a, b) => a.price_ngn - b.price_ngn)[0]?.price_ngn

const getHighestInStockPrice = (phone: PhoneDetail) =>
  phone.prices
    .filter((price) => price.in_stock && price.price_ngn > 0)
    .sort((a, b) => b.price_ngn - a.price_ngn)[0]?.price_ngn

const getLowestInStockVariantPrice = (variant: NonNullable<PhoneDetail['variants']>[number]) =>
  variant.prices
    .filter((price) => price.in_stock && price.price_ngn > 0)
    .sort((a, b) => a.price_ngn - b.price_ngn)[0]?.price_ngn

const buildPhoneDetailDescription = (
  phone: PhoneDetail,
  lowestInStockPrice: number | undefined
) => {
  const priceLead = lowestInStockPrice
    ? `${phone.name} price in Nigeria starts from ₦${lowestInStockPrice.toLocaleString('en-NG')}.`
    : `${phone.name} price in Nigeria, specs, and buying guidance.`

  return `${priceLead} Compare specs, tracked store prices, price history, reviews, and Decide's buy-now-or-wait and still-worth-it verdicts before you buy.`
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  try {
    const { slug } = await params
    const phone = await phonesApi.getBySlug(slug)
    const lowestInStockPrice = getLowestInStockPrice(phone)

    return buildPageMetadata({
      title: `${phone.name} price, specs, and verdicts - Decide`,
      description: buildPhoneDetailDescription(phone, lowestInStockPrice),
      path: `/phones/${phone.slug}`,
      keywords: [
        `${phone.name} price in Nigeria`,
        `${phone.name} specs`,
        `${phone.name} review Nigeria`,
        `${phone.brand_name} phones Nigeria`,
      ],
      image: phone.image_url ?? undefined,
    })
  } catch {
    return buildPageMetadata({
      title: 'Phone detail - Decide',
      description:
        'Check phone specs, tracked Nigerian prices, price history, and Decide verdicts before you buy.',
      path: '/phones',
    })
  }
}

interface PhonePageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ variant_id?: string | string[] }>
}

export default async function PhonePage({ params, searchParams }: PhonePageProps) {
  const { slug } = await params
  const resolvedSearchParams = (await searchParams) ?? {}
  const rawVariantId = Array.isArray(resolvedSearchParams.variant_id)
    ? resolvedSearchParams.variant_id[0]
    : resolvedSearchParams.variant_id
  const requestedVariantId =
    rawVariantId && /^\d+$/.test(rawVariantId) ? Number(rawVariantId) : undefined
  let phone: PhoneDetail
  let compareCandidates: PhoneCard[] = []
  let priceHistory: PhonePriceHistoryResponse | null = null
  let buyNowWait: BuyNowWaitResponse | null = null
  let stillWorthIt: StillWorthItResponse | null = null
  let marketplaceOffers: PhoneMarketplaceOffersResponse | null = null

  try {
    phone = await phonesApi.getBySlug(slug)

    const compareSearchMaxPrice = getLowestInStockPrice(phone)
      ? Math.round(getLowestInStockPrice(phone)! * 1.6)
      : undefined

    ;[compareCandidates, priceHistory, buyNowWait, stillWorthIt, marketplaceOffers] = await Promise.all([
      phonesApi
        .getAll({
          os_type: phone.os_type,
          max_price: compareSearchMaxPrice,
          limit: 24,
        })
        .catch(() => []),
      marketApi
        .getPhonePriceHistory(slug, {
          variant_id: requestedVariantId,
        })
        .catch(() => null),
      editorialApi.getBuyNowWait(slug).catch(() => null),
      editorialApi.getStillWorthIt(slug).catch(() => null),
      phonesApi.getMarketplaceOffers(slug).catch(() => null),
    ])
  } catch {
    notFound()
  }

  const hasGrayMarketRisk = phone.gray_market_risk !== 'low'
  const lowestInStockPrice = getLowestInStockPrice(phone)
  const highestInStockPrice = getHighestInStockPrice(phone)
  const hasPriceHistory = !!priceHistory?.series.some((series) => series.points.length > 0)
  const ownershipSignals = stillWorthIt ?? buyNowWait
  const trackedVariants = (phone.variants ?? []).filter((variant) => variant.prices.length > 0)
  const selectedVariant =
    (priceHistory?.selected_variant_id
      ? trackedVariants.find((variant) => variant.id === priceHistory.selected_variant_id)
      : null) ??
    (requestedVariantId
      ? trackedVariants.find((variant) => variant.id === requestedVariantId)
      : null) ??
    trackedVariants.find((variant) => variant.is_default) ??
    trackedVariants[0] ??
    null
  const selectedVariantPrices =
    selectedVariant && selectedVariant.prices.length > 0 ? selectedVariant.prices : phone.prices
  const selectedVariantLowestPrice = selectedVariant
    ? getLowestInStockVariantPrice(selectedVariant)
    : undefined
  const otherTrackedVariants = selectedVariant
    ? trackedVariants.filter((variant) => variant.id !== selectedVariant.id)
    : trackedVariants
  const selectedVariantId = selectedVariant?.id ?? null
  const priceDecisionLinks = [
    ...(buyNowWait
      ? [
          {
            href: buildBuyNowWaitHref(phone.slug, {
              variantId: selectedVariantId,
            }),
            label: 'Read buy or wait',
          },
        ]
      : []),
    ...(stillWorthIt
      ? [
          {
            href: buildWorthItHref(phone.slug, {
              variantId: selectedVariantId,
            }),
            label: 'Check still worth it',
          },
        ]
      : []),
    { href: '/compare', label: 'Compare phones' },
  ]
  const usedGuideHref = buildUsedGuideHref(phone.slug, {
    variantId: selectedVariantId,
  })
  const verdictLoopItems = [
    ...(buyNowWait
      ? [
          {
            eyebrow: 'Timing verdict',
            title: 'Read the full buy or wait case',
            description:
              'Open the expanded timing verdict if you want the deeper price read, risks, and purchase guidance.',
            href: buildBuyNowWaitHref(phone.slug, {
              variantId: selectedVariantId,
            }),
            label: 'Open buy or wait',
          },
        ]
      : []),
    ...(stillWorthIt
      ? [
          {
            eyebrow: 'Longevity verdict',
            title: 'Check the still-worth-it case',
            description:
              'Use the long-term verdict when age, repair outlook, or resale confidence matters to this decision.',
            href: buildWorthItHref(phone.slug, {
              variantId: selectedVariantId,
            }),
            label: 'Open still worth it',
          },
        ]
      : []),
    {
      eyebrow: 'Head to head',
      title: 'Compare this phone against another option',
      description:
        'If you already have a serious alternative, move into Compare and pressure-test the two side by side.',
      href: '/compare',
      label: 'Compare phones',
    },
    {
      eyebrow: 'Market pulse',
      title: "Check today's live drops first",
      description:
        'A nearby phone may be moving harder right now, so it is worth checking the live radar before you lock this in.',
      href: '/deals/today',
      label: "Open today's shortlist",
    },
  ]
  const inStockOffers = phone.prices.filter((price) => price.in_stock && price.price_ngn > 0)
  const phoneDescription = buildPhoneDetailDescription(phone, lowestInStockPrice)
  const relatedCompareActions = getTopPhoneDetailCompareActions(
    phone,
    compareCandidates,
    {
      id: selectedVariant?.id,
      label: selectedVariant?.label ?? null,
    }
  )
  const selectedVariantHref = (variantId: number) => `/phones/${phone.slug}?variant_id=${variantId}#variant-pricing`
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Phones',
          item: absoluteUrl('/phones'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: phone.name,
          item: absoluteUrl(`/phones/${phone.slug}`),
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: phone.name,
      description: phoneDescription,
      url: absoluteUrl(`/phones/${phone.slug}`),
      brand: {
        '@type': 'Brand',
        name: phone.brand_name,
      },
      category: 'Smartphone',
      image: phone.image_url ? absoluteUrl(phone.image_url) : undefined,
      sku: phone.slug,
      releaseDate: phone.released_year ? `${phone.released_year}-01-01` : undefined,
      aggregateRating:
        phone.review_count > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: Number(phone.average_rating.toFixed(1)),
              reviewCount: phone.review_count,
            }
          : undefined,
      offers:
        inStockOffers.length > 0 && lowestInStockPrice != null && highestInStockPrice != null
          ? {
              '@type': 'AggregateOffer',
              priceCurrency: 'NGN',
              lowPrice: lowestInStockPrice,
              highPrice: highestInStockPrice,
              offerCount: inStockOffers.length,
              offers: inStockOffers.map((offer) => ({
                '@type': 'Offer',
                priceCurrency: 'NGN',
                price: offer.price_ngn,
                availability: offer.in_stock
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
                seller: {
                  '@type': 'Organization',
                  name: offer.store === 'jumia' ? 'Jumia' : 'Slot',
                },
                url: offer.url ?? absoluteUrl(`/phones/${phone.slug}`),
              })),
            }
          : undefined,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Operating system',
          value: phone.os_type === 'ios' ? 'iOS' : 'Android',
        },
        {
          '@type': 'PropertyValue',
          name: 'RAM',
          value: phone.ram_gb ? `${phone.ram_gb} GB` : 'Unknown',
        },
        {
          '@type': 'PropertyValue',
          name: 'Storage',
          value: phone.storage_gb ? `${phone.storage_gb} GB` : 'Unknown',
        },
        {
          '@type': 'PropertyValue',
          name: 'Battery',
          value: phone.battery_mah ? `${phone.battery_mah} mAh` : 'Unknown',
        },
        {
          '@type': 'PropertyValue',
          name: '5G',
          value: phone.has_5g ? 'Yes' : 'No',
        },
      ],
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <StructuredData data={structuredData} />

      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/phones" className="transition-colors duration-fast hover:text-text-secondary">
          Phones
        </Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="text-text-secondary">{phone.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex min-h-64 items-center justify-center rounded-md border border-border bg-surface p-8">
          {hasRealImage(phone.image_url) ? (
            <Image
              src={`${phone.image_url!}?v=${phone.updated_at}`}
              alt={phone.name}
              width={240}
              height={240}
              className="max-h-60 object-contain"
              priority
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <svg
                width="64"
                height="64"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="10" y="4" width="28" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="24" cy="38" r="2" fill="currentColor" />
                <rect x="18" y="10" width="12" height="2" rx="1" fill="currentColor" />
              </svg>
              <span className="text-sm">No image available</span>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-muted">{phone.brand_name}</p>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-text-primary">
              {phone.name}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {(phone.tags ?? []).map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {hasGrayMarketRisk && (
            <div className="flex items-start gap-2 rounded-sm border border-warning/20 bg-warning-subtle px-3 py-2.5">
              <span className="mt-0.5 text-sm" aria-hidden="true">!</span>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-warning">
                  {phone.gray_market_risk === 'high'
                    ? 'High Gray Market Risk'
                    : 'Verify Before Buying'}
                </p>
                {phone.gray_market_note ? (
                  <p className="text-xs leading-snug text-text-secondary">
                    {phone.gray_market_note}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          <section className="rounded-2xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-4 py-4 shadow-sm">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Used phone guide
                </p>
                <h2 className="text-lg font-black tracking-tight text-text-primary">
                  Buying this used in Nigeria?
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Open Decide&apos;s model-specific used-phone guide for red flags, seller questions, and the checks to run before you pay.
                </p>
              </div>

              <Link
                href={usedGuideHref}
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Open used guide
              </Link>
            </div>
          </section>

          <MustCheckToggle
            os_type={phone.os_type}
            brand_name={phone.brand_name}
            phone_name={phone.name}
          />

          {trackedVariants.length > 0 ? (
            <section
              id="variant-pricing"
              className="rounded-xl border border-borderHigh bg-gradient-to-br from-surface via-surface to-tealTint px-4 py-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                    Buying configuration
                  </p>
                  <h2 className="text-lg font-black tracking-tight text-text-primary">
                    {selectedVariant ? selectedVariant.label : 'Tracked phone configuration'}
                  </h2>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    The main price block and history chart now follow this tracked configuration,
                    so you can judge one real RAM/storage option at a time instead of mentally
                    untangling mixed variant pricing.
                  </p>
                </div>

                {trackedVariants.length > 1 ? (
                  <div className="space-y-2">
                    <p className="text-xs leading-relaxed text-text-muted">
                      Select a RAM and storage option to update the live store links and price history below for that exact configuration.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {trackedVariants.map((variant) => {
                        const isActive = selectedVariant?.id === variant.id
                        const variantBestPrice = getLowestInStockVariantPrice(variant)

                        return (
                          <Link
                            key={variant.id}
                            href={selectedVariantHref(variant.id)}
                            className={[
                              'rounded-xl border px-3 py-2 transition-colors duration-fast',
                              isActive
                                ? 'border-accent bg-accent-subtle'
                                : 'border-border bg-white hover:border-borderHigh',
                            ].join(' ')}
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={[
                                    'text-sm font-semibold',
                                    isActive ? 'text-text-primary' : 'text-text-secondary',
                                  ].join(' ')}
                                >
                                  {variant.label}
                                </span>
                                {variant.is_default ? (
                                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                                    Default
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[11px] text-text-muted">
                                {variantBestPrice
                                  ? `Best current ${variantBestPrice.toLocaleString('en-NG', {
                                      style: 'currency',
                                      currency: 'NGN',
                                      maximumFractionDigits: 0,
                                    })}`
                                  : 'Waiting for a current tracked price'}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <PriceDisplay
                  prices={selectedVariantPrices}
                  decisionLinks={priceDecisionLinks}
                  priceScopeLabel={selectedVariant?.label ?? null}
                  hideVariantSummary={!!selectedVariant}
                />
              </div>
            </section>
          ) : (
            <PriceDisplay prices={phone.prices} decisionLinks={priceDecisionLinks} />
          )}

          {((trackedVariants.length > 0 ? selectedVariantPrices : phone.prices).length === 0 &&
            (marketplaceOffers?.offers.length ?? 0) > 0) ? (
            <p className="text-xs leading-relaxed text-amber-700">
              No trusted Jumia or Slot price is live yet. Jiji used-market context is available
              below to help you understand the street range while you keep verifying the phone.
            </p>
          ) : null}

          {otherTrackedVariants.length > 0 ? (
            <section className="rounded-xl border border-border bg-surfaceHigh px-4 py-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Other tracked variants
                  </p>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    These are the other tracked RAM and storage combinations currently tied to live store pricing for this model.
                  </p>
                </div>

                <div className="space-y-3">
                  {otherTrackedVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="rounded-lg border border-border bg-surface px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-text-primary">{variant.label}</p>
                        {variant.is_default ? (
                          <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] font-semibold text-accent">
                            Default
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2">
                        <PriceDisplay
                          prices={variant.prices}
                          compact
                          compactStoreSummary
                          priceScopeLabel={variant.label}
                        />
                      </div>

                      <div className="mt-3">
                        <Link
                          href={selectedVariantHref(variant.id)}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          Make this the active tracked variant
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <p className="text-xs leading-relaxed text-text-muted">
            Verified live prices from tracked stores like Jumia and Slot. The freshness badges
            above tell you whether Decide checked those listings recently enough to trust them as
            current, or whether you should treat them as aging context and recheck before buying.
            Listings may still vary by variant, seller, or location, and physical store prices may
            differ.
          </p>

          {marketplaceOffers?.offers.length ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                    Marketplace signals
                  </p>
                  <h2 className="text-base font-black tracking-tight text-text-primary">
                    Jiji used-market context
                  </h2>
                  <p className="text-xs leading-relaxed text-amber-800">
                    These are not trusted current retail prices. They are Jiji leads for street-price
                    discovery, with Decide risk labels and inspection-first safety steps.
                  </p>
                </div>

                <div className="space-y-2">
                  {marketplaceOffers.offers.slice(0, 3).map((offer) => {
                    const riskLevel = offer.risk_level ?? 'medium'
                    const dealQuality = offer.deal_quality ?? 'context_only'
                    const reasonLabels = getMarketplaceReasonLabels(offer.reason_labels)

                    return (
                    <div
                      key={offer.id}
                      className="rounded-lg border border-amber-200 bg-white/80 px-3 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-bold text-text-primary">
                            {offer.listing_title}
                          </p>
                          <p className="text-base font-black text-amber-800">
                            {formatNaira(offer.price_ngn)}
                          </p>
                          <p className="text-xs text-text-muted">
                            {[offer.location, offer.condition_label]
                              .filter(Boolean)
                              .join(' - ') || 'Marketplace listing'}
                          </p>
                          <p className="text-[11px] font-semibold text-amber-700">
                            Synced {formatRelativeTime(offer.scraped_at)}
                          </p>
                          <p className="text-xs leading-relaxed text-amber-900">
                            {offer.buyer_note ??
                              'Use this as street-price context only. Inspect the phone and seller before paying.'}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${MARKETPLACE_RISK_CLASSES[riskLevel]}`}
                          >
                            {riskLevel} risk
                          </span>
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">
                            {MARKETPLACE_QUALITY_LABELS[dealQuality]}
                          </span>
                          <a
                            href={offer.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-accent hover:underline"
                          >
                            Open listing
                          </a>
                        </div>
                      </div>
                      {reasonLabels.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                        {reasonLabels.slice(0, 3).map((reason) => (
                          <span
                            key={reason}
                            className="rounded-full bg-surfaceHigh px-2 py-1 text-[11px] font-semibold text-text-secondary"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                      ) : null}
                    </div>
                    )
                  })}
                </div>

                <div className="rounded-lg border border-amber-200 bg-white/70 px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                    Safe buying steps
                  </p>
                  <ul className="mt-2 space-y-1 text-xs leading-relaxed text-amber-900">
                    {getMarketplaceSafeSteps(marketplaceOffers.offers[0]?.safe_buying_steps)
                      .slice(0, 4)
                      .map((step) => (
                        <li key={step}>- {step}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <PriceAlertButton
              phoneId={phone.id}
              phoneName={phone.name}
              variantId={selectedVariant?.id ?? null}
              variantLabel={selectedVariant?.label ?? null}
              lowestPrice={selectedVariantLowestPrice ?? lowestInStockPrice}
            />
            <CompareTrayButton
              phone={{
                id: phone.id,
                slug: phone.slug,
                name: phone.name,
                image_url: phone.image_url,
                brand_name: phone.brand_name,
                os_type: phone.os_type,
                prices: phone.prices,
              }}
              variantId={selectedVariant?.id ?? null}
              variantLabel={selectedVariant?.label ?? null}
            />
          </div>

          {phone.local_support_note ? (
            <p className="text-xs leading-relaxed text-text-secondary">
              <span className="font-semibold text-text-primary">Local support: </span>
              {phone.local_support_note}
            </p>
          ) : null}
        </div>
      </div>

      {hasPriceHistory && priceHistory ? (
        <>
          <Divider />
          <PriceHistoryChart
            history={priceHistory}
            detailPath={`/phones/${phone.slug}`}
          />
        </>
      ) : null}

      {ownershipSignals ? (
        <>
          <Divider />
          <OwnershipSignalPanel
            phoneName={phone.name}
            yearsSinceRelease={ownershipSignals.longevity_signal.years_since_release}
            estimatedYearsOfSupportLeft={ownershipSignals.longevity_signal.estimated_years_of_support_left}
            support={{
              outlook: ownershipSignals.longevity_signal.support_outlook,
              summary: ownershipSignals.longevity_signal.summary,
            }}
            repair={{
              outlook: ownershipSignals.repair_support_signal.outlook,
              summary: ownershipSignals.repair_support_signal.summary,
            }}
            resale={{
              outlook: ownershipSignals.resale_value_signal.outlook,
              summary: ownershipSignals.resale_value_signal.summary,
            }}
          />
        </>
      ) : null}

      {buyNowWait || stillWorthIt ? (
        <>
          <Divider />

          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-text-primary">
                Decide verdicts
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                These verdicts use Nigerian price movement, support runway, and ownership risk to
                answer the questions buyers actually ask before they spend.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {buyNowWait ? (
                <BuyNowWaitCard
                  data={buyNowWait}
                  compact
                  variantId={selectedVariantId}
                />
              ) : null}
              {stillWorthIt ? (
                <WorthItVerdictCard
                  data={stillWorthIt}
                  compact
                  variantId={selectedVariantId}
                />
              ) : null}
            </div>

            <DecisionLoopPanel
              title="Next smart moves"
              description="These connected paths keep the phone-detail page from becoming a dead end. Use them to sanity-check timing, compare alternatives, and pressure-test this pick before you buy."
              items={verdictLoopItems}
            />
          </section>
        </>
      ) : null}

      {relatedCompareActions.length > 0 ? (
        <>
          <Divider />
          <RelatedComparePanel phoneName={phone.name} actions={relatedCompareActions} />
        </>
      ) : null}

      <Divider />

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Decide Scores</h2>
        <ScoreBarGroup
          scores={{
            battery: phone.score_battery,
            camera: phone.score_camera,
            performance: phone.score_performance,
            build: phone.score_build,
          }}
        />
      </div>

      <Divider />

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Full Specifications</h2>
        <PhoneSpecSheet phone={phone} />
      </div>

      <Divider />

      <ReviewList phoneId={phone.id} phoneName={phone.name} />
    </div>
  )
}
