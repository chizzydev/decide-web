// decide-web/src/components/analyzer/AnalyzerPanel.tsx
// "Should I Buy This Phone?" — the standalone analyzer UI.
//
// Flow:
//   1. User searches for a phone by name
//   2. Selects the phone from search results
//   3. Enters their budget and usage type
//   4. Submits → sees verdict card with match %, reasons, tradeoffs
//   5. Sees up to 3 better alternatives below
//   6. MustCheckToggle appears for the specific phone

'use client'

import React, { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { phonesApi, analyzeApi } from '@/lib/api'
import { Button, Spinner, Badge } from '@/components/ui'
import { MustCheckToggle } from '@/components/phone/MustCheckToggle'
import { formatNaira } from '@/lib/formatters'
import { matchToColour } from '@/lib/scoring'
import type { PhoneCard } from '@/types'
import type {
  AnalyzeResult,
  PhoneVerdict,
  VerdictColour,
} from '@/types/analyzer'

// ── Usage options ──────────────────────────────────────────────────────────────

const USAGE_OPTIONS = [
  { value: 'social',  label: 'Social Media',    emoji: '📱' },
  { value: 'gaming',  label: 'Gaming',           emoji: '🎮' },
  { value: 'photo',   label: 'Photography',      emoji: '📸' },
  { value: 'work',    label: 'Work',             emoji: '💼' },
  { value: 'student', label: 'Student',          emoji: '🎓' },
  { value: 'flex',    label: 'Status & Style',   emoji: '✨' },
] as const

type UsageType = typeof USAGE_OPTIONS[number]['value']

// ── Budget presets ─────────────────────────────────────────────────────────────

const BUDGET_PRESETS = [
  { label: '₦80k',   value: 80000   },
  { label: '₦150k',  value: 150000  },
  { label: '₦250k',  value: 250000  },
  { label: '₦400k',  value: 400000  },
  { label: '₦600k',  value: 600000  },
  { label: '₦1M+',   value: 1000000 },
]

// ── Verdict colour map ─────────────────────────────────────────────────────────

const VERDICT_STYLES: Record<VerdictColour, {
  bg: string; border: string; text: string; badge: string; bar: string
}> = {
  green:  { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500'  },
  blue:   { bg: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700',       bar: 'bg-blue-500'     },
  yellow: { bg: 'bg-yellow-50',   border: 'border-yellow-200',  text: 'text-yellow-700',  badge: 'bg-yellow-100 text-yellow-700',   bar: 'bg-yellow-500'   },
  orange: { bg: 'bg-orange-50',   border: 'border-orange-200',  text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-700',   bar: 'bg-orange-500'   },
  red:    { bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700',         bar: 'bg-red-500'      },
}

// ── Main component ─────────────────────────────────────────────────────────────

export const AnalyzerPanel = () => {
  // Step 1 — phone search
  const [query,        setQuery]        = useState('')
  const [searchResults, setSearchResults] = useState<PhoneCard[]>([])
  const [searching,    setSearching]    = useState(false)
  const [selectedPhone, setSelectedPhone] = useState<PhoneCard | null>(null)

  // Step 2 — context
  const [budget,    setBudget]    = useState<number | null>(null)
  const [usageType, setUsageType] = useState<UsageType | null>(null)

  // Step 3 — result
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<AnalyzeResult | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultRef     = useRef<HTMLDivElement>(null)

  // ── Search with debounce ───────────────────────────────────────────────────
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setSelectedPhone(null)
    setResult(null)

    if (value.trim().length < 2) {
      setSearchResults([])
      return
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const phones = await phonesApi.search(value.trim())
        setSearchResults(phones.slice(0, 8))
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  const selectPhone = (phone: PhoneCard) => {
    setSelectedPhone(phone)
    setQuery(phone.name)
    setSearchResults([])
    setResult(null)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const canSubmit = selectedPhone && budget && usageType && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await analyzeApi.analyze({
        phone_slug: selectedPhone.slug,
        budget,
        usage_type: usageType,
      })
      setResult(data)
      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setQuery('')
    setSelectedPhone(null)
    setSearchResults([])
    setBudget(null)
    setUsageType(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="space-y-8">

      {/* ── Input form ─────────────────────────────────────────────────────── */}
      <div className="space-y-6">

        {/* Phone search */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Which phone are you considering?
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="e.g. Samsung Galaxy A55, iPhone 15..."
              className="w-full px-4 py-3 rounded-md border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
              autoComplete="off"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}

            {/* Search dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full bg-surface border border-border rounded-md shadow-lg overflow-hidden">
                {searchResults.map((phone) => (
                  <button
                    key={phone.slug}
                    type="button"
                    onClick={() => selectPhone(phone)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surfaceHigh transition-colors"
                  >
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-surfaceHigh rounded border border-border">
                      {phone.image_url ? (
                        <Image src={phone.image_url} alt={phone.name} width={24} height={24} className="object-contain w-6 h-6" />
                      ) : (
                        <span className="text-xs" aria-hidden="true">📱</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{phone.name}</p>
                      <p className="text-xs text-text-muted">{phone.brand_name}</p>
                    </div>
                    {phone.prices.length > 0 && (
                      <p className="text-xs text-text-secondary shrink-0">
                        from {formatNaira(Math.min(...phone.prices.filter(p => p.price_ngn > 0).map(p => p.price_ngn)))}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected phone pill */}
          {selectedPhone && (
            <div className="flex items-center gap-2 px-3 py-2 bg-accent-subtle border border-accent/20 rounded-sm">
              <span className="text-xs font-semibold text-accent">✓ Selected:</span>
              <span className="text-xs text-text-primary">{selectedPhone.name}</span>
              <button
                type="button"
                onClick={() => { setSelectedPhone(null); setQuery('') }}
                className="ml-auto text-text-muted hover:text-text-primary text-xs"
                aria-label="Clear selection"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Your budget
          </label>
          <div className="flex flex-wrap gap-2">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setBudget(preset.value)}
                className={[
                  'px-3 py-1.5 rounded-sm border text-xs font-semibold transition-colors',
                  budget === preset.value
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-border text-text-secondary hover:border-accent/50',
                ].join(' ')}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {/* Custom budget input */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-muted">or type:</span>
            <input
              type="number"
              placeholder="Custom amount e.g. 320000"
              value={budget && !BUDGET_PRESETS.find(p => p.value === budget) ? budget : ''}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (v > 0) setBudget(v)
              }}
              className="w-48 px-3 py-1.5 rounded-sm border border-border bg-surface text-text-primary placeholder:text-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
            {budget && <span className="text-xs font-semibold text-accent">{formatNaira(budget)}</span>}
          </div>
        </div>

        {/* Usage type */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Main use case
          </label>
          <div className="grid grid-cols-3 gap-2">
            {USAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUsageType(opt.value)}
                className={[
                  'flex flex-col items-center gap-1 px-2 py-3 rounded-md border text-center transition-colors',
                  usageType === opt.value
                    ? 'bg-accent-subtle border-accent/40 text-accent'
                    : 'bg-surface border-border text-text-secondary hover:border-accent/30',
                ].join(' ')}
              >
                <span className="text-lg" aria-hidden="true">{opt.emoji}</span>
                <span className="text-xs font-semibold leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" /> Analyzing...
            </span>
          ) : 'Analyze This Phone'}
        </Button>

      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-sm px-4 py-3">
          <span className="text-sm" aria-hidden="true">⚠️</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Result ─────────────────────────────────────────────────────────── */}
      {result && (
        <div ref={resultRef} className="space-y-6 pt-2">

          {/* Dealbreaker */}
          {result.dealbreaker && (
            <DealbreakerCard
              message={result.dealbreaker.message}
              phone={selectedPhone!}
            />
          )}

          {/* Verdict */}
          {result.verdict && (
            <VerdictCard
              verdict={result.verdict}
              budget={budget!}
            />
          )}

          {/* Alternatives */}
          {result.alternatives.length > 0 && (
            <AlternativesSection
              alternatives={result.alternatives}
              hasVerdict={!!result.verdict}
            />
          )}

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="w-full text-xs text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors py-2"
          >
            Analyze a different phone
          </button>

        </div>
      )}

    </div>
  )
}

// ── DealbreakerCard ────────────────────────────────────────────────────────────

const DealbreakerCard = ({
  message,
  phone,
}: {
  message: string
  phone: PhoneCard
}) => (
  <div className="rounded-md border border-red-200 bg-red-50 overflow-hidden">
    <div className="px-4 py-2 bg-red-100 border-b border-red-200 flex items-center gap-2">
      <span aria-hidden="true">❌</span>
      <span className="text-xs font-black text-red-700 tracking-wider uppercase">Not Recommended</span>
    </div>
    <div className="p-4 space-y-3">
      <p className="text-sm text-red-700 leading-relaxed">{message}</p>
      <MustCheckToggle
        os_type={phone.os_type}
        brand_name={phone.brand_name}
        phone_name={phone.name}
      />
    </div>
  </div>
)

// ── VerdictCard ────────────────────────────────────────────────────────────────

const VerdictCard = ({
  verdict,
  budget,
}: {
  verdict: PhoneVerdict
  budget:  number
}) => {
  const { phone, verdict: meta, budget_status, price_gap_ngn } = verdict
  const styles     = VERDICT_STYLES[meta.colour]
  const matchColour = matchToColour(phone.match_percentage)

  return (
    <article className={`rounded-md border overflow-hidden ${styles.border}`}>

      {/* Verdict banner */}
      <div className={`px-4 py-2 border-b flex items-center gap-2 ${styles.bg} ${styles.border}`}>
        <span aria-hidden="true">{meta.emoji}</span>
        <span className={`text-xs font-black tracking-wider uppercase ${styles.text}`}>
          {meta.headline}
        </span>
      </div>

      <div className="bg-surface p-5 space-y-5">

        {/* Phone identity */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-surfaceHigh rounded-sm border border-border">
            {phone.image_url ? (
              <Image src={phone.image_url} alt={phone.name} width={52} height={52} className="object-contain w-12 h-12" />
            ) : (
              <span className="text-2xl" aria-hidden="true">📱</span>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs text-text-muted">{phone.brand_name}</p>
            <h2 className="text-base font-bold text-text-primary leading-tight">{phone.name}</h2>
            <p className="text-xs text-text-secondary leading-relaxed">{meta.subheadline}</p>
          </div>

          <div className="shrink-0 text-right space-y-0.5">
            <p className={`text-2xl font-black tabular-nums leading-none ${matchColour}`}>
              {phone.match_percentage}%
            </p>
            <p className="text-xs text-text-muted">match</p>
          </div>
        </div>

        {/* Match bar */}
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-surfaceHigh rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
              style={{ width: `${phone.match_percentage}%` }}
            />
          </div>
        </div>

        {/* Budget status */}
        {budget_status !== 'no_price_data' && price_gap_ngn !== null && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-xs font-medium ${
            budget_status === 'within_budget'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-orange-50 border-orange-200 text-orange-700'
          }`}>
            <span aria-hidden="true">{budget_status === 'within_budget' ? '✓' : '↑'}</span>
            {budget_status === 'within_budget'
              ? `Fits your budget — ${formatNaira(price_gap_ngn)} left over`
              : `${formatNaira(price_gap_ngn)} above your ${formatNaira(budget)} budget`
            }
          </div>
        )}

        {/* Reasons */}
        {phone.reasons.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Why it works</p>
            <ul className="space-y-1.5">
              {phone.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden="true">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l2 2 3-3" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">{reason}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tradeoffs */}
        {phone.tradeoffs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Before you buy</p>
            <ul className="space-y-1.5">
              {phone.tradeoffs.map((tradeoff, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v5M8 11v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">{tradeoff}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {phone.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {phone.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Must check */}
        <MustCheckToggle
          os_type={phone.os_type}
          brand_name={phone.brand_name}
          phone_name={phone.name}
        />

        {/* CTA */}
        <Link href={`/phones/${phone.slug}`}>
          <Button variant="secondary" fullWidth size="sm">
            View Full Specs →
          </Button>
        </Link>

      </div>
    </article>
  )
}

// ── AlternativesSection ────────────────────────────────────────────────────────

const AlternativesSection = ({
  alternatives,
  hasVerdict,
}: {
  alternatives: import('@/types').ScoredPhone[]
  hasVerdict:   boolean
}) => (
  <div className="space-y-3">
    <div className="space-y-0.5">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {hasVerdict ? 'Better alternatives at your budget' : 'Consider these instead'}
      </p>
      <p className="text-xs text-text-secondary">
        {hasVerdict
          ? 'These phones scored higher for your use case at the same budget.'
          : 'These are the strongest matches for your budget and use case.'}
      </p>
    </div>

    <div className="space-y-2">
      {alternatives.map((phone) => {
        const matchColour   = matchToColour(phone.match_percentage)
        const lowestPrice   = phone.prices
          .filter((p) => p.price_ngn > 0 && p.in_stock)
          .sort((a, b) => a.price_ngn - b.price_ngn)[0]

        return (
          <Link
            key={phone.slug}
            href={`/phones/${phone.slug}`}
            className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-md hover:bg-surfaceHigh transition-colors group"
          >
            <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-surfaceHigh rounded border border-border">
              {phone.image_url ? (
                <Image src={phone.image_url} alt={phone.name} width={32} height={32} className="object-contain w-8 h-8" />
              ) : (
                <span className="text-base" aria-hidden="true">📱</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">{phone.brand_name}</p>
              <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                {phone.name}
              </p>
              {lowestPrice && (
                <p className="text-xs text-text-secondary">{formatNaira(lowestPrice.price_ngn)}</p>
              )}
            </div>

            <div className="shrink-0 text-right space-y-0.5">
              <p className={`text-base font-black tabular-nums ${matchColour}`}>
                {phone.match_percentage}%
              </p>
              <p className="text-xs text-text-muted">match</p>
            </div>

            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-muted shrink-0">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )
      })}
    </div>
  </div>
)