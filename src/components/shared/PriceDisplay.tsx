// decide-web/src/components/shared/PriceDisplay.tsx
// Renders the current Nigerian store prices for a phone.
// Shows the lowest price prominently, then individual store prices below.
// Handles out-of-stock, price unavailable, and single-store states cleanly.

import React from 'react'
import { Tooltip } from '@/components/ui'
import { formatNaira, formatPriceFreshness } from '@/lib/formatters'
import { STORE_LABELS } from '@/lib/constants'
import type { CurrentPrice, StoreType } from '@/types'

interface PriceDisplayProps {
  prices: CurrentPrice[]
  // Shows only the lowest price in a compact single-line format.
  // Used inside phone cards where space is tight.
  compact?: boolean
  className?: string
}

const STORE_COLORS: Record<StoreType, string> = {
  jumia: 'bg-[#F68B1E]',
  slot: 'bg-[#0066B2]',
}

const getInStockPrices = (prices: CurrentPrice[]): CurrentPrice[] =>
  (prices ?? []).filter((p) => p.in_stock && p.price_ngn > 0)

const getDisplayablePrices = (prices: CurrentPrice[]): CurrentPrice[] =>
  (prices ?? [])
    .filter((p) => p.price_ngn > 0)
    .sort((a, b) => a.price_ngn - b.price_ngn)

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

// Returns true if stores differ in price by more than 5% — worth showing a range
const hasMeaningfulRange = (lowest: CurrentPrice, highest: CurrentPrice): boolean =>
  highest.price_ngn > lowest.price_ngn * 1.05

export const PriceDisplay = ({
  prices,
  compact = false,
  className = '',
}: PriceDisplayProps) => {
  const safePrices = prices ?? []
  const displayablePrices = getDisplayablePrices(safePrices)
  const inStockPrices = getInStockPrices(safePrices)
  const lowestPrice = getLowestInStockPrice(safePrices)
  const highestPrice = getHighestInStockPrice(safePrices)
  const freshestKnownPrice = displayablePrices[0] ?? null
  const hasAnyPrice = displayablePrices.length > 0

  const showRange = !!(
    lowestPrice &&
    highestPrice &&
    lowestPrice.store !== highestPrice.store &&
    hasMeaningfulRange(lowestPrice, highestPrice)
  )

  // ── No price data at all ──────────────────────────────────────────────────
  if (!hasAnyPrice) {
    return (
      <div className={className}>
        <span className="text-sm text-text-muted">Price unavailable</span>
      </div>
    )
  }

  // ── Compact mode ──────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className={['space-y-0.5', className].join(' ')}>
        {lowestPrice ? (
          <>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-bold text-text-primary tabular-nums">
                {formatNaira(lowestPrice.price_ngn)}
              </span>
              <span className="text-xs text-text-muted">
                on {STORE_LABELS[lowestPrice.store]}
              </span>
            </div>

            {showRange && highestPrice && (
              <p className="text-xs text-text-muted leading-none">
                up to {formatNaira(highestPrice.price_ngn)} on {STORE_LABELS[highestPrice.store]}
              </p>
            )}
          </>
        ) : (
          <span className="text-sm text-text-muted">Out of stock</span>
        )}
      </div>
    )
  }

  // ── Full mode ─────────────────────────────────────────────────────────────
  return (
    <div className={['space-y-3', className].join(' ')}>
      <div>
        {lowestPrice ? (
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black text-text-primary tracking-tight tabular-nums">
                {formatNaira(lowestPrice.price_ngn)}
              </span>
              <span className="text-xs text-text-muted">
                lowest · {STORE_LABELS[lowestPrice.store]}
              </span>
            </div>

            {showRange && highestPrice && (
              <p className="text-xs text-text-secondary">
                Range: {formatNaira(lowestPrice.price_ngn)} – {formatNaira(highestPrice.price_ngn)} across {inStockPrices.length} stores
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-error">Out of stock</span>
            <span className="text-xs text-text-muted">on all tracked stores</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {displayablePrices.map((price) => (
          <StorePriceLine
            key={price.store}
            price={price}
            isLowest={
              lowestPrice?.store === price.store &&
              lowestPrice?.price_ngn === price.price_ngn
            }
          />
        ))}
      </div>

      {freshestKnownPrice?.scraped_at && (
        <p className="text-xs text-text-muted">
          {formatPriceFreshness(freshestKnownPrice.scraped_at)}
        </p>
      )}
    </div>
  )
}

// ── StorePriceLine ─────────────────────────────────────────────────────────

interface StorePriceLineProps {
  price: CurrentPrice
  isLowest: boolean
}

const StorePriceLine = ({ price, isLowest }: StorePriceLineProps) => {
  const storeLabel = STORE_LABELS[price.store]

  const content = (
    <div
      className={[
        'flex items-center justify-between',
        'px-3 py-2 rounded-sm',
        'border transition-colors duration-fast',
        price.in_stock
          ? isLowest
            ? 'bg-accent-subtle border-accent/20'
            : 'bg-surface border-border hover:border-borderHigh'
          : 'bg-surface border-border opacity-50',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <span
          className={['w-1.5 h-1.5 rounded-full shrink-0', STORE_COLORS[price.store]].join(' ')}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-text-primary">{storeLabel}</span>
        {isLowest && price.in_stock && (
          <span className="text-xs font-bold text-accent">Best price</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {price.in_stock ? (
          <>
            <span className="text-sm font-bold text-text-primary tabular-nums">
              {formatNaira(price.price_ngn)}
            </span>
            {price.url && (
              <a
                href={price.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors duration-fast"
                aria-label={`Buy on ${storeLabel}`}
              >
                Buy →
              </a>
            )}
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