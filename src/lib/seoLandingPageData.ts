import { marketApi, phonesApi } from '@/lib/api'
import { filterUserFacingPhones } from '@/lib/brandCatalog'
import {
  scoreSeoLandingPhone,
  type SeoLandingPageConfig,
} from '@/lib/seoLandingPages'
import type { PhoneCard, PriceDropRadarItem } from '@/types'

export interface SeoLandingPhoneResult {
  phone: PhoneCard
  rank: number
  score: number
  lowestPrice: number | null
  highestPrice: number | null
  freshestPriceAt: string | null
  trackedStoreLabels: string[]
  deal: PriceDropRadarItem | null
  verdict: {
    label: string
    summary: string
  }
  pros: string[]
  cons: string[]
}

export interface SeoLandingPageData {
  phones: SeoLandingPhoneResult[]
  deals: PriceDropRadarItem[]
  updatedAt: string | null
  marketGeneratedAt: string | null
}

const CANDIDATE_LIMIT = 140

const getLowestCurrentPrice = (phone: PhoneCard) => {
  const prices = phone.prices
    .filter((price) => price.in_stock && price.price_ngn > 0)
    .map((price) => price.price_ngn)

  return prices.length > 0 ? Math.min(...prices) : null
}

const getHighestCurrentPrice = (phone: PhoneCard) => {
  const prices = phone.prices
    .filter((price) => price.in_stock && price.price_ngn > 0)
    .map((price) => price.price_ngn)

  return prices.length > 0 ? Math.max(...prices) : null
}

const getFreshestPriceAt = (phone: PhoneCard) => {
  const timestamps = phone.prices
    .map((price) => new Date(price.scraped_at).getTime())
    .filter((timestamp) => Number.isFinite(timestamp))

  if (timestamps.length === 0) return null

  return new Date(Math.max(...timestamps)).toISOString()
}

const getTrackedStoreLabels = (phone: PhoneCard) =>
  Array.from(
    new Set(
      phone.prices
        .filter((price) => price.price_ngn > 0)
        .map((price) => (price.store === 'jumia' ? 'Jumia' : 'Slot'))
    )
  )

const hasStorePrice = (phone: PhoneCard, store: 'jumia' | 'slot') =>
  phone.prices.some(
    (price) => price.store === store && price.in_stock && price.price_ngn > 0
  )

const hasAnyTrustedStorePrice = (phone: PhoneCard) =>
  phone.prices.some((price) => price.in_stock && price.price_ngn > 0)

const normalizeSearchText = (value: string | null | undefined) =>
  (value ?? '').toLowerCase().trim()

const matchesBrandIntent = (phone: PhoneCard, config: SeoLandingPageConfig) => {
  const brandNames = config.brandNames ?? []
  const modelKeywords = config.modelKeywords ?? []

  if (brandNames.length === 0 && modelKeywords.length === 0) return true

  const brand = normalizeSearchText(phone.brand_name)
  const name = normalizeSearchText(phone.name)

  const brandMatched = brandNames.some((item) => brand.includes(item.toLowerCase()))
  const modelMatched = modelKeywords.some((item) => name.includes(item.toLowerCase()))

  return brandMatched || modelMatched
}

const getDealMap = (deals: PriceDropRadarItem[]) => {
  const map = new Map<string, PriceDropRadarItem>()

  for (const deal of deals) {
    const existing = map.get(deal.phone_slug)
    if (!existing || deal.change_amount_ngn > existing.change_amount_ngn) {
      map.set(deal.phone_slug, deal)
    }
  }

  return map
}

const hasPriceInBudget = (phone: PhoneCard, config: SeoLandingPageConfig) => {
  if (!config.maxPrice && !config.minPrice) return true

  const lowestPrice = getLowestCurrentPrice(phone)
  if (lowestPrice == null) return false

  if (config.maxPrice && lowestPrice > config.maxPrice) return false
  if (config.minPrice && lowestPrice < config.minPrice) return false

  return true
}

