import React from 'react'
import Link from 'next/link'
import { Badge, Tooltip } from '@/components/ui'
import { PriceVerdictBadge } from '@/components/market/PriceVerdictBadge'
import { formatNaira, formatPriceFreshness } from '@/lib/formatters'
import {
  buildStorePriceVerdict,
  buildTrustedPriceVerdict,
  type PriceVerdict,
} from '@/lib/priceVerdict'
import {
  getPriceFreshnessLabel,
  getPriceFreshnessStatus,
  getPriceFreshnessSummary,
  type PriceFreshnessStatus,
} from '@/lib/priceFreshness'
import { STORE_LABELS } from '@/lib/constants'
import type { CurrentPrice, StoreType } from '@/types'

interface PriceDecisionLink {
  href: string
  label: string
}

interface PriceDisplayProps {
  prices: CurrentPrice[]
  compact?: boolean
  compactStoreSummary?: boolean
  className?: string
  decisionLinks?: PriceDecisionLink[]
  priceScopeLabel?: string | null
  hideVariantSummary?: boolean
}

const STORE_COLORS: Record<StoreType, string> = {
  jumia: 'bg-[#F68B1E]',
  slot: 'bg-[#0066B2]',
}

const STORE_ORDER: StoreType[] = ['jumia', 'slot']

const getInStockPrices = (prices: CurrentPrice[]): CurrentPrice[] =>
  (prices ?? []).filter((price) => price.in_stock && price.price_ngn > 0)

const getDisplayablePrices = (prices: CurrentPrice[]): CurrentPrice[] =>
  (prices ?? [])
    .filter((price) => price.price_ngn > 0)
    .sort((left, right) => left.price_ngn - right.price_ngn)

const getLowestInStockPrice = (prices: CurrentPrice[]): CurrentPrice | null => {
  const inStock = getInStockPrices(prices)
  if (inStock.length === 0) return null
  return inStock.reduce((lowest, current) =>
    current.price_ngn < lowest.price_ngn ? current : lowest
  )
}

const getHighestInStockPrice = (prices: CurrentPrice[]): CurrentPrice | null => {
  const inStock = getInStockPrices(prices)
  if (inStock.length === 0) return null
  return inStock.reduce((highest, current) =>
    current.price_ngn > highest.price_ngn ? current : highest
  )
}

const getFreshestKnownPrice = (prices: CurrentPrice[]): CurrentPrice | null => {
  if (prices.length === 0) return null
  return prices.reduce((freshest, current) =>
    new Date(current.scraped_at).getTime() > new Date(freshest.scraped_at).getTime()
      ? current
      : freshest
  )
}

const hasMeaningfulRange = (lowest: CurrentPrice, highest: CurrentPrice): boolean =>
  highest.price_ngn > lowest.price_ngn * 1.05

const getVariantText = (price: CurrentPrice): string | null =>
  price.variant_label ||
  (price.variant_storage_gb && price.variant_ram_gb
    ? `${price.variant_storage_gb}GB / ${price.variant_ram_gb}GB RAM`
    : price.variant_storage_gb
    ? `${price.variant_storage_gb}GB`
    : price.variant_ram_gb
    ? `${price.variant_ram_gb}GB RAM`
    : null)

const getFreshnessBadgeVariant = (status: PriceFreshnessStatus) => {
  if (status === 'fresh') return 'success'
  if (status === 'aging') return 'warning'
  return 'error'
}

