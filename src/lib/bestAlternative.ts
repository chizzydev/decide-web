import type { PhoneCard, PhoneDetail } from '@/types'
import { buildVariantAwareCompareHref, getTrackedCompareVariantFromPrices } from '@/lib/compareContext'

export interface BestAlternativeInsight {
  phone: PhoneCard
  href: string
  detailHref: string
  label: string
  headline: string
  summary: string
  reasons: string[]
  cautions: string[]
  priceNgN: number | null
  basePriceNgN: number | null
  compareContext: string | null
}

interface SelectedVariantContext {
  id?: number | null
  label?: string | null
  prices?: PhoneDetail['prices'] | null
}

const RISK_SCORE = {
  low: 3,
  medium: 2,
  high: 1,
} as const

const SUPPORT_SCORE = {
  good: 3,
  fair: 2,
  poor: 1,
} as const

const getLowestTrackedPrice = (prices: PhoneCard['prices']) => {
  const activePrices = prices
    .filter((price) => price.in_stock && price.price_ngn > 0)
    .map((price) => price.price_ngn)

  if (activePrices.length === 0) {
    return null
  }

  return Math.min(...activePrices)
}

const getDecisionScore = (phone: PhoneCard) =>
  (
    phone.score_battery +
    phone.score_camera +
    phone.score_performance +
    phone.score_build +
    phone.score_value
  ) / 5

const getSupportScore = (phone: PhoneCard) =>
  phone.local_support_quality ? SUPPORT_SCORE[phone.local_support_quality] : 2

const getStrongestCategory = (phone: PhoneCard) => {
  const scores = [
    { label: 'battery', value: phone.score_battery },
    { label: 'camera', value: phone.score_camera },
    { label: 'performance', value: phone.score_performance },
    { label: 'build quality', value: phone.score_build },
    { label: 'value', value: phone.score_value },
  ]

  return scores.sort((left, right) => right.value - left.value)[0]
}

const formatCompactNairaText = (amount: number) => {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    return `NGN ${millions % 1 === 0 ? millions : millions.toFixed(1)}m`
  }

  if (amount >= 1_000) {
    const thousands = amount / 1_000
    return `NGN ${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`
  }

  return `NGN ${amount.toLocaleString('en-NG')}`
}

const buildCompareContext = (
  leftLabel?: string | null,
  rightLabel?: string | null
) => {
  if (leftLabel && rightLabel) {
    return `Comparing ${leftLabel} against ${rightLabel}.`
  }

  if (leftLabel) {
    return `Starts from the tracked ${leftLabel} option.`
  }

  if (rightLabel) {
    return `Alternative starts from ${rightLabel}.`
  }

  return null
}

const getCandidatePriority = (
  phone: PhoneDetail,
  candidate: PhoneCard,
  basePrice: number | null,
  candidatePrice: number | null
) => {
  const baseDecisionScore = getDecisionScore(phone)
  const candidateDecisionScore = getDecisionScore(candidate)
  let score = 0

  score += (candidateDecisionScore - baseDecisionScore) * 10
  score += (candidate.score_value - phone.score_value) * 8
  score += (RISK_SCORE[candidate.gray_market_risk] - RISK_SCORE[phone.gray_market_risk]) * 8
  score += (getSupportScore(candidate) - getSupportScore(phone)) * 5

  if (candidate.brand_name === phone.brand_name) {
    score += 7
  }

  if (candidate.os_type === phone.os_type) {
    score += 5
  } else {
    score += 3
  }

  if (basePrice != null && candidatePrice != null) {
    const ratio = candidatePrice / basePrice

    if (ratio <= 0.82) {
      score += 28
    } else if (ratio <= 0.95) {
      score += 22
    } else if (ratio <= 1.08) {
      score += 16
    } else if (ratio <= 1.2 && candidateDecisionScore > baseDecisionScore) {
      score += 8
    } else if (ratio > 1.35) {
      score -= 32
    }
  } else if (candidatePrice != null) {
    score += 8
  }

  if (candidate.score_battery - phone.score_battery >= 1) score += 4
  if (candidate.score_camera - phone.score_camera >= 1) score += 4
  if (candidate.score_performance - phone.score_performance >= 1) score += 4

  return score
}

const shouldKeepCandidate = (
  phone: PhoneDetail,
  candidate: PhoneCard,
  basePrice: number | null,
  candidatePrice: number | null
) => {
  if (candidate.slug === phone.slug) {
    return false
  }

  if (basePrice == null || candidatePrice == null) {
    return true
  }

  const baseDecisionScore = getDecisionScore(phone)
  const candidateDecisionScore = getDecisionScore(candidate)
  const isMuchHigher = candidatePrice > basePrice * 1.45
  const isClearlyStronger = candidateDecisionScore >= baseDecisionScore + 1

  return !isMuchHigher || isClearlyStronger
}

