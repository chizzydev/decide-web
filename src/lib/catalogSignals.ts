import type {
  CatalogDiscoverySignal,
  PhoneCard,
  PriceDropRadarItem,
} from '@/types'
import { getPriceFreshnessStatus, type PriceFreshnessStatus } from '@/lib/priceFreshness'

const CURRENT_YEAR = new Date().getFullYear()

const chooseBestDeal = (
  current: PriceDropRadarItem | undefined,
  candidate: PriceDropRadarItem
) => {
  if (!current) {
    return candidate
  }

  if (candidate.change_amount_ngn !== current.change_amount_ngn) {
    return candidate.change_amount_ngn > current.change_amount_ngn
      ? candidate
      : current
  }

  return new Date(candidate.scraped_at).getTime() >
    new Date(current.scraped_at).getTime()
    ? candidate
    : current
}

const getFreshestTrackedPriceStatus = (
  phone: PhoneCard
): PriceFreshnessStatus | null => {
  const pricedRows = (phone.prices ?? []).filter((price) => price.price_ngn > 0)
  if (pricedRows.length === 0) {
    return null
  }

  const freshest = pricedRows.reduce((current, candidate) =>
    new Date(candidate.scraped_at).getTime() > new Date(current.scraped_at).getTime()
      ? candidate
      : current
  )

  return getPriceFreshnessStatus(freshest.scraped_at)
}

const buildVerdictSignal = (phone: PhoneCard): CatalogDiscoverySignal['verdict'] => {
  const age =
    phone.released_year != null ? CURRENT_YEAR - phone.released_year : null
  const supportLooksShort =
    phone.android_updates_years != null && phone.android_updates_years <= 2
  const freshestPriceStatus = getFreshestTrackedPriceStatus(phone)
  const hasTrackedPrice = freshestPriceStatus !== null
  const hasFreshTrackedPrice = freshestPriceStatus === 'fresh'
  const hasUsableTrackedPrice =
    freshestPriceStatus === 'fresh' || freshestPriceStatus === 'aging'

  if (phone.gray_market_risk === 'high') {
    return {
      label: 'Verify first',
      summary:
        'This can still make sense, but the unit and the seller matter more than usual here.',
      tone: 'warning',
      href: `/buy-now-or-wait/${phone.slug}`,
      link_label: 'Read buy/wait verdict',
    }
  }

  if (
    phone.score_value >= 8 &&
    phone.local_support_quality !== 'poor' &&
    (age == null || age <= 2)
  ) {
    return {
      label: 'Strong value',
      summary:
        'Easy to shortlist. It gets a lot right for the money without too many obvious trade-offs.',
      tone: 'positive',
      href: `/buy-now-or-wait/${phone.slug}`,
      link_label: 'Read buy/wait verdict',
    }
  }

  if ((age != null && age >= 4) || supportLooksShort) {
    return {
      label: 'Aging buy',
      summary:
        'Still usable, but age and software support matter more here than they used to.',
      tone: 'warning',
      href: `/worth-it/${phone.slug}`,
      link_label: 'Read still-worth-it verdict',
    }
  }

  if (phone.score_value >= 7) {
    return {
      label: 'Worth a look',
      summary:
        hasFreshTrackedPrice
          ? 'Good option overall. The tracked price is current, but timing and support are still worth checking before you buy.'
        : hasUsableTrackedPrice
            ? 'Good option overall. The tracked price is getting old, so check the latest store price before you buy.'
            : 'Good option overall, but wait for a current tracked price before treating it as an easy buy.',
      tone: 'neutral',
      href: `/buy-now-or-wait/${phone.slug}`,
      link_label: 'Read buy/wait verdict',
    }
  }

  return {
    label: 'Mixed value',
    summary:
      hasFreshTrackedPrice
        ? 'Not a bad phone, but the current price still does not make it an obvious pick.'
        : hasTrackedPrice
          ? 'Not a bad phone, but the tracked price is not fresh enough yet to make the value case clear.'
          : 'Not a bad phone, but without a current tracked price it is hard to call it a smart buy.',
    tone: 'neutral',
    href: `/buy-now-or-wait/${phone.slug}`,
    link_label: 'Read buy/wait verdict',
  }
}

export const buildCatalogSignals = (
  phones: PhoneCard[],
  deals: PriceDropRadarItem[]
): Record<string, CatalogDiscoverySignal> => {
  const dealsBySlug = new Map<string, PriceDropRadarItem>()

  deals.forEach((deal) => {
    const existing = dealsBySlug.get(deal.phone_slug)
    dealsBySlug.set(deal.phone_slug, chooseBestDeal(existing, deal))
  })

  return phones.reduce<Record<string, CatalogDiscoverySignal>>((acc, phone) => {
    const bestDeal = dealsBySlug.get(phone.slug)

    acc[phone.slug] = {
      verdict: buildVerdictSignal(phone),
      price_drop: bestDeal
        ? {
            amount_ngn: bestDeal.change_amount_ngn,
            percent: bestDeal.change_percent,
            store: bestDeal.store,
            href: '/deals/today',
          }
        : undefined,
    }

    return acc
  }, {})
}