export const PriceDisplay = ({
  prices,
  compact = false,
  compactStoreSummary = false,
  className = '',
  decisionLinks = [],
  priceScopeLabel = null,
  hideVariantSummary = false,
}: PriceDisplayProps) => {
  const safePrices = prices ?? []
  const displayablePrices = getDisplayablePrices(safePrices)
  const inStockPrices = getInStockPrices(safePrices)
  const lowestPrice = getLowestInStockPrice(safePrices)
  const highestPrice = getHighestInStockPrice(safePrices)
  const freshestKnownPrice = getFreshestKnownPrice(displayablePrices)
  const hasAnyPrice = displayablePrices.length > 0
  const visibleDecisionLinks = decisionLinks.slice(0, 3)
  const lowestVariantText = lowestPrice ? getVariantText(lowestPrice) : null
  const overallPriceVerdict = buildTrustedPriceVerdict(safePrices)
  const freshestStatus = freshestKnownPrice
    ? getPriceFreshnessStatus(freshestKnownPrice.scraped_at)
    : null
  const compactStorePrices = [...displayablePrices].sort((left, right) => {
    const leftOrder = STORE_ORDER.indexOf(left.store)
    const rightOrder = STORE_ORDER.indexOf(right.store)

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return left.price_ngn - right.price_ngn
  })

  const showRange = !!(
    lowestPrice &&
    highestPrice &&
    lowestPrice.store !== highestPrice.store &&
    hasMeaningfulRange(lowestPrice, highestPrice)
  )

  if (!hasAnyPrice) {
    return (
      <div className={className}>
        <span className="text-sm text-text-muted">Price unavailable</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={['space-y-0.5', className].join(' ')}>
        {lowestPrice ? (
          <>
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-base font-bold tabular-nums text-text-primary">
                {formatNaira(lowestPrice.price_ngn)}
              </span>
              <span className="text-xs text-text-muted">
                on {STORE_LABELS[lowestPrice.store]}
              </span>
              {freshestStatus ? (
                <Badge variant={getFreshnessBadgeVariant(freshestStatus)} className="px-1.5 py-0 text-[10px] tracking-[0.12em]">
                  {getPriceFreshnessLabel(freshestStatus)}
                </Badge>
              ) : null}
              <PriceVerdictBadge verdict={overallPriceVerdict} compact />
            </div>

            {showRange && highestPrice && !compactStoreSummary ? (
              <p className="text-xs leading-none text-text-muted">
                up to {formatNaira(highestPrice.price_ngn)} on {STORE_LABELS[highestPrice.store]}
              </p>
            ) : null}

            {compactStoreSummary && compactStorePrices.length > 1 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {compactStorePrices.map((price) => (
                  <CompactStoreChip key={price.store} price={price} />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <span className="text-sm text-text-muted">Out of stock</span>
        )}
      </div>
    )
  }

  return (
    <div className={['space-y-3', className].join(' ')}>
      <div>
        {lowestPrice ? (
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight tabular-nums text-text-primary">
                {formatNaira(lowestPrice.price_ngn)}
              </span>
              <span className="text-xs text-text-muted">
                best current - {STORE_LABELS[lowestPrice.store]}
              </span>
              {freshestStatus ? (
                <Badge
                  variant={getFreshnessBadgeVariant(freshestStatus)}
                  className="px-1.5 py-0 text-[10px] tracking-[0.12em]"
                >
                  {getPriceFreshnessLabel(freshestStatus)}
                </Badge>
              ) : null}
              <PriceVerdictBadge verdict={overallPriceVerdict} />
            </div>

            {lowestVariantText ? (
              <p className="text-xs text-text-secondary">
                {hideVariantSummary && priceScopeLabel
                  ? `Tracking variant: ${priceScopeLabel}`
                  : `Best current tracked variant: ${lowestVariantText}`}
              </p>
            ) : null}

            {!lowestVariantText && priceScopeLabel ? (
              <p className="text-xs text-text-secondary">
                Tracking variant: {priceScopeLabel}
              </p>
            ) : null}

            {showRange && highestPrice ? (
              <p className="text-xs text-text-secondary">
                Current range: {formatNaira(lowestPrice.price_ngn)} - {formatNaira(highestPrice.price_ngn)} across {inStockPrices.length} stores
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-error">Out of stock</span>
            <span className="text-xs text-text-muted">on all tracked stores</span>
          </div>
        )}
      </div>

      {visibleDecisionLinks.length > 0 ? (
        <div className="rounded-xl border border-accent/15 bg-tealTint px-3 py-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                Decide first
              </p>
              <p className="text-sm leading-relaxed text-text-secondary">
                Use the tracked prices as context, then keep the phone inside Decide long enough to read the verdict or compare path before you leave for a retailer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {visibleDecisionLinks.map((link, index) =>
                index === 0 ? (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className="text-sm font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            {priceScopeLabel
              ? `Tracked current store prices for ${priceScopeLabel}`
              : 'Tracked current store prices'}
          </p>
          <p className="text-[11px] text-text-muted">
            Retailer exits open in a new tab
          </p>
        </div>

        {freshestKnownPrice && freshestStatus ? (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
            <Badge
              variant={getFreshnessBadgeVariant(freshestStatus)}
              className="px-1.5 py-0 text-[10px] tracking-[0.12em]"
            >
              {getPriceFreshnessLabel(freshestStatus)}
            </Badge>
            <span>{getPriceFreshnessSummary(freshestStatus)}</span>
          </div>
        ) : null}

        <div className="space-y-1.5">
          {displayablePrices.map((price) => (
            <StorePriceLine
              key={`${price.store}-${price.variant_id ?? 'phone'}-${price.price_ngn}`}
              price={price}
              isLowest={
                lowestPrice?.store === price.store &&
                lowestPrice?.price_ngn === price.price_ngn
              }
              verdict={buildStorePriceVerdict(price, displayablePrices)}
            />
          ))}
        </div>
      </div>

      {freshestKnownPrice?.scraped_at ? (
        <p className="text-xs text-text-muted">
          {formatPriceFreshness(freshestKnownPrice.scraped_at)}
        </p>
      ) : null}
    </div>
  )
}

interface StorePriceLineProps {
  price: CurrentPrice
  isLowest: boolean
  verdict: PriceVerdict | null
}

const CompactStoreChip = ({ price }: { price: CurrentPrice }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surfaceHigh px-2 py-1 text-[11px] font-semibold text-text-secondary">
    <span
      className={['h-1.5 w-1.5 shrink-0 rounded-full', STORE_COLORS[price.store]].join(' ')}
      aria-hidden="true"
    />
    <span>{STORE_LABELS[price.store]}</span>
    <span className="tabular-nums text-text-primary">{formatNaira(price.price_ngn)}</span>
  </span>
)

const StorePriceLine = ({ price, isLowest, verdict }: StorePriceLineProps) => {
  const storeLabel = STORE_LABELS[price.store]
  const variantText = getVariantText(price)
  const freshnessStatus = getPriceFreshnessStatus(price.scraped_at)

  const content = (
    <div
      className={[
        'flex flex-col gap-3 rounded-sm border px-3 py-2 transition-colors duration-fast sm:flex-row sm:items-center sm:justify-between',
        price.in_stock
          ? isLowest
            ? 'border-accent/20 bg-accent-subtle'
            : 'border-border bg-surface hover:border-borderHigh'
          : 'border-border bg-surface opacity-50',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-start gap-2 sm:items-center">
        <span
          className={['h-1.5 w-1.5 shrink-0 rounded-full', STORE_COLORS[price.store]].join(' ')}
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{storeLabel}</span>
            {isLowest && price.in_stock ? (
              <span className="text-xs font-bold text-accent">Best current</span>
            ) : null}
            <Badge
              variant={getFreshnessBadgeVariant(freshnessStatus)}
              className="px-1.5 py-0 text-[10px] tracking-[0.12em]"
            >
              {getPriceFreshnessLabel(freshnessStatus)}
            </Badge>
            <PriceVerdictBadge verdict={verdict} compact />
          </div>
          {variantText ? (
            <p className="break-words text-[11px] text-text-muted">{variantText}</p>
          ) : null}
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-3">
        {price.in_stock ? (
          <>
            <span className="text-sm font-bold tabular-nums text-text-primary sm:text-right">
              {formatNaira(price.price_ngn)}
            </span>
            {price.url ? (
              <a
                href={price.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center justify-center rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary sm:min-h-0"
                aria-label={`Open ${storeLabel}`}
              >
                Open store
              </a>
            ) : null}
          </>
        ) : (
          <span className="text-xs text-text-muted">Out of stock</span>
        )}
      </div>
    </div>
  )

  return (
    <Tooltip content={formatPriceFreshness(price.scraped_at)} position="top">
      {content}
    </Tooltip>
  )
}
