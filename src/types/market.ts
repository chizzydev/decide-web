import type { OsType } from './phone'
import type { MarketplaceOffer } from './phone'
import type {
  LongevitySignal,
  RepairSupportSignal,
  ResaleValueSignal,
} from './editorial'

export type MarketStore = 'jumia' | 'slot'

export interface PriceHistoryPoint {
  price_ngn: number
  in_stock: boolean
  scraped_at: string
}

export interface StorePriceHistorySeries {
  store: MarketStore
  current_price_ngn: number | null
  previous_price_ngn: number | null
  change_amount_ngn: number | null
  change_percent: number | null
  freshest_scraped_at: string | null
  points: PriceHistoryPoint[]
}

export interface PhonePriceHistoryVariantOption {
  id: number
  label: string
  is_default: boolean
  tracked_store_count: number
  current_best_price_ngn: number | null
}

export interface PhonePriceHistorySummary {
  lowest_current_price_ngn: number | null
  highest_current_price_ngn: number | null
  tracked_store_count: number
  freshest_scraped_at: string | null
}

export interface PhonePriceHistoryResponse {
  phone_id: number
  phone_name: string
  phone_slug: string
  brand_name: string
  image_url: string | null
  days: number
  selected_variant_id: number | null
  selected_variant_label: string | null
  available_variants: PhonePriceHistoryVariantOption[]
  series: StorePriceHistorySeries[]
  summary: PhonePriceHistorySummary
}

export interface PriceHistoryQuery {
  days?: number
  store?: MarketStore
  variant_id?: number
}

export interface PriceDropRadarFilters {
  limit?: number
  os_type?: OsType
  brand_slug?: string
  max_price?: number
  min_drop_ngn?: number
}

export interface PriceDropRadarItem {
  phone_id: number
  phone_name: string
  phone_slug: string
  brand_name: string
  image_url: string | null
  variant_id: number | null
  variant_label: string | null
  variant_ram_gb: number | null
  variant_storage_gb: number | null
  store: MarketStore
  current_price_ngn: number
  previous_price_ngn: number
  change_amount_ngn: number
  change_percent: number | null
  url: string | null
  in_stock: boolean
  scraped_at: string
  previous_scraped_at: string | null
  ownership: {
    longevity_signal: LongevitySignal
    repair_support_signal: RepairSupportSignal
    resale_value_signal: ResaleValueSignal
  } | null
}

export interface PriceDropRadarResponse {
  filters: {
    limit: number
    os_type?: OsType
    brand_slug?: string
    max_price?: number
    min_drop_ngn?: number
  }
  generated_at: string
  deals: PriceDropRadarItem[]
}

export interface MarketplaceLeadItem extends MarketplaceOffer {
  phone_name: string
  phone_slug: string
  brand_name: string
  os_type: OsType
  image_url: string | null
  variant_label: string | null
  variant_ram_gb: number | null
  variant_storage_gb: number | null
  trusted_price_ngn: number | null
}

export interface MarketplaceLeadsResponse {
  source: 'jiji'
  generated_at: string
  count: number
  summary: {
    strong_leads: number
    fair_leads: number
    high_risk_leads: number
  }
  offers: MarketplaceLeadItem[]
  note: string
  safety_note: string
}
