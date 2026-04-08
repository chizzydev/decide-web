// decide-web/src/types/analyzer.ts

import type { ScoredPhone } from './assistant'

export type VerdictLabel =
  | 'excellent_choice'
  | 'good_choice'
  | 'decent_but_better'
  | 'not_recommended'
  | 'avoid'

export type VerdictColour = 'green' | 'blue' | 'yellow' | 'orange' | 'red'

export interface VerdictMeta {
  label:       VerdictLabel
  headline:    string
  subheadline: string
  colour:      VerdictColour
  emoji:       string
}

export type BudgetStatus = 'within_budget' | 'above_budget' | 'no_price_data'

export type DealbreakerReason =
  | 'too_old'
  | 'old_and_risky'
  | 'triple_red_flag'
  | 'fails_usage'
  | 'no_price'

export interface PhoneVerdict {
  phone:          ScoredPhone
  verdict:        VerdictMeta
  budget_status:  BudgetStatus
  price_gap_ngn:  number | null
}

export interface AnalyzeResult {
  verdict?:     PhoneVerdict
  dealbreaker?: {
    reason:  DealbreakerReason
    message: string
  }
  alternatives: ScoredPhone[]
}

// The request body sent to POST /api/v1/analyze
export interface AnalyzeInput {
  phone_slug:  string
  budget:      number
  usage_type:  'social' | 'gaming' | 'photo' | 'work' | 'student' | 'flex'
  priorities?: {
    battery:     number
    camera:      number
    performance: number
    build:       number
  }
}