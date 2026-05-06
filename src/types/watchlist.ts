import type {
  RepairSupportOutlook,
  ResaleOutlook,
  SupportOutlook,
} from './editorial'

export interface WatchlistAlertSignals {
  active_alert_count: number
  nearest_target_price: number | null
  nearest_alert_store: 'jumia' | 'slot' | 'jiji' | null
}

export interface WatchlistOwnershipSignals {
  support_outlook: SupportOutlook
  repair_outlook: RepairSupportOutlook
  resale_outlook: ResaleOutlook
}

export interface WatchlistFocusedVariant {
  id: number | null
  label: string | null
  ram_gb: number | null
  storage_gb: number | null
  is_default: boolean
}

export interface WatchlistItem {
  saved_entry_id: string
  saved_at: string
  phone_id: number
  phone_name: string
  phone_slug: string
  brand_name: string
  image_url: string | null
  current_best_price_ngn: number | null
  freshest_price_at: string | null
  recent_drop_amount_ngn: number | null
  recent_drop_percent: number | null
  recent_drop_store: 'jumia' | 'slot' | null
  alerts: WatchlistAlertSignals
  ownership: WatchlistOwnershipSignals
  focused_variant: WatchlistFocusedVariant | null
}

export interface WatchlistSummary {
  saved_count: number
  alert_covered_count: number
  recently_cheaper_count: number
  unprotected_count: number
}

export interface WatchlistResponse {
  generated_at: string
  summary: WatchlistSummary
  items: WatchlistItem[]
}
