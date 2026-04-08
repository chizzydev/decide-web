// decide-web/src/components/assistant/StepBudget.tsx
//
// Step 3 (Android) / Step 2 (iOS) of the assistant flow.
//
// Three budget input modes — all coexist, last-touched wins:
//   1. Tier buttons  — quick shortcuts (Entry / Mid / Premium / High-End / Flagship)
//   2. Exact amount  — "I want to spend exactly ₦87,000"
//   3. Range         — "At least ₦80,000 and up to ₦150,000"
//                      (prevents recommending a ₦90k phone to someone with ₦150–250k)
//
// Sends budget_max (required) and budget_min (optional) to the store.
// Backend already accepts budget_min via phoneQueries.findForRecommendation.

'use client'

import React, { useState, useCallback } from 'react'
import { useAssistant } from '@/hooks/useAssistant'
import { useAssistantStore } from '@/store/assistantStore'
import { Button } from '@/components/ui'
import { formatNaira } from '@/lib/formatters'

// ── Budget tier definitions ────────────────────────────────────────────────────

interface BudgetTier {
  label:       string
  sublabel:    string
  budget_max:  number
  budget_min?: number
}

const BUDGET_TIERS: BudgetTier[] = [
  {
    label:      'Entry',
    sublabel:   'Under ₦80k',
    budget_max: 80_000,
  },
  {
    label:      'Mid',
    sublabel:   '₦80k – ₦150k',
    budget_max: 150_000,
    budget_min: 80_000,
  },
  {
    label:      'Premium',
    sublabel:   '₦150k – ₦300k',
    budget_max: 300_000,
    budget_min: 150_000,
  },
  {
    label:      'High-End',
    sublabel:   '₦300k – ₦500k',
    budget_max: 500_000,
    budget_min: 300_000,
  },
  {
    label:      'Flagship',
    sublabel:   '₦500k+',
    budget_max: 2_000_000,
    budget_min: 500_000,
  },
]

// ── Naira input parsing / formatting ─────────────────────────────────────────
// Allows user to type "87000" or "87,000" or "₦87,000" — all parse to 87000.

const parseNairaInput = (raw: string): number | null => {
  const stripped = raw.replace(/[₦,\s]/g, '')
  if (!stripped) return null
  const parsed = parseInt(stripped, 10)
  return isNaN(parsed) ? null : parsed
}

