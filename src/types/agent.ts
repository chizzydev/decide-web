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

export interface AmbiguousCandidate {
  id: number
  name: string
  slug: string
  brand_name: string
}

export interface AgentSuccessResponse {
  success: true
  message: string
  data: {
    mode: Exclude<AgentMode, 'ambiguous'>
    presentation?: AgentPresentation
    text?: string
    debug?: unknown
  }
}

export interface AgentAmbiguousResponse {
  success: false
  message: string
  data: {
    mode: 'ambiguous'
    query: string
    target?: 'phone_a' | 'phone_b'
    candidates: AmbiguousCandidate[]
  }
}

export interface AgentErrorResponse {
  success: false
  message: string
  data: null
}

export type AgentResponse =
  | AgentSuccessResponse
  | AgentAmbiguousResponse
  | AgentErrorResponse