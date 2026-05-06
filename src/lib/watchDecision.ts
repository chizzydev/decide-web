import type { PriceAlert, WatchlistItem } from '@/types'
import {
  buildBuyNowWaitHref,
  buildPhoneDetailHref,
  buildUsedGuideHref,
} from '@/lib/variantHref'

export type WatchDecisionTone = 'accent' | 'warning' | 'neutral'

export interface WatchDecisionPlan {
  title: string
  description: string
  tone: WatchDecisionTone
  href: string
  label: string
}

export interface WatchCompareSuggestion {
  left: WatchlistItem
  right: WatchlistItem
  reason: string
  compare_context: string | null
  href: string
}

export interface WatchCompareAction {
  counterpart: WatchlistItem
  href: string
  context: string | null
}

type AlertScope = Pick<PriceAlert, 'phone_id' | 'variant_id'>
type AlertDetailScope = Pick<PriceAlert, 'phone_slug' | 'variant_id'>

export const getWatchFocusedVariantLabel = (
  item: WatchlistItem
): string | null => item.focused_variant?.label ?? null

export const getWatchDetailHref = (item: WatchlistItem): string =>
  buildPhoneDetailHref(item.phone_slug, {
    variantId: item.focused_variant?.id ?? null,
    anchor: item.focused_variant?.id ? 'variant-pricing' : null,
  })

export const getAlertDetailHref = (alert: AlertDetailScope): string =>
  buildPhoneDetailHref(alert.phone_slug, {
    variantId: alert.variant_id,
    anchor: alert.variant_id ? 'variant-pricing' : null,
  })

export const getWatchBuyNowWaitHref = (item: WatchlistItem): string =>
  buildBuyNowWaitHref(item.phone_slug, {
    variantId: item.focused_variant?.id ?? null,
  })

export const getWatchUsedGuideHref = (item: WatchlistItem): string =>
  buildUsedGuideHref(item.phone_slug, {
    variantId: item.focused_variant?.id ?? null,
  })

export const buildWatchCompareHref = (
  left: WatchlistItem,
  right: WatchlistItem
): string => {
  const params = new URLSearchParams()

  if (left.focused_variant?.id) {
    params.set('left_variant_id', String(left.focused_variant.id))
  }

  if (right.focused_variant?.id) {
    params.set('right_variant_id', String(right.focused_variant.id))
  }

  const suffix = params.toString()

  return `/compare/${left.phone_slug}/vs/${right.phone_slug}${suffix ? `?${suffix}` : ''}`
}

export const isAlertRelevantToWatchItem = (
  item: WatchlistItem,
  alert: AlertScope
): boolean => {
  if (item.phone_id !== alert.phone_id) {
    return false
  }

  return alert.variant_id == null || alert.variant_id === item.focused_variant?.id
}

export const getRelevantAlertsForWatchItem = (
  item: WatchlistItem,
  alerts: PriceAlert[]
): PriceAlert[] => alerts.filter((alert) => isAlertRelevantToWatchItem(item, alert))

const buildCompareContext = (
  item: WatchlistItem,
  counterpart: WatchlistItem
): string | null => {
  const itemLabel = getWatchFocusedVariantLabel(item)
  const counterpartLabel = getWatchFocusedVariantLabel(counterpart)

  if (itemLabel && counterpartLabel) {
    return `Compare starts from ${itemLabel} vs ${counterpartLabel}.`
  }

  if (itemLabel) {
    return `Compare starts from ${item.phone_name}'s tracked ${itemLabel} configuration.`
  }

  if (counterpartLabel) {
    return `Compare starts from ${counterpart.phone_name}'s tracked ${counterpartLabel} configuration.`
  }

  return null
}

