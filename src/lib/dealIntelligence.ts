import type { RelatedCompareAction } from '@/lib/relatedCompare'
import type { PriceDropRadarItem } from '@/types'

export type DealIntelligenceTone = 'strong' | 'good' | 'watch'

export interface DealIntelligence {
  timingLabel: string
  timingTone: DealIntelligenceTone
  timingSummary: string
  confidenceLabel: string
  confidenceTone: DealIntelligenceTone
  confidenceReason: string
  alternativeLabel: string
  alternativeSummary: string
}

const STORE_LABELS = {
  jumia: 'Jumia',
  slot: 'Slot',
} as const

const formatCompactNaira = (amount: number) => {
  const absoluteAmount = Math.abs(amount)

  if (absoluteAmount >= 1_000_000) {
    return `NGN ${(absoluteAmount / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  }

  if (absoluteAmount >= 1_000) {
    return `NGN ${(absoluteAmount / 1_000).toFixed(0)}k`
  }

  return `NGN ${absoluteAmount.toLocaleString('en-NG')}`
}

const getAgeHours = (dateString: string) => {
  const timestamp = new Date(dateString).getTime()

  if (!Number.isFinite(timestamp)) {
    return Number.POSITIVE_INFINITY
  }

  return Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60))
}

const lowerFirst = (value: string) =>
  value.length > 0 ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value

const getDropPercent = (deal: PriceDropRadarItem) =>
  Math.abs(deal.change_percent ?? 0)

const getTiming = (deal: PriceDropRadarItem) => {
  const storeLabel = STORE_LABELS[deal.store]
  const dropPercent = getDropPercent(deal)
  const dropAmount = Math.max(0, deal.change_amount_ngn)
  const isStrongDrop = dropPercent >= 12 || dropAmount >= 50_000
  const isGoodDrop = dropPercent >= 7 || dropAmount >= 25_000

  if (isStrongDrop) {
    return {
      label: 'Strong buying window',
      tone: 'strong' as const,
      summary: `${storeLabel} is now ${formatCompactNaira(dropAmount)} lower than the previous tracked price. That is a meaningful move, but still confirm variant, stock, and seller terms before paying.`,
    }
  }

  if (isGoodDrop) {
    return {
      label: 'Worth checking now',
      tone: 'good' as const,
      summary: `${storeLabel} moved by ${formatCompactNaira(dropAmount)} in this tracked pass. It is worth checking if this phone already fits your budget and use case.`,
    }
  }

  return {
    label: 'Useful movement',
    tone: 'watch' as const,
    summary: `${storeLabel} moved lower, but this is still a modest signal. Use the verdict and compare links before treating it as a must-buy deal.`,
  }
}

const getConfidence = (deal: PriceDropRadarItem) => {
  const ageHours = getAgeHours(deal.scraped_at)
  const hasPreviousPrice = deal.previous_price_ngn > deal.current_price_ngn
  const hasPreviousTimestamp = Boolean(deal.previous_scraped_at)
  const dropPercent = getDropPercent(deal)
  const dropAmount = Math.max(0, deal.change_amount_ngn)
  const isFresh = ageHours <= 24
  const isAging = ageHours > 48
  const isMeaningfulDrop = dropPercent >= 7 || dropAmount >= 25_000

  if (isFresh && deal.in_stock && hasPreviousPrice && hasPreviousTimestamp && isMeaningfulDrop) {
    return {
      label: 'High',
      tone: 'strong' as const,
      reason:
        'Fresh tracked movement, current in-stock signal, and a real previous price make this a stronger lead. Still verify the store page before paying.',
    }
  }

  if (!isAging && deal.in_stock && hasPreviousPrice) {
    return {
      label: 'Medium',
      tone: 'good' as const,
      reason:
        'The price moved in the right direction, but Decide still wants you to confirm current stock, exact variant, and seller terms.',
    }
  }

  return {
    label: 'Watch closely',
    tone: 'watch' as const,
    reason:
      'This is useful market movement, but the signal is less complete. Treat it as a lead to inspect, not a blind buy instruction.',
  }
}

const getAlternative = (
  compareAction: RelatedCompareAction<PriceDropRadarItem> | null
) => {
  if (!compareAction) {
    return {
      label: 'Alternative check',
      summary:
        'No close radar alternative is attached to this drop yet. Use Compare if you already have another phone in mind.',
    }
  }

  const reason = compareAction.reason
    ? ` because ${lowerFirst(compareAction.reason)}`
    : ''

  return {
    label: 'Best alternative',
    summary: `Pressure-test it against ${compareAction.counterpart.phone_name}${reason}.`,
  }
}

export const buildDealIntelligence = (
  deal: PriceDropRadarItem,
  compareAction: RelatedCompareAction<PriceDropRadarItem> | null
): DealIntelligence => {
  const timing = getTiming(deal)
  const confidence = getConfidence(deal)
  const alternative = getAlternative(compareAction)

  return {
    timingLabel: timing.label,
    timingTone: timing.tone,
    timingSummary: timing.summary,
    confidenceLabel: confidence.label,
    confidenceTone: confidence.tone,
    confidenceReason: confidence.reason,
    alternativeLabel: alternative.label,
    alternativeSummary: alternative.summary,
  }
}
