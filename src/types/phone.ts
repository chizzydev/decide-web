// decide-web/src/types/phone.ts
// Phone and brand types shaped for frontend consumption.
// These mirror the backend response shapes — not the database schema directly.

export type OsType = 'android' | 'ios'
export type StoreType = 'jumia' | 'slot'
export type GrayMarketRisk = 'low' | 'medium' | 'high'
export type LocalSupportQuality = 'good' | 'fair' | 'poor'
export type MarketplaceDealQuality =
  | 'strong_lead'
  | 'fair_lead'
  | 'context_only'
  | 'risky'
export type MarketplaceRiskLevel = 'low' | 'medium' | 'high'

export interface Brand {
  id: number
  name: string
  slug: string
  os_type: OsType
  logo_url: string | null
  is_active: boolean
}

export interface CurrentPrice {
  store: StoreType
  price_ngn: number
  url: string | null
  in_stock: boolean
  scraped_at: string // ISO string from JSON — not Date object
  variant_id?: number | null
  variant_label?: string | null
  variant_ram_gb?: number | null
  variant_storage_gb?: number | null
}

export interface PhoneVariant {
  id: number
  phone_id: number
  label: string
  ram_gb: number | null
  storage_gb: number | null
  is_default: boolean
  is_active: boolean
  prices: CurrentPrice[]
}

export interface MarketplaceOffer {
  id: number
  phone_id: number
  variant_id: number | null
  source: 'jiji'
  listing_title: string
  price_ngn: number
  url: string
  location: string | null
  condition_label: string | null
  seller_type: string | null
  confidence_score: number
  trust_label: 'marketplace' | string
  is_active: boolean
  scraped_at: string
  previous_price_ngn: number | null
  previous_scraped_at: string | null
  deal_quality: MarketplaceDealQuality
  risk_level: MarketplaceRiskLevel
  reason_labels: string[]
  safe_buying_steps: string[]
  buyer_note: string
}

export interface PhoneMarketplaceOffersResponse {
  phone_id: number
  phone_name: string
  source: 'jiji'
  count: number
  offers: MarketplaceOffer[]
  note: string
  safety_note: string
}

// Lean compare-tray shape.
// The compare tray only needs enough data to render slots and build compare URLs.
// Full phone data is fetched on the compare page via slug_a + slug_b.
export interface ComparePhone {
  id: number
  slug: string
  name: string
  image_url: string | null
  brand_name: string
  os_type: OsType
  variant_id?: number | null
  variant_label?: string | null
}

// Shape returned by GET /phones and GET /phones/:slug list views
export interface PhoneCard {
  id: number
  name: string
  slug: string
  os_type: OsType
  brand_name: string
  brand_logo_url: string | null
  image_url: string | null
  updated_at: string
  display_size_inches: number | null
  display_type: string | null
  refresh_rate_hz: number | null
  ram_gb: number | null
  storage_gb: number | null
  battery_mah: number | null
  main_camera_mp: number | null
  has_5g: boolean
  has_nfc: boolean
  local_support_quality: LocalSupportQuality | null
  android_updates_years: number | null
  security_updates_years: number | null
  score_battery: number
  score_camera: number
  score_performance: number
  score_build: number
  score_value: number
  gray_market_risk: GrayMarketRisk
  is_featured: boolean
  released_year: number | null
  tags: string[]
  prices: CurrentPrice[]
  marketplace_signal_count?: number
  average_rating: number
  review_count: number
}

// Full detail shape returned by GET /phones/:slug
export interface PhoneDetail extends PhoneCard {
  chipset: string | null
  cpu_description: string | null
  gpu: string | null
  cpu_cores: number | null
  storage_gb: number | null
  has_expandable_storage: boolean
  camera_setup: string | null
  selfie_camera_mp: number | null
  has_4k_video: boolean
  charging_speed_w: number | null
  has_wireless_charging: boolean
  build_material: string | null
  weight_grams: number | null
  has_ip_rating: boolean
  ip_rating: string | null
  has_dual_sim: boolean
  os_version: string | null
  android_updates_years: number | null
  security_updates_years: number | null
  display_resolution: string | null
  gray_market_note: string | null
  local_support_quality: LocalSupportQuality | null
  local_support_note: string | null
  variants?: PhoneVariant[]
}

// Query params accepted by the phone list endpoint
export interface PhoneFilters {
  os_type?: OsType
  brand_slug?: string
  min_price?: number
  max_price?: number
  search?: string
  is_featured?: boolean
  limit?: number
  offset?: number
}