const matchesPageKind = (phone: PhoneCard, config: SeoLandingPageConfig) => {
  if (!matchesBrandIntent(phone, config)) {
    return false
  }

  if (config.store && !hasStorePrice(phone, config.store)) {
    return false
  }

  if (config.kind === 'store-comparison') {
    return hasStorePrice(phone, 'jumia') && hasStorePrice(phone, 'slot')
  }

  if (config.kind === 'jiji') {
    return (phone.marketplace_signal_count ?? 0) > 0 || !hasAnyTrustedStorePrice(phone)
  }

  if (config.kind === 'used') {
    return (
      (phone.marketplace_signal_count ?? 0) > 0 ||
      phone.gray_market_risk !== 'low' ||
      (phone.released_year != null && new Date().getFullYear() - phone.released_year >= 2)
    )
  }

  if (config.kind === 'gaming') {
    return (
      phone.score_performance >= 55 ||
      phone.refresh_rate_hz != null ||
      (phone.ram_gb ?? 0) >= 6 ||
      phone.tags.some((tag) => /gaming|performance|power/i.test(tag))
    )
  }

  if (config.kind === 'camera') {
    return (
      phone.score_camera >= 55 ||
      (phone.main_camera_mp ?? 0) >= 48 ||
      phone.tags.some((tag) => /camera|content|photo|video/i.test(tag))
    )
  }

  if (config.kind === 'battery') {
    return (
      phone.score_battery >= 55 ||
      (phone.battery_mah ?? 0) >= 5000 ||
      phone.tags.some((tag) => /battery|power/i.test(tag))
    )
  }

  if (config.kind === 'fast-charging') {
    return (
      (phone.charging_speed_w ?? 0) >= 25 ||
      phone.score_battery >= 60 ||
      phone.tags.some((tag) => /fast.?charg|charging|battery|power/i.test(tag))
    )
  }

  if (config.kind === 'student') {
    return (
      phone.score_value >= 55 ||
      phone.score_battery >= 55 ||
      (phone.storage_gb ?? 0) >= 64 ||
      phone.tags.some((tag) => /student|school|budget|value|battery/i.test(tag))
    )
  }

  if (config.kind === 'content') {
    return (
      phone.score_camera >= 55 ||
      (phone.main_camera_mp ?? 0) >= 48 ||
      (phone.storage_gb ?? 0) >= 128 ||
      phone.tags.some((tag) => /content|creator|camera|photo|video|selfie|tiktok|social/i.test(tag))
    )
  }

  return true
}

const buildVerdict = (
  config: SeoLandingPageConfig,
  phone: PhoneCard,
  deal: PriceDropRadarItem | null,
  lowestPrice: number | null
) => {
  if (config.kind === 'jiji' || config.kind === 'used') {
    return {
      label: 'Inspect first',
      summary:
        'Use this as used-market context only. Inspect the exact device, seller, IMEI, battery, screen, cameras, charging, and proof of ownership before paying.',
    }
  }

  if (config.store) {
    return {
      label: 'Verify listing',
      summary:
        'This phone has a tracked store signal for this page. Recheck the exact variant, seller, stock, warranty, and final external price before paying.',
    }
  }

  if (config.kind === 'buyer-safety') {
    return {
      label: 'Check before paying',
      summary:
        'Use Decide to compare the phone and buying route before leaving for a store or marketplace. Safety depends on verification, not the platform name alone.',
    }
  }

  if (deal) {
    return {
      label: 'Check the drop',
      summary:
        'This phone has a current tracked price-drop signal. Open the detail or buy-or-wait page before acting on the external listing.',
    }
  }

  if (phone.score_value >= 80 && lowestPrice != null) {
    return {
      label: 'Strong shortlist',
      summary:
        'This looks like a strong value candidate in the current Decide data, but the final call still depends on your priorities and store verification.',
    }
  }

  if (lowestPrice == null) {
    return {
      label: 'Watch first',
      summary:
        'Decide does not have a current trusted-store price for this phone yet, so treat it as a research candidate rather than a buy-now lead.',
    }
  }

  return {
    label: 'Compare first',
    summary:
      'This phone is worth comparing against nearby alternatives before you leave Decide for a store or marketplace.',
  }
}

const buildPros = (
  config: SeoLandingPageConfig,
  phone: PhoneCard,
  deal: PriceDropRadarItem | null
) => {
  const pros: string[] = []

  if (config.store && hasStorePrice(phone, config.store)) {
    pros.push(`Tracked ${config.store === 'jumia' ? 'Jumia' : 'Slot'} price signal`)
  }
  if ((config.kind === 'jiji' || config.kind === 'used') && (phone.marketplace_signal_count ?? 0) > 0) {
    pros.push('Jiji marketplace context available')
  }
  if (phone.score_value >= 75) pros.push('Strong Decide value score')
  if (phone.score_battery >= 75 || (phone.battery_mah ?? 0) >= 5000) {
    pros.push('Battery looks suitable for heavy daily use')
  }
  if ((phone.charging_speed_w ?? 0) >= 25) {
    pros.push(`${phone.charging_speed_w}W charging speed signal`)
  }
  if (phone.score_camera >= 75 || (phone.main_camera_mp ?? 0) >= 50) {
    pros.push('Camera score/specs are competitive in this lane')
  }
  if (phone.score_performance >= 75 || (phone.ram_gb ?? 0) >= 8) {
    pros.push('Performance profile is strong enough for demanding use')
  }
  if (phone.has_5g) pros.push('5G support adds longer-term network headroom')
  if (deal) pros.push('Current tracked price-drop signal')

  return pros.length > 0 ? pros.slice(0, 3) : ['Balanced candidate for this search intent']
}

