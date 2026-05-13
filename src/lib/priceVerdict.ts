import type { CurrentPrice } from '@/types'

export type PriceVerdictTone = 'great' | 'fair' | 'overpriced'
export type PriceVerdictLabel = 'Great deal' | 'Fair price' | 'Overpriced'

export interface PriceVerdict {
  label: PriceVerdictLabel
  tone: PriceVerdictTone
  summary: string
}

const MIN_MEANINGFUL_GAP_NGN = 20_000
const GREAT_DEAL_GAP_RATIO = 0.12
const OVERPRICED_GAP_NGN = 30_000
const OVERPRICED_GAP_RATIO = 0.15

const activePrices = (prices: CurrentPrice[]) =>
  prices
    .filter((price) => price.in_stock && price.price_ngn > 0)
    .sort((a, b) => a.price_ngn - b.price_ngn)

const isMeaningfullyLower = (price: number, comparison: number) => {
  const gap = comparison - price
  return gap >= MIN_MEANINGFUL_GAP_NGN && gap / comparison >= GREAT_DEAL_GAP_RATIO
}

const isMeaningfullyHigher = (price: number, comparison: number) => {
  const gap = price - comparison
  return gap >= OVERPRICED_GAP_NGN && gap / comparison >= OVERPRICED_GAP_RATIO
}

export const buildTrustedPriceVerdict = (prices: CurrentPrice[]): PriceVerdict | null => {
  const sorted = activePrices(prices)

  if (!sorted.length) {
    return null
  }

  if (sorted.length === 1) {
    return {
      label: 'Fair price',
      tone: 'fair',
      summary:
        'This is the only live trusted-store price Decide can compare right now. Verify the listing before paying.',
    }
  }

  const [lowest, nextLowest] = sorted

  if (isMeaningfullyLower(lowest.price_ngn, nextLowest.price_ngn)) {
    return {
      label: 'Great deal',
      tone: 'great',
      summary:
        'This is meaningfully lower than the next live trusted-store price. Still confirm the variant and stock before paying.',
    }
  }

  return {
    label: 'Fair price',
    tone: 'fair',
    summary:
      'This sits close to the live trusted-store range Decide is tracking. It does not look inflated from the current data.',
  }
}

export const buildStorePriceVerdict = (
  price: CurrentPrice,
  prices: CurrentPrice[],
): PriceVerdict | null => {
  if (!price.in_stock || price.price_ngn <= 0) {
    return null
  }

  const sorted = activePrices(prices)
  const lowest = sorted[0]
  const nextLowest = sorted.find((item) => item !== price && item.price_ngn >= price.price_ngn)

  if (!lowest || sorted.length === 1) {
    return {
      label: 'Fair price',
      tone: 'fair',
      summary:
        'This is the only live trusted-store price Decide can compare right now. Verify the listing before paying.',
    }
  }

  if (price === lowest && nextLowest && isMeaningfullyLower(price.price_ngn, nextLowest.price_ngn)) {
    return {
      label: 'Great deal',
      tone: 'great',
      summary:
        'This store is meaningfully cheaper than the next live trusted-store price for this phone.',
    }
  }

  if (isMeaningfullyHigher(price.price_ngn, lowest.price_ngn)) {
    return {
      label: 'Overpriced',
      tone: 'overpriced',
      summary:
        'This store is clearly above the lowest live trusted-store price Decide is tracking. Check the variant before paying.',
    }
  }

  return {
    label: 'Fair price',
    tone: 'fair',
    summary:
      'This store price is within the live trusted-store range Decide is tracking for this phone.',
  }
}

export const buildDropPriceVerdict = (
  changeAmountNgn: number | null,
  changePercent: number | null,
): PriceVerdict | null => {
  if (!changeAmountNgn || changeAmountNgn <= 0) {
    return null
  }

  const percent = Math.abs(changePercent ?? 0)

  if (percent >= 10 || changeAmountNgn >= 50_000) {
    return {
      label: 'Great deal',
      tone: 'great',
      summary:
        'This drop is large enough to be worth checking quickly, as long as the phone still fits your needs.',
    }
  }

  return {
    label: 'Fair price',
    tone: 'fair',
    summary:
      'This is a useful live drop, but still compare the phone against its alternatives before you pay.',
  }
}