const formatInputDisplay = (value: string): string => {
  // Strip non-numeric, reformat with commas for display
  const digits = value.replace(/[₦,\s]/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10)
  if (isNaN(num)) return digits
  return num.toLocaleString('en-NG')
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const NairaInput = ({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label:       string
  placeholder: string
  value:       string
  onChange:    (val: string) => void
  hint?:       string
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-muted select-none">
        ₦
      </span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full pl-7 pr-3 py-2.5 rounded-lg border text-sm font-medium
          border-border bg-surface text-text-primary
          placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent
          transition-colors
        `}
      />
    </div>
    {hint && (
      <p className="text-xs text-text-muted">{hint}</p>
    )}
  </div>
)

// ── Main component ─────────────────────────────────────────────────────────────

type InputMode = 'tier' | 'exact' | 'range'

export const StepBudget = () => {
  const { selectBudget, os_type } = useAssistant()
  // budget_min isn't in the hook yet — write directly to the store.
  // selectBudget(max) sets budget_max AND advances the step, so we
  // must set budget_min on the store BEFORE calling selectBudget.
  const setBudgetMin = useAssistantStore((s) => s.setBudgetMin)

  // ── Local state ────────────────────────────────────────────────────────────
  const [selectedTier,   setSelectedTier]   = useState<number | null>(null)   // index into BUDGET_TIERS
  const [inputMode,      setInputMode]      = useState<InputMode>('tier')
  const [exactRaw,       setExactRaw]       = useState('')
  const [rangeMinRaw,    setRangeMinRaw]    = useState('')
  const [rangeMaxRaw,    setRangeMaxRaw]    = useState('')
  const [validationMsg,  setValidationMsg]  = useState<string | null>(null)

  // ── Derived values ─────────────────────────────────────────────────────────
  const exactAmount  = parseNairaInput(exactRaw)
  const rangeMin     = parseNairaInput(rangeMinRaw)
  const rangeMax     = parseNairaInput(rangeMaxRaw)

  const canContinue = (() => {
    if (inputMode === 'tier')  return selectedTier !== null
    if (inputMode === 'exact') return exactAmount !== null && exactAmount >= 20_000
    if (inputMode === 'range') {
      if (!rangeMax || rangeMax < 20_000) return false
      if (rangeMin && rangeMin >= rangeMax) return false
      return true
    }
    return false
  })()

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleTierSelect = useCallback((index: number) => {
    setSelectedTier(index)
    setInputMode('tier')
    setValidationMsg(null)
  }, [])

  const handleExactChange = useCallback((val: string) => {
    setExactRaw(val)
    setInputMode('exact')
    setSelectedTier(null)
    setValidationMsg(null)
  }, [])

  const handleRangeMinChange = useCallback((val: string) => {
    setRangeMinRaw(val)
    setInputMode('range')
    setSelectedTier(null)
    setValidationMsg(null)
  }, [])

  const handleRangeMaxChange = useCallback((val: string) => {
    setRangeMaxRaw(val)
    setInputMode('range')
    setSelectedTier(null)
    setValidationMsg(null)
  }, [])

  const handleContinue = useCallback(() => {
    setValidationMsg(null)

    if (inputMode === 'tier' && selectedTier !== null) {
      const tier = BUDGET_TIERS[selectedTier]
      if (tier.budget_min) setBudgetMin(tier.budget_min)
      selectBudget(tier.budget_max)  // sets budget_max + advances step
      return
    }

    if (inputMode === 'exact') {
      if (!exactAmount || exactAmount < 20_000) {
        setValidationMsg('Enter at least ₦20,000 to see phone options.')
        return
      }
      setBudgetMin(undefined)
      selectBudget(exactAmount)
      return
    }

    if (inputMode === 'range') {
      if (!rangeMax || rangeMax < 20_000) {
        setValidationMsg('Enter a maximum budget of at least ₦20,000.')
        return
      }
      if (rangeMin && rangeMin >= rangeMax) {
        setValidationMsg('Minimum budget must be less than maximum.')
        return
      }
      if (rangeMin && rangeMin > 0) setBudgetMin(rangeMin)
      selectBudget(rangeMax)
      return
    }
  }, [inputMode, selectedTier, exactAmount, rangeMin, rangeMax, selectBudget, setBudgetMin])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 space-y-8">

      {/* Heading */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-text-primary">
          What's your budget?
        </h2>
        <p className="text-sm text-text-secondary">
          {os_type === 'ios'
            ? 'iPhones in Nigeria start around ₦280k for the SE. Set a realistic budget for the best results.'
            : 'Be honest — we will find the best phone your money can actually buy.'}
        </p>
      </div>

      {/* Tier buttons */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Quick pick
        </p>
        <div className="grid grid-cols-5 gap-2">
          {BUDGET_TIERS.map((tier, i) => {
            const isSelected = inputMode === 'tier' && selectedTier === i
            return (
              <button
                key={tier.label}
                type="button"
                onClick={() => handleTierSelect(i)}
                className={`
                  flex flex-col items-center gap-0.5 py-3 px-1 rounded-xl border-2 text-center
                  transition-all duration-150 cursor-pointer
                  ${isSelected
                    ? 'border-brand bg-brand/5 text-brand'
                    : 'border-border bg-surface text-text-primary hover:border-brand/50'
                  }
                `}
              >
                <span className="text-xs font-bold leading-tight">{tier.label}</span>
                <span className={`text-[10px] leading-tight ${isSelected ? 'text-brand/70' : 'text-text-muted'}`}>
                  {tier.sublabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted font-medium">or enter exact amount</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Exact amount */}
      <div
        className={`
          rounded-xl border-2 p-4 transition-colors
          ${inputMode === 'exact'
            ? 'border-brand bg-brand/5'
            : 'border-border bg-surface'
          }
        `}
      >
        <NairaInput
          label="I want to spend"
          placeholder="e.g. 87,000"
          value={exactRaw}
          onChange={handleExactChange}
          hint={
            exactAmount && exactAmount >= 20_000
              ? `Up to ${formatNaira(exactAmount)}`
              : undefined
          }
        />
      </div>

      {/* Range */}
      <div
        className={`
          rounded-xl border-2 p-4 space-y-4 transition-colors
          ${inputMode === 'range'
            ? 'border-brand bg-brand/5'
            : 'border-border bg-surface'
          }
        `}
      >
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Or set a range
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NairaInput
            label="At least"
            placeholder="e.g. 80,000"
            value={rangeMinRaw}
            onChange={handleRangeMinChange}
          />
          <NairaInput
            label="Up to"
            placeholder="e.g. 150,000"
            value={rangeMaxRaw}
            onChange={handleRangeMaxChange}
          />
        </div>
        {rangeMin && rangeMax && rangeMin < rangeMax && (
          <p className="text-xs text-text-secondary">
            Phones priced {formatNaira(rangeMin)} – {formatNaira(rangeMax)}
          </p>
        )}
      </div>

      {/* Validation message */}
      {validationMsg && (
        <p className="text-xs text-red-600 font-medium text-center">{validationMsg}</p>
      )}

      {/* Continue */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!canContinue}
        onClick={handleContinue}
      >
        Continue
      </Button>

      {/* Context note for iOS */}
      {os_type === 'ios' && (
        <p className="text-xs text-text-muted text-center leading-relaxed">
          Most iPhones sold in Nigeria are gray market UK or US used stock. Prices
          can vary significantly between sellers. We'll show you the best options
          available with current verified prices.
        </p>
      )}

    </div>
  )
}

export default StepBudget