import type { PhoneCard, PhoneDetail, PriceDropRadarItem } from '@/types'
import {
  buildVariantAwareCompareHref,
  getTrackedCompareVariantFromPrices,
} from '@/lib/compareContext'

export interface RelatedCompareAction<T> {
  counterpart: T
  href: string
  reason?: string
  compare_context?: string | null
}

interface ComparableCandidate {
  slug: string
  brandName: string
  priceNgN: number | null
  signal: number
  variantId?: number | null
  variantLabel?: string | null
}

const getComparePriority = (
  base: ComparableCandidate,
  candidate: ComparableCandidate
) => {
  let score = 0

  if (base.brandName === candidate.brandName) {
    score += 60
  }

  if (base.priceNgN != null && candidate.priceNgN != null) {
    const priceGap = Math.abs(base.priceNgN - candidate.priceNgN)
    score += Math.max(0, 40 - Math.floor(priceGap / 50_000))
  }

  if (base.signal > 0 || candidate.signal > 0) {
    score += 10
  }

  if (base.signal > 0 && candidate.signal > 0) {
    score += 5
  }

  return score
}

const getCompareReason = (
  base: ComparableCandidate,
  candidate: ComparableCandidate
) => {
  const sameBrand = base.brandName === candidate.brandName
  const basePrice = base.priceNgN
  const candidatePrice = candidate.priceNgN
  const hasComparablePrice = basePrice != null && candidatePrice != null
  const priceGap = hasComparablePrice
    ? Math.abs(basePrice - candidatePrice)
    : null

  if (sameBrand && priceGap != null && priceGap <= 100_000) {
    return 'Same brand, same buying lane'
  }

  if (sameBrand) {
    return 'Nearby alternative from the same brand'
  }

  if (priceGap != null && priceGap <= 100_000) {
    return 'Very close price lane'
  }

  if (priceGap != null && priceGap <= 200_000) {
    return 'Similar budget alternative'
  }

  if (candidate.signal > 0) {
    return 'Relevant moving alternative'
  }

  return 'Likely alternative to pressure-test'
}

const selectCounterpart = <T,>(
  item: T,
  items: T[],
  toComparable: (candidate: T) => ComparableCandidate
): T | null => {
  const base = toComparable(item)
  const candidates = items.filter(
    (candidate) => toComparable(candidate).slug !== base.slug
  )

  if (candidates.length === 0) {
    return null
  }

  return [...candidates].sort((left, right) => {
    const priorityDelta =
      getComparePriority(base, toComparable(right)) -
      getComparePriority(base, toComparable(left))

    if (priorityDelta !== 0) {
      return priorityDelta
    }

    const leftPrice = toComparable(left).priceNgN ?? Number.MAX_SAFE_INTEGER
    const rightPrice = toComparable(right).priceNgN ?? Number.MAX_SAFE_INTEGER

    return leftPrice - rightPrice
  })[0] ?? null
}

const getLowestTrackedPrice = (phone: PhoneCard): number | null => {
  const prices = phone.prices
    .filter((price) => price.price_ngn > 0)
    .map((price) => price.price_ngn)

  if (prices.length === 0) {
    return null
  }

  return Math.min(...prices)
}

const buildVariantCompareContext = (
  leftLabel?: string | null,
  rightLabel?: string | null
): string | null => {
  if (leftLabel && rightLabel) {
    return `Starts from ${leftLabel} vs ${rightLabel}.`
  }

  if (leftLabel) {
    return `Starts from the tracked ${leftLabel} configuration on the left.`
  }

  if (rightLabel) {
    return `Starts from the tracked ${rightLabel} configuration on the right.`
  }

  return null
}

