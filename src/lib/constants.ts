// decide-web/src/lib/constants.ts
// Static data used across the assistant flow and UI.
// Centralised here so a label or value change happens in one place.

import type { BudgetTier, BrandPreference, UsageType } from '@/types'

// ── Budget tiers ───────────────────────────────────────────────
// The five tiers shown on the budget slider in Step 3.
// max is what gets sent to the API as budget_max.

export const BUDGET_TIERS: BudgetTier[] = [
  {
    label:       'Entry Level',
    range:       'Under ₦80k',
    max:         80000,
    description: 'Tecno Spark, Itel, Redmi A-series',
  },
  {
    label:       'Mid-Range',
    range:       '₦80k – ₦150k',
    max:         150000,
    description: 'Samsung A-series, Infinix Zero, Tecno Camon',
  },
  {
    label:       'Premium',
    range:       '₦150k – ₦300k',
    max:         300000,
    description: 'Samsung A55, iPhone 13, Redmi Note 13 Pro',
  },
  {
    label:       'High-End',
    range:       '₦300k – ₦500k',
    max:         500000,
    description: 'iPhone 14/15, Samsung S24, Google Pixel 8',
  },
  {
    label:       'Flagship',
    range:       '₦500k+',
    max:         10000000,
    description: 'iPhone 15 Pro, iPhone 16, Samsung S25 Ultra',
  },
]

// ── Android brands ─────────────────────────────────────────────
// Shown in Step 2 when the user picks Android.
// Order is deliberate — most popular in Nigeria first.

export interface BrandOption {
  slug:  BrandPreference
  label: string
}

export const ANDROID_BRANDS: BrandOption[] = [
  { slug: 'samsung',  label: 'Samsung'  },
  { slug: 'tecno',    label: 'Tecno'    },
  { slug: 'infinix',  label: 'Infinix'  },
  { slug: 'xiaomi',   label: 'Xiaomi'   },
  { slug: 'google',   label: 'Google'   },
  { slug: 'oneplus',  label: 'OnePlus'  },
  { slug: 'itel',     label: 'Itel'     },
  { slug: 'realme',   label: 'Realme'   },
]

// ── Usage types ────────────────────────────────────────────────
// Shown in Step 4 — what the user primarily uses their phone for.

export interface UsageOption {
  slug:        UsageType
  label:       string
  description: string
  icon:        string  // emoji — simple, no icon library needed at this stage
}

export const USAGE_OPTIONS: UsageOption[] = [
  {
    slug:        'social',
    label:       'Social Media',
    description: 'Instagram, TikTok, WhatsApp, Twitter',
    icon:        '📱',
  },
  {
    slug:        'gaming',
    label:       'Gaming',
    description: 'PUBG, Call of Duty, FC Mobile',
    icon:        '🎮',
  },
  {
    slug:        'photo',
    label:       'Photography',
    description: 'Camera quality is everything',
    icon:        '📸',
  },
  {
    slug:        'work',
    label:       'Work',
    description: 'Office apps, email, video calls',
    icon:        '💼',
  },
  {
    slug:        'student',
    label:       'Student',
    description: 'Everyday use on a budget',
    icon:        '🎓',
  },
  {
    slug:        'flex',
    label:       'Status',
    description: 'Looking good is non-negotiable',
    icon:        '✨',
  },
]

// ── Priority labels ────────────────────────────────────────────
// Used by the PrioritySliders component in Step 5.

export interface PriorityOption {
  key:         'battery' | 'camera' | 'performance' | 'build'
  label:       string
  description: string
  icon:        string
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    key:         'battery',
    label:       'Battery Life',
    description: 'How long it lasts on a full charge',
    icon:        '🔋',
  },
  {
    key:         'camera',
    label:       'Camera',
    description: 'Photo and video quality',
    icon:        '📷',
  },
  {
    key:         'performance',
    label:       'Performance',
    description: 'Speed, smoothness, multitasking',
    icon:        '⚡',
  },
  {
    key:         'build',
    label:       'Build Quality',
    description: 'Feel, durability, premium look',
    icon:        '🏗️',
  },
]

// ── Gray market risk labels ────────────────────────────────────
// Used by GrayMarketWarning component to render the correct badge.

export const GRAY_MARKET_LABELS: Record<string, string> = {
  low:    'Officially Available',
  medium: 'Verify Before Buying',
  high:   'Gray Market Risk',
}

export const GRAY_MARKET_COLORS: Record<string, string> = {
  low:    'success',
  medium: 'warning',
  high:   'error',
}

// ── Store display names ────────────────────────────────────────

export const STORE_LABELS: Record<string, string> = {
  jumia: 'Jumia',
  slot:  'Slot',
}

// ── Assistant step order ───────────────────────────────────────
// Used by StepIndicator to show progress and by the store
// to determine which step comes next.

export const ASSISTANT_STEPS = {
  android: ['os', 'brand', 'budget', 'usage', 'priorities'] as const,
  ios:     ['os', 'budget', 'usage', 'priorities'] as const,
}

// Total steps shown in the progress bar per OS path
export const STEP_COUNT = {
  android: 5,
  ios:     4,
}