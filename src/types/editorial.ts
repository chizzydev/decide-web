export type EditorialTone = 'positive' | 'neutral' | 'warning' | 'negative'
export type PricePosition = 'near_low' | 'mid_range' | 'near_high' | 'unknown'
export type SupportOutlook = 'strong' | 'good' | 'limited' | 'expired' | 'unknown'
export type RepairSupportOutlook = 'strong' | 'fair' | 'weak' | 'unknown'
export type ResaleOutlook = 'strong' | 'fair' | 'weak' | 'unknown'

export type BuyNowWaitLabel =
  | 'buy_now'
  | 'buy_if_needed'
  | 'wait_for_better_price'
  | 'wait'
  | 'skip'

export type StillWorthItLabel =
  | 'still_worth_it'
  | 'worth_it_if_discounted'
  | 'aging_fast'
  | 'not_worth_it'

export interface EditorialPhoneSummary {
  id: number
  name: string
  slug: string
  brand_name: string
  image_url: string | null
  released_year: number | null
}

export interface EditorialVerdict<TLabel extends string> {
  label: TLabel
  headline: string
  summary: string
  tone: EditorialTone
}

export interface EditorialPriceSignal {
  current_best_price_ngn: number | null
  historical_low_price_ngn: number | null
  historical_high_price_ngn: number | null
  price_position: PricePosition
  tracked_days: number
  tracked_store_count: number
  recent_drop_count: number
  strongest_recent_drop_ngn: number | null
  strongest_recent_drop_percent: number | null
  freshest_scraped_at: string | null
  summary: string
}

export interface LongevitySignal {
  years_since_release: number | null
  estimated_years_of_support_left: number | null
  support_outlook: SupportOutlook
  summary: string
}

export interface RepairSupportSignal {
  outlook: RepairSupportOutlook
  summary: string
}

export interface ResaleValueSignal {
  outlook: ResaleOutlook
  summary: string
}

export interface BuyNowWaitResponse {
  phone: EditorialPhoneSummary
  verdict: EditorialVerdict<BuyNowWaitLabel>
  reasons: string[]
  tradeoffs: string[]
  price_signal: EditorialPriceSignal
  longevity_signal: LongevitySignal
  repair_support_signal: RepairSupportSignal
  resale_value_signal: ResaleValueSignal
  generated_at: string
}

export interface StillWorthItResponse {
  phone: EditorialPhoneSummary
  verdict: EditorialVerdict<StillWorthItLabel>
  reasons: string[]
  tradeoffs: string[]
  price_signal: EditorialPriceSignal
  longevity_signal: LongevitySignal
  repair_support_signal: RepairSupportSignal
  resale_value_signal: ResaleValueSignal
  generated_at: string
}