export const getPrimaryDealCompareAction = (
  deal: PriceDropRadarItem,
  deals: PriceDropRadarItem[]
): RelatedCompareAction<PriceDropRadarItem> | null => {
  const baseComparable = {
    slug: deal.phone_slug,
    brandName: deal.brand_name,
    priceNgN: deal.current_price_ngn,
    signal: deal.change_amount_ngn,
    variantId: deal.variant_id,
    variantLabel: deal.variant_label,
  }
  const counterpart = selectCounterpart(deal, deals, (candidate) => ({
    slug: candidate.phone_slug,
    brandName: candidate.brand_name,
    priceNgN: candidate.current_price_ngn,
    signal: candidate.change_amount_ngn,
    variantId: candidate.variant_id,
    variantLabel: candidate.variant_label,
  }))

  if (!counterpart) {
    return null
  }

  return {
    counterpart,
    href: buildVariantAwareCompareHref({
      leftSlug: deal.phone_slug,
      rightSlug: counterpart.phone_slug,
      leftVariantId: deal.variant_id,
      rightVariantId: counterpart.variant_id,
    }),
    reason: getCompareReason(baseComparable, {
      slug: counterpart.phone_slug,
      brandName: counterpart.brand_name,
      priceNgN: counterpart.current_price_ngn,
      signal: counterpart.change_amount_ngn,
      variantId: counterpart.variant_id,
      variantLabel: counterpart.variant_label,
    }),
    compare_context: buildVariantCompareContext(
      deal.variant_label,
      counterpart.variant_label
    ),
  }
}

export const getPrimaryPhoneCardCompareAction = (
  phone: PhoneCard,
  phones: PhoneCard[]
): RelatedCompareAction<PhoneCard> | null => {
  const baseComparable = {
    slug: phone.slug,
    brandName: phone.brand_name,
    priceNgN: getLowestTrackedPrice(phone),
    signal: 0,
  }
  const counterpart = selectCounterpart(phone, phones, (candidate) => ({
    slug: candidate.slug,
    brandName: candidate.brand_name,
    priceNgN: getLowestTrackedPrice(candidate),
    signal: 0,
  }))

  if (!counterpart) {
    return null
  }

  const phoneVariant = getTrackedCompareVariantFromPrices(phone.prices)
  const counterpartVariant = getTrackedCompareVariantFromPrices(counterpart.prices)

  return {
    counterpart,
    href: buildVariantAwareCompareHref({
      leftSlug: phone.slug,
      rightSlug: counterpart.slug,
      leftVariantId: phoneVariant?.variantId,
      rightVariantId: counterpartVariant?.variantId,
    }),
    reason: getCompareReason(baseComparable, {
      slug: counterpart.slug,
      brandName: counterpart.brand_name,
      priceNgN: getLowestTrackedPrice(counterpart),
      signal: 0,
    }),
    compare_context: buildVariantCompareContext(
      phoneVariant?.variantLabel,
      counterpartVariant?.variantLabel
    ),
  }
}

export const getTopPhoneDetailCompareActions = (
  phone: PhoneDetail,
  phones: PhoneCard[],
  selectedVariant?: {
    id?: number | null
    label?: string | null
  },
  limit = 3
): RelatedCompareAction<PhoneCard>[] => {
  const baseComparable = {
    slug: phone.slug,
    brandName: phone.brand_name,
    priceNgN: getLowestTrackedPrice(phone),
    signal: 0,
  }

  return phones
    .filter((candidate) => candidate.slug !== phone.slug)
    .sort((left, right) => {
      const priorityDelta =
        getComparePriority(baseComparable, {
          slug: right.slug,
          brandName: right.brand_name,
          priceNgN: getLowestTrackedPrice(right),
          signal: 0,
        }) -
        getComparePriority(baseComparable, {
          slug: left.slug,
          brandName: left.brand_name,
          priceNgN: getLowestTrackedPrice(left),
          signal: 0,
        })

      if (priorityDelta !== 0) {
        return priorityDelta
      }

      const leftPrice = getLowestTrackedPrice(left) ?? Number.MAX_SAFE_INTEGER
      const rightPrice = getLowestTrackedPrice(right) ?? Number.MAX_SAFE_INTEGER

      return leftPrice - rightPrice
    })
    .slice(0, limit)
    .map((counterpart) => ({
      counterpart,
      href: buildVariantAwareCompareHref({
        leftSlug: phone.slug,
        rightSlug: counterpart.slug,
        leftVariantId: selectedVariant?.id,
        rightVariantId: getTrackedCompareVariantFromPrices(counterpart.prices)?.variantId,
      }),
      reason: getCompareReason(baseComparable, {
        slug: counterpart.slug,
        brandName: counterpart.brand_name,
        priceNgN: getLowestTrackedPrice(counterpart),
        signal: 0,
      }),
      compare_context: buildVariantCompareContext(
        selectedVariant?.label,
        getTrackedCompareVariantFromPrices(counterpart.prices)?.variantLabel
      ),
    }))
}