const buildCons = (
  config: SeoLandingPageConfig,
  phone: PhoneCard,
  lowestPrice: number | null
) => {
  const cons: string[] = []

  if (config.kind === 'jiji' || config.kind === 'used') {
    cons.push('Marketplace prices are leads, not trusted retail prices')
  }
  if (lowestPrice == null) cons.push('No current trusted-store price in Decide yet')
  if (phone.gray_market_risk !== 'low') cons.push('Verify seller and unit carefully before paying')
  if ((phone.ram_gb ?? 0) > 0 && (phone.ram_gb ?? 0) < 4) {
    cons.push('RAM may feel tight for heavier multitasking')
  }
  if ((phone.security_updates_years ?? 0) > 0 && (phone.security_updates_years ?? 0) < 3) {
    cons.push('Software/security runway may be shorter than stronger alternatives')
  }

  return cons.length > 0 ? cons.slice(0, 3) : ['Still compare freshness, variant, and seller before buying']
}

const getUpdatedAt = (
  phones: SeoLandingPhoneResult[],
  marketGeneratedAt: string | null
) => {
  const timestamps = [
    ...phones
      .map((item) => item.freshestPriceAt)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime()),
    ...(marketGeneratedAt ? [new Date(marketGeneratedAt).getTime()] : []),
  ].filter((timestamp) => Number.isFinite(timestamp))

  if (timestamps.length === 0) return null

  return new Date(Math.max(...timestamps)).toISOString()
}

export const getSeoLandingPageData = async (
  config: SeoLandingPageConfig
): Promise<SeoLandingPageData> => {
  const [phonesResult, radarResult] = await Promise.allSettled([
    phonesApi.getAll({
      max_price: config.maxPrice,
      min_price: config.minPrice,
      limit: CANDIDATE_LIMIT,
    }),
    marketApi.getPriceDropRadar({
      max_price: config.maxPrice,
      limit: 60,
      min_drop_ngn: config.kind === 'deal-radar' ? 3000 : 5000,
    }),
  ])

  const phones =
    phonesResult.status === 'fulfilled'
      ? filterUserFacingPhones(phonesResult.value)
      : []
  const radar = radarResult.status === 'fulfilled' ? radarResult.value : null
  const deals = radar?.deals ?? []
  const dealMap = getDealMap(deals)

  const rankedPhones = phones
    .filter((phone) => hasPriceInBudget(phone, config))
    .filter((phone) => matchesPageKind(phone, config))
    .map((phone) => {
      const deal = dealMap.get(phone.slug) ?? null
      const lowestPrice = getLowestCurrentPrice(phone)
      const storeBoost = config.store && hasStorePrice(phone, config.store) ? 45 : 0
      const storeComparisonBoost =
        config.kind === 'store-comparison' && hasStorePrice(phone, 'jumia') && hasStorePrice(phone, 'slot')
          ? 50
          : 0
      const brandBoost =
        (config.brandNames?.length || config.modelKeywords?.length) && matchesBrandIntent(phone, config)
          ? 40
          : 0
      const marketplaceBoost =
        (config.kind === 'jiji' || config.kind === 'used') && (phone.marketplace_signal_count ?? 0) > 0
          ? 35
          : 0
      const safetyBoost = config.kind === 'buyer-safety' && phone.gray_market_risk !== 'low' ? 12 : 0
      const chargingBoost =
        config.kind === 'fast-charging' && (phone.charging_speed_w ?? 0) >= 25
          ? Math.min(35, phone.charging_speed_w ?? 0)
          : 0
      const studentBoost =
        config.kind === 'student' && (phone.storage_gb ?? 0) >= 128 && phone.score_battery >= 60
          ? 18
          : 0
      const contentBoost =
        config.kind === 'content' && (phone.storage_gb ?? 0) >= 128 && phone.score_camera >= 60
          ? 20
          : 0
      const score =
        scoreSeoLandingPhone(config, phone, deal) +
        storeBoost +
        storeComparisonBoost +
        brandBoost +
        marketplaceBoost +
        safetyBoost +
        chargingBoost +
        studentBoost +
        contentBoost

      return {
        phone,
        rank: 0,
        score,
        lowestPrice,
        highestPrice: getHighestCurrentPrice(phone),
        freshestPriceAt: getFreshestPriceAt(phone),
        trackedStoreLabels: getTrackedStoreLabels(phone),
        deal,
        verdict: buildVerdict(config, phone, deal, lowestPrice),
        pros: buildPros(config, phone, deal),
        cons: buildCons(config, phone, lowestPrice),
      }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, config.pageSize)
    .map((item, index) => ({ ...item, rank: index + 1 }))

  return {
    phones: rankedPhones,
    deals,
    updatedAt: getUpdatedAt(rankedPhones, radar?.generated_at ?? null),
    marketGeneratedAt: radar?.generated_at ?? null,
  }
}
