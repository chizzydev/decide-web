// decide-web/src/types/api.ts
// Shapes for API request and response wrappers.
// Every response from decide-api follows the ApiResponse shape.

// The standard envelope every backend endpoint returns
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

// Validation error shape returned on 400 responses
export interface ApiValidationError {
  success: false
  message: 'Validation failed'
  errors: Record<string, string>
  data: null
}

// Used by hooks to represent the state of any async data fetch
export interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

// POST body for creating a price alert
export interface CreateAlertBody {
  phone_id: number
  variant_id?: number
  target_price: number
  store?: 'jumia' | 'slot' | 'jiji'
  nearby_deals_enabled?: boolean
  marketplace_alerts_enabled?: boolean
  max_above_target_percent?: number
}

// Shape returned by authenticated alert endpoints
export interface PriceAlert {
  id: number
  phone_id: number
  phone_name: string
  phone_slug: string
  variant_id: number | null
  variant_label: string | null
  variant_ram_gb: number | null
  variant_storage_gb: number | null
  email: string
  target_price: number
  store: 'jumia' | 'slot' | 'jiji' | null
  nearby_deals_enabled: boolean
  marketplace_alerts_enabled: boolean
  max_above_target_percent: number
  is_active: boolean
  triggered_at: string | null
  created_at: string
  current_price_ngn: number | null
  current_price_fresh_at: string | null
}

export interface AlertEntitlement {
  plan: 'free' | 'premium'
  label: string
  max_active_alerts: number
  max_creations_per_24h: number
  min_seconds_between_creations: number
  marketplace_alerts_enabled: boolean
  smart_nearby_alerts_enabled: boolean
  max_smart_notifications_per_alert_per_week: number
  default_max_above_target_percent: number
}

// POST body for POST /compare
export interface CompareBody {
  slug_a: string
  slug_b: string
  left_variant_id?: number
  right_variant_id?: number
  priorities?: {
    battery: number
    camera: number
    performance: number
    build: number
  }
}

// A single row in the comparison table
export interface CompareRow {
  label: string
  phone_a_value: string | number | boolean | null
  phone_b_value: string | number | boolean | null
  winner: string | null
  is_priority_row: boolean
}

export interface CompareSummary {
  headline: string
  subheadline: string
  strengths_a: string[]
  strengths_b: string[]
}

export interface CompareDecisionContext {
  mode: 'clear' | 'close' | 'cross_os_context'
  is_cross_os: boolean
  overall_winner: string | null
  score_a: number
  score_b: number
  row_score_a: number
  row_score_b: number
  category_wins_a: string[]
  category_wins_b: string[]
  note: string | null
}

export interface CompareOwnershipLayer {
  longevity_signal: import('./editorial').LongevitySignal
  repair_support_signal: import('./editorial').RepairSupportSignal
  resale_value_signal: import('./editorial').ResaleValueSignal
}

export interface CompareFocusedVariant {
  id: number | null
  label: string | null
  ram_gb: number | null
  storage_gb: number | null
  is_default: boolean
  prices: import('./phone').CurrentPrice[]
}

// Full response from POST /compare
export interface CompareResult {
  phone_a: import('./phone').PhoneDetail
  phone_b: import('./phone').PhoneDetail
  rows: CompareRow[]
  overall_winner: string | null
  decision_context: CompareDecisionContext
  summary: CompareSummary
  ownership: {
    phone_a: CompareOwnershipLayer
    phone_b: CompareOwnershipLayer
  }
  focused_variants: {
    phone_a: CompareFocusedVariant
    phone_b: CompareFocusedVariant
  }
}

// ── Agent / AI Assistant ──────────────────────────────────────

export type AgentMode =
  | 'recommend'
  | 'analyze'
  | 'compare'
  | 'lookup'
  | 'price'
  | 'ambiguous'

export interface AgentPresentationAction {
  type:
    | 'view_phone'
    | 'compare_phone'
    | 'view_alternatives'
    | 'analyze_phone'
    | 'check_price'
  label: string
  payload?: Record<string, string | number | boolean | null | string[]>
}

export interface AgentPresentationPhoneItem {
  name: string
  slug: string
  price_ngn: number | null
  image_url: string | null
  match_percentage?: number
  reason?: string
  tag?: string
}

export interface AgentPresentationVerdict {
  label: string
  headline: string
  subheadline: string
  tone: 'positive' | 'neutral' | 'warning' | 'negative'
}

export interface AgentPresentationBudget {
  status: 'within_budget' | 'above_budget' | 'no_price_data' | 'no_budget'
  amount_ngn: number | null
  message: string
}

export interface AgentPresentationComparisonRow {
  label: string
  phone_a_value: string | number | boolean | null
  phone_b_value: string | number | boolean | null
  winner: 'a' | 'b' | 'tie' | null
  is_priority_row: boolean
}

export interface AgentPresentationComparisonSubject {
  name: string
  slug: string
  variant_label: string | null
}

export interface AgentPresentation {
  mode: 'recommend' | 'analyze' | 'compare' | 'lookup'
  title: string
  summary: string
  breakdown?: string
  verdict?: AgentPresentationVerdict
  budget?: AgentPresentationBudget
  reasons: string[]
  tradeoffs: string[]
  primary_phone?: AgentPresentationPhoneItem
  alternatives: AgentPresentationPhoneItem[]
  comparison_subjects?: {
    phone_a: AgentPresentationComparisonSubject
    phone_b: AgentPresentationComparisonSubject
  }
  comparison_rows?: AgentPresentationComparisonRow[]
  actions: AgentPresentationAction[]
}

export interface AgentAmbiguousCandidate {
  id: number
  name: string
  slug: string
  brand_name: string
}

export interface AgentSuccessData {
  mode: Exclude<AgentMode, 'ambiguous'>
  presentation?: AgentPresentation
  text?: string
  debug?: unknown
}

export interface AgentAmbiguousData {
  mode: 'ambiguous'
  query: string
  source_mode?: 'lookup' | 'analyze' | 'price' | 'compare'
  target?: 'phone_a' | 'phone_b'
  phone_a?: string
  phone_b?: string
  candidates: AgentAmbiguousCandidate[]
}

export type AgentResponseData = AgentSuccessData | AgentAmbiguousData

export type AgentResponse = ApiResponse<AgentResponseData>