const buildReasons = (
  phone: PhoneDetail,
  candidate: PhoneCard,
  basePrice: number | null,
  candidatePrice: number | null
) => {
  const reasons: string[] = []
  const candidateDecisionScore = getDecisionScore(candidate)
  const baseDecisionScore = getDecisionScore(phone)

  if (basePrice != null && candidatePrice != null) {
    const gap = Math.abs(basePrice - candidatePrice)

    if (candidatePrice < basePrice && gap >= 30_000) {
      reasons.push(`It is about ${formatCompactNairaText(gap)} cheaper at the current tracked price.`)
    } else if (candidatePrice > basePrice && gap >= 30_000) {
      reasons.push(`It costs about ${formatCompactNairaText(gap)} more, so it only makes sense if the tradeoffs matter to you.`)
    } else {
      reasons.push('It sits in almost the same tracked price lane, which makes the comparison fair.')
    }
  } else if (candidatePrice != null) {
    reasons.push('It has a live tracked price, while this page still needs stronger price context.')
  } else {
    reasons.push('Tracked price context is weak, so treat this as a comparison lead, not a buy verdict.')
  }

  if (candidate.score_value >= phone.score_value + 0.5) {
    reasons.push('Its value score is stronger, so it may stretch the same money further.')
  } else if (candidateDecisionScore >= baseDecisionScore + 0.6) {
    reasons.push('Its overall Decide scores are stronger across the main buying categories.')
  }

  const strongestCategory = getStrongestCategory(candidate)
  if (strongestCategory.value >= 8) {
    reasons.push(`Its strongest lane is ${strongestCategory.label}, which is useful if that matters most to you.`)
  }

  if (RISK_SCORE[candidate.gray_market_risk] > RISK_SCORE[phone.gray_market_risk]) {
    reasons.push('It carries a cleaner gray-market risk signal.')
  } else if (getSupportScore(candidate) > getSupportScore(phone)) {
    reasons.push('Its local support signal is cleaner for ownership after purchase.')
  }

  if (phone.os_type === 'ios' && candidate.os_type === 'android') {
    reasons.push('This is the Android pressure-test if battery, specs, and value matter more than iPhone resale or status.')
  } else if (phone.os_type === 'android' && candidate.os_type === 'ios') {
    reasons.push('This is the iPhone pressure-test if camera, social video, resale, and status matter more than raw specs.')
  }

  return reasons.slice(0, 4)
}

const buildCautions = (
  phone: PhoneDetail,
  candidate: PhoneCard,
  basePrice: number | null,
  candidatePrice: number | null
) => {
  const cautions: string[] = []

  if (phone.os_type !== candidate.os_type) {
    cautions.push('Switching between iPhone and Android changes accessories, apps, resale expectations, and daily habits.')
  }

  if (candidate.gray_market_risk === 'high') {
    cautions.push('This alternative still needs careful seller, warranty, and variant checks before you treat it as safe.')
  }

  if (basePrice != null && candidatePrice != null && candidatePrice > basePrice * 1.08) {
    cautions.push('Do not pay extra unless the stronger categories match your real use case.')
  }

  if (candidatePrice == null) {
    cautions.push('Wait for a trusted tracked price before treating this as a current-market bargain.')
  } else {
    cautions.push('Compare the exact RAM/storage variant before choosing.')
  }

  return cautions.slice(0, 3)
}

const buildHeadline = (
  phone: PhoneDetail,
  candidate: PhoneCard,
  basePrice: number | null,
  candidatePrice: number | null
) => {
  if (basePrice != null && candidatePrice != null) {
    if (candidatePrice < basePrice * 0.9 && candidate.score_value >= phone.score_value) {
      return 'Better value for less money'
    }

    if (candidatePrice <= basePrice * 1.08) {
      return 'The closest smart pressure-test'
    }

    return 'Worth checking before you pay more'
  }

  return 'Best current comparison lead'
}

export const getBestAlternativeRightNow = (
  phone: PhoneDetail,
  candidates: PhoneCard[],
  selectedVariant?: SelectedVariantContext
): BestAlternativeInsight | null => {
  const selectedVariantPrice = selectedVariant?.prices
    ? getLowestTrackedPrice(selectedVariant.prices)
    : null
  const basePrice = selectedVariantPrice ?? getLowestTrackedPrice(phone.prices)

  const rankedCandidates = candidates
    .map((candidate) => {
      const candidatePrice = getLowestTrackedPrice(candidate.prices)
      return {
        candidate,
        candidatePrice,
        priority: getCandidatePriority(phone, candidate, basePrice, candidatePrice),
      }
    })
    .filter(({ candidate, candidatePrice }) =>
      shouldKeepCandidate(phone, candidate, basePrice, candidatePrice)
    )
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority
      }

      return (left.candidatePrice ?? Number.MAX_SAFE_INTEGER) -
        (right.candidatePrice ?? Number.MAX_SAFE_INTEGER)
    })

  const best = rankedCandidates[0]

  if (!best) {
    return null
  }

  const counterpartVariant = getTrackedCompareVariantFromPrices(best.candidate.prices)
  const compareContext = buildCompareContext(
    selectedVariant?.label,
    counterpartVariant?.variantLabel
  )

  return {
    phone: best.candidate,
    href: buildVariantAwareCompareHref({
      leftSlug: phone.slug,
      rightSlug: best.candidate.slug,
      leftVariantId: selectedVariant?.id,
      rightVariantId: counterpartVariant?.variantId,
    }),
    detailHref: `/phones/${best.candidate.slug}`,
    label: 'Best alternative right now',
    headline: buildHeadline(phone, best.candidate, basePrice, best.candidatePrice),
    summary:
      'This is the nearby phone Decide would pressure-test first before treating the current model as the final answer.',
    reasons: buildReasons(phone, best.candidate, basePrice, best.candidatePrice),
    cautions: buildCautions(phone, best.candidate, basePrice, best.candidatePrice),
    priceNgN: best.candidatePrice,
    basePriceNgN: basePrice,
    compareContext,
  }
}
