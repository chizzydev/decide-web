import type { CurrentPrice, StoreType } from '@/types'
import { STORE_LABELS } from '@/lib/constants'
import { getPriceFreshnessStatus } from '@/lib/priceFreshness'

export type MarketConfidenceTone = 'strong' | 'steady' | 'caution' | 'weak'

export type MarketConfidenceLabel =
  | 'Trusted-store consistency'
  | 'Stable price'
  | 'Unstable price'
  | 'Suspicious spread'
  | 'Weak stock'

export interface MarketConfidenceSignal {
  label: string
  value: string
}

export interface MarketConfidence {
  label: MarketConfidenceLabel
  tone: MarketConfidenceTone
  summary: string
  signals: MarketConfidenceSignal[]
}

const SUSPICIOUS_SPREAD_RATIO = 0.22
const UNSTABLE_SPREAD_RATIO = 0.12

const activePrices = (prices: CurrentPrice[]) =>
  (prices ?? [])
    .filter((price) => price.in_stock && price.price_ngn > 0)
    .sort((left, right) => left.price_ngn - right.price_ngn)

const pricedRows = (prices: CurrentPrice[]) =>
  (prices ?? []).filter((price) => price.price_ngn > 0)

const uniqueStores = (prices: CurrentPrice[]) =>
  Array.from(new Set(prices.map((price) => price.store)))

const getFreshnessCounts = (prices: CurrentPrice[]) => {
  const counts = {
    fresh: 0,
    aging: 0,
    stale: 0,
  }

  prices.forEach((price) => {
    counts[getPriceFreshnessStatus(price.scraped_at)] += 1
  })

  return counts
}

const formatStoreList = (stores: StoreType[]) =>
  stores.map((store) => STORE_LABELS[store]).join(' + ')

const formatPercent = (value: number) =>
  `${Math.round(value * 100)}%`

export const buildMarketConfidence = (
  prices: CurrentPrice[]
): MarketConfidence | null => {
  const allPricedRows = pricedRows(prices)
  const inStock = activePrices(prices)

  if (allPricedRows.length === 0) {
    return null
  }

  const inStockStores = uniqueStores(inStock)
  const allTrackedStores = uniqueStores(allPricedRows)
  const freshnessCounts = getFreshnessCounts(allPricedRows)
  const lowest = inStock[0] ?? null
  const highest = inStock[inStock.length - 1] ?? null
  const spreadRatio =
    lowest && highest && lowest.price_ngn > 0
      ? (highest.price_ngn - lowest.price_ngn) / lowest.price_ngn
      : 0
  const freshnessSignal =
    freshnessCounts.stale > 0
      ? `${freshnessCounts.stale} stale`
      : freshnessCounts.aging > 0
        ? `${freshnessCounts.aging} aging`
        : 'Fresh'
  const baseSignals: MarketConfidenceSignal[] = [
    {
      label: 'Trusted stores',
      value: allTrackedStores.length > 0 ? formatStoreList(allTrackedStores) : 'Waiting',
    },
    {
      label: 'Live stock',
      value:
        inStockStores.length > 0
          ? `${inStockStores.length} of ${allTrackedStores.length} tracked`
          : 'No tracked store in stock',
    },
    {
      label: 'Freshness',
      value: freshnessSignal,
    },
  ]

  if (inStock.length === 0) {
    return {
      label: 'Weak stock',
      tone: 'weak',
      summary:
        'Decide has tracked prices for this phone, but none of the trusted rows are currently in stock. Treat the market read as weak until a live listing returns.',
      signals: baseSignals,
    }
  }

  if (inStockStores.length === 1) {
    return {
      label: 'Weak stock',
      tone: 'weak',
      summary:
        'Only one trusted store is live right now, so Decide cannot confirm whether the price is broadly representative of the market.',
      signals: [
        ...baseSignals,
        {
          label: 'Spread',
          value: 'Not enough live stores',
        },
      ],
    }
  }

  if (spreadRatio >= SUSPICIOUS_SPREAD_RATIO) {
    return {
      label: 'Suspicious spread',
      tone: 'caution',
      summary:
        'Trusted stores are far apart on price. This may be a variant mismatch, stale listing, seller issue, or temporary stock distortion, so verify the exact model before paying.',
      signals: [
        ...baseSignals,
        {
          label: 'Store spread',
          value: formatPercent(spreadRatio),
        },
      ],
    }
  }

  if (spreadRatio >= UNSTABLE_SPREAD_RATIO || freshnessCounts.stale > 0) {
    return {
      label: 'Unstable price',
      tone: 'caution',
      summary:
        'There is enough movement or aging data here that a tight buying decision should be rechecked on the retailer pages before you act.',
      signals: [
        ...baseSignals,
        {
          label: 'Store spread',
          value: formatPercent(spreadRatio),
        },
      ],
    }
  }

  if (freshnessCounts.aging > 0) {
    return {
      label: 'Stable price',
      tone: 'steady',
      summary:
        'The trusted-store prices are close together, but at least one check is aging. This is usable context, not a reason to skip store verification.',
      signals: [
        ...baseSignals,
        {
          label: 'Store spread',
          value: formatPercent(spreadRatio),
        },
      ],
    }
  }

  return {
    label: 'Trusted-store consistency',
    tone: 'strong',
    summary:
      'Jumia and Slot are both live, fresh, and close enough that Decide has stronger confidence in the current retail range.',
    signals: [
      ...baseSignals,
      {
        label: 'Store spread',
        value: formatPercent(spreadRatio),
      },
    ],
  }
}
