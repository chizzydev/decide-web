// decide-web/src/types/assistant.ts
// Types for the multi-step assistant decision flow.

import type { OsType, StoreType, GrayMarketRisk } from './phone'

export const SUPPORTED_BRAND_PREFERENCES = [
  'samsung',
  'tecno',
  'infinix',
  'xiaomi',
  'vivo',
  'google',
  'oneplus',
  'oppo',
  'itel',
  'realme',
  'nokia',
  'apple',
  'any',
] as const

export type BrandPreference = string

export type UsageType =
  | 'social'
  | 'gaming'
  | 'photo'
  | 'work'
  | 'student'
  | 'flex'
  | 'general'

export type RankingMode = 'best' | 'balanced' | 'value'

export type RecommendationConfidence = 'high' | 'medium' | 'low'

export type RecommendationConstraintMode =
  | 'normal'
  | 'forced_brand_low_budget'

export type RecommendationType = 'best_fit' | 'soft_fit' | 'best_available'

// The five budget tiers shown on the slider
export interface BudgetTier {
  label: string
  range: string
  max: number
  description: string
}

export interface PriorityWeights {
  battery: number
  camera: number
  performance: number
  build: number
}

// The complete set of user inputs — sent to POST /api/v1/recommend
export interface UserPreferences {
  os_type: OsType
  brand_preference: BrandPreference
  requested_brand_name?: string
  budget_max: number
  budget_min?: number
  min_ram_gb?: number
  usage_type: UsageType
  priorities: PriorityWeights
  ranking_mode?: RankingMode
  is_generic?: boolean
}

// Step names in order — used by the assistant store and StepIndicator
export type AssistantStep =
  | 'os'
  | 'brand'
  | 'budget'
  | 'usage'
  | 'priorities'
  | 'results'

// A single recommendation result returned by the API
export interface ScoredPhone {
  phone_id: number
  name: string
  slug: string
  brand_name: string
  image_url: string | null
  os_type: OsType
  lowest_price_ngn: number | null
  prices: Array<{
    store: StoreType
    price_ngn: number
    url: string | null
    in_stock: boolean
    scraped_at: string
    variant_id?: number | null
    variant_label?: string | null
    variant_ram_gb?: number | null
    variant_storage_gb?: number | null
  }>
  tags: string[]
  gray_market_risk: GrayMarketRisk
  gray_market_note: string | null
  local_support_note: string | null
  score_battery: number
  score_camera: number
  score_performance: number
  score_build: number
  score_value: number
  final_score: number
  match_percentage: number
  reasons: string[]
  tradeoffs: string[]
}

// When a specific brand was chosen but nothing fits the budget,
// the API tells us exactly what it would cost — no vague empty state.
export interface BudgetGapContext {
  brand_name: string
  cheapest_phone_name: string
  cheapest_price_ngn: number
}

export interface BrandCatalogGapContext {
  requested_brand: string
  available_brands: string[]
}

export interface RecommendationMeta {
  constraint_mode: RecommendationConstraintMode
  confidence: RecommendationConfidence
  recommendation_type: RecommendationType
}

// Full response from POST /api/v1/recommend
export interface RecommendationResult {
  recommendations: ScoredPhone[]
  preferences: UserPreferences
  budget_gap?: BudgetGapContext
  brand_catalog_gap?: BrandCatalogGapContext
  recommendation_meta: RecommendationMeta
}