export const getWatchDecisionPlan = (item: WatchlistItem): WatchDecisionPlan => {
  const hasActiveAlert = item.alerts.active_alert_count > 0
  const hasRecentDrop = (item.recent_drop_amount_ngn ?? 0) > 0
  const highRisk =
    item.ownership.support_outlook === 'expired' ||
    item.ownership.repair_outlook === 'weak'
  const cautionRisk =
    item.ownership.support_outlook === 'limited' ||
    item.ownership.resale_outlook === 'weak'

  if (highRisk) {
    return {
      title: hasRecentDrop
        ? 'Risk is high. Do not chase this drop blindly.'
        : 'Check the long-term risk before this becomes a buy.',
      description:
        'Support or repair risk is elevated here, so the smarter Decide move is to read the verdict and the used guide before you commit to a seller or a price.',
      tone: 'warning',
      href: getWatchUsedGuideHref(item),
      label: 'Open used guide',
    }
  }

  if (hasRecentDrop && hasActiveAlert) {
    return {
      title: 'Price is moving and you are already covered.',
      description:
        'Your alert is active, so you do not need to babysit this phone. The best next step is the timing verdict: decide whether this drop is already good enough to act on.',
      tone: 'accent',
      href: getWatchBuyNowWaitHref(item),
      label: 'Read buy or wait',
    }
  }

  if (hasRecentDrop) {
    return {
      title: 'This price already moved. Decide whether to act or wait.',
      description:
        'Before you set a lower target just because it got cheaper, use the timing verdict to see whether the current market move is already worth taking seriously.',
      tone: cautionRisk ? 'warning' : 'accent',
      href: getWatchBuyNowWaitHref(item),
      label: 'Read buy or wait',
    }
  }

  if (hasActiveAlert) {
    return {
      title: 'Protected for now. Let the watch do its job.',
      description:
        'This phone is already covered, so you can stop checking it manually. Use Compare or the verdict pages when you are closer to making the final call.',
      tone: cautionRisk ? 'warning' : 'neutral',
      href: '/compare',
      label: 'Compare phones',
    }
  }

  return {
    title: 'Turn this save into a real watch.',
    description:
      'Right now this is only a saved phone. Add an alert so Decide can do the timing work for you, then come back to the verdict when the market actually moves.',
    tone: cautionRisk ? 'warning' : 'accent',
    href: getWatchBuyNowWaitHref(item),
    label: 'Read buy or wait',
  }
}

export const getActiveAlertDecisionPlan = (
  item: WatchlistItem | null,
  alert: PriceAlert
): WatchDecisionPlan => {
  if (!item) {
    return {
      title: 'Keep this alert live while the market moves.',
      description:
        'Decide will keep watching this target for you. Use the watchlist and compare flows when you are ready to make a tighter finalist decision.',
      tone: 'neutral',
      href: '/saved',
      label: 'Open watchlist',
    }
  }

  const currentPrice = alert.current_price_ngn ?? item.current_best_price_ngn
  const hasRecentDrop = (item.recent_drop_amount_ngn ?? 0) > 0
  const highRisk =
    item.ownership.support_outlook === 'expired' ||
    item.ownership.repair_outlook === 'weak'
  const cautionRisk =
    item.ownership.support_outlook === 'limited' ||
    item.ownership.resale_outlook === 'weak'
  const targetReached =
    currentPrice != null && currentPrice <= alert.target_price

  if (targetReached && highRisk) {
    return {
      title: 'The target is hit, but the ownership risk is still high.',
      description:
        'Do not let the price alone close the decision. Decide wants you to pressure-test the risk and used-buying guidance before you commit.',
      tone: 'warning',
      href: getWatchUsedGuideHref(item),
      label: 'Open used guide',
    }
  }

  if (targetReached) {
    return {
      title: 'Your target is already in range.',
      description:
        'This alert has effectively done its job. The best next step is the timing verdict so you can decide whether to act now or keep waiting for a cleaner price.',
      tone: cautionRisk ? 'warning' : 'accent',
      href: getWatchBuyNowWaitHref(item),
      label: 'Read buy or wait',
    }
  }

  if (highRisk) {
    return {
      title: 'Keep the alert, but do not ignore the risk profile.',
      description:
        'The price target is not enough on its own here. Decide wants you to understand the support and repair tradeoffs before this phone becomes a finalist.',
      tone: 'warning',
      href: getWatchUsedGuideHref(item),
      label: 'Open used guide',
    }
  }

  if (hasRecentDrop) {
    return {
      title: 'The market is already moving under this alert.',
      description:
        'Price movement has started, so this is a good time to read the timing verdict and decide whether the current trend is strong enough for action.',
      tone: cautionRisk ? 'warning' : 'accent',
      href: getWatchBuyNowWaitHref(item),
      label: 'Read buy or wait',
    }
  }

  return {
    title: 'Let the alert watch, and compare only when the shortlist tightens.',
    description:
      'The target has not landed yet, so you do not need to babysit the price. The best Decide move is to keep this protected and use Compare when you are down to finalists.',
    tone: cautionRisk ? 'warning' : 'neutral',
    href: '/compare',
    label: 'Compare phones',
  }
}

