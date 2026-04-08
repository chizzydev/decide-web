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
  target_price: number
  store?: 'jumia' | 'slot'
}

// Shape returned by authenticated alert endpoints
export interface PriceAlert {
  id: number
  phone_id: number
  phone_name: string
  email: string
  target_price: number
  store: 'jumia' | 'slot' | null
  is_active: boolean
  triggered_at: string | null
  created_at: string
}

// POST body for POST /compare
export interface CompareBody {
  slug_a: string
  slug_b: string
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

// Full response from POST /compare
export interface CompareResult {
  phone_a: import('./phone').PhoneDetail
  phone_b: import('./phone').PhoneDetail
  rows: CompareRow[]
  overall_winner: string | null
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
  target?: 'phone_a' | 'phone_b'
  candidates: AgentAmbiguousCandidate[]
}

export type AgentResponseData = AgentSuccessData | AgentAmbiguousData

export type AgentResponse = ApiResponse<AgentResponseData>