const getComparablePrice = (item: WatchlistItem) =>
  item.current_best_price_ngn ?? Number.MAX_SAFE_INTEGER

const getComparePriority = (base: WatchlistItem, candidate: WatchlistItem) => {
  let score = 0

  if (base.brand_name === candidate.brand_name) {
    score += 60
  }

  const basePrice = getComparablePrice(base)
  const candidatePrice = getComparablePrice(candidate)

  if (Number.isFinite(basePrice) && Number.isFinite(candidatePrice)) {
    const priceGap = Math.abs(basePrice - candidatePrice)
    score += Math.max(0, 40 - Math.floor(priceGap / 50_000))
  }

  if (
    (base.recent_drop_amount_ngn ?? 0) > 0 ||
    (candidate.recent_drop_amount_ngn ?? 0) > 0
  ) {
    score += 10
  }

  if (
    base.alerts.active_alert_count > 0 &&
    candidate.alerts.active_alert_count > 0
  ) {
    score += 6
  }

  if (
    base.ownership.support_outlook === candidate.ownership.support_outlook
  ) {
    score += 3
  }

  if (
    base.ownership.repair_outlook === candidate.ownership.repair_outlook
  ) {
    score += 2
  }

  return score
}

const buildCompareReason = (
  left: WatchlistItem,
  right: WatchlistItem
): string => {
  if (left.brand_name === right.brand_name) {
    return 'Same brand, similar shortlist stage. This is a good head-to-head before you act.'
  }

  const priceGap = Math.abs(getComparablePrice(left) - getComparablePrice(right))

  if (Number.isFinite(priceGap) && priceGap <= 150_000) {
    return 'These phones sit close enough in price to deserve a proper side-by-side decision.'
  }

  if (
    (left.recent_drop_amount_ngn ?? 0) > 0 ||
    (right.recent_drop_amount_ngn ?? 0) > 0
  ) {
    return 'At least one of these phones is already moving in price, so compare them before a live drop nudges you too fast.'
  }

  return 'Both are already important enough to save, which usually means Compare is the next Decide move.'
}

export const getWatchlistCompareSuggestions = (
  items: WatchlistItem[]
): WatchCompareSuggestion[] => {
  if (items.length < 2) {
    return []
  }

  const ordered = [...items].sort(
    (left, right) => getComparablePrice(left) - getComparablePrice(right)
  )
  const suggestions: WatchCompareSuggestion[] = []

  for (let index = 0; index + 1 < ordered.length && suggestions.length < 2; index += 1) {
    const left = ordered[index]
    const right = ordered[index + 1]

    if (!left || !right) {
      continue
    }

    const alreadyUsed = suggestions.some(
      (suggestion) =>
        suggestion.left.phone_id === left.phone_id ||
        suggestion.right.phone_id === left.phone_id ||
        suggestion.left.phone_id === right.phone_id ||
        suggestion.right.phone_id === right.phone_id
    )

    if (alreadyUsed) {
      continue
    }

    suggestions.push({
      left,
      right,
      reason: buildCompareReason(left, right),
      compare_context: buildCompareContext(left, right),
      href: buildWatchCompareHref(left, right),
    })
  }

  return suggestions
}

export const getPrimaryCompareAction = (
  item: WatchlistItem,
  items: WatchlistItem[]
): WatchCompareAction | null => {
  const candidates = items.filter(
    (candidate) => candidate.phone_id !== item.phone_id
  )

  if (candidates.length === 0) {
    return null
  }

  const counterpart = [...candidates].sort((left, right) => {
    const priorityDelta =
      getComparePriority(item, right) - getComparePriority(item, left)

    if (priorityDelta !== 0) {
      return priorityDelta
    }

    return getComparablePrice(left) - getComparablePrice(right)
  })[0]

  if (!counterpart) {
    return null
  }

  return {
    counterpart,
    href: buildWatchCompareHref(item, counterpart),
    context: buildCompareContext(item, counterpart),
  }
}
