// decide-web/src/components/assistant/ResultsPanel.tsx
// The payoff — renders the top 3 phone recommendations after
// the user completes all assistant steps.
// Shows match percentage, scores ranked by the user's priorities,
// store prices, gray market warnings, and compare/detail actions.
//
// Updated:
// - respects recommendation_meta for constrained fallback states
// - uses lowest_price_ngn as the recommendation price source of truth
// - clearly surfaces above-budget fallback behavior in Guided
// - keeps store-level PriceDisplay for breakdown, not for core budget messaging

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useAssistant } from '@/hooks/useAssistant'
import { Button, Badge, Spinner, Divider } from '@/components/ui'
import { PriceDisplay } from '@/components/shared'
import { ScoreBarGroup } from '@/components/phone'
import { mapToComparePhone } from '@/lib/compareContext'
import { useCompareStore } from '@/store/compareStore'
import { formatMatchLabel, formatNaira } from '@/lib/formatters'
import { matchToColour, sortByScore } from '@/lib/scoring'
import { MustCheckToggle } from '@/components/phone/MustCheckToggle'
import type { PriorityWeights, RecommendationResult, ScoredPhone } from '@/types'

const RESULT_HISTORY_KEY_PREFIX = 'decide_result_history'

const getPrimaryDisplayPrice = (phone: ScoredPhone): number | null => {
  return phone.lowest_price_ngn ?? null
}

const getBudgetStatus = (
  result: RecommendationResult,
  phone: ScoredPhone
): {
  isFallback: boolean
  isAboveBudget: boolean
  overBudgetAmount: number | null
} => {
  const budget = result.preferences.budget_max
  const price = getPrimaryDisplayPrice(phone)
  const isFallback =
    result.recommendation_meta.recommendation_type === 'best_available'

  if (price == null || price <= budget) {
    return {
      isFallback,
      isAboveBudget: false,
      overBudgetAmount: null,
    }
  }

  return {
    isFallback,
    isAboveBudget: true,
    overBudgetAmount: price - budget,
  }
}

const buildResultsHeading = (
  result: RecommendationResult
): {
  eyebrow: string
  title: string
  subtitle: string
} => {
  const isFallback =
    result.recommendation_meta.recommendation_type === 'best_available'

  const brand =
    result.preferences.brand_preference !== 'any'
      ? result.preferences.brand_preference
      : null

  const usage = result.preferences.usage_type
  const budget = result.preferences.budget_max

  if (isFallback) {
    const brandText = brand ? `${brand} ` : ''
    return {
      eyebrow: 'Closest Viable Option',
      title: `No strong ${brandText}phone fits cleanly under ${formatNaira(budget)}`,
      subtitle: `Your stricter filters${usage ? ` for ${usage}` : ''} removed the cheaper options, so this is the closest credible fallback rather than a clean best-fit match.`,
    }
  }

  return {
    eyebrow: 'Your Results',
    title:
      result.recommendations.length === 1
        ? 'Your best match'
        : `Your top ${Math.min(3, result.recommendations.length)} matches`,
    subtitle: `Ranked by how well they fit your priorities${usage ? ` for ${usage}` : ''}.`,
  }
}

export const ResultsPanel = () => {
  const { data: session, status } = useSession()
  const {
    result,
    loading,
    error,
    priorities,
    reset,
    os_type,
    budget_max,
    usage_type,
  } = useAssistant()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Spinner size="lg" centered />
        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-text-primary">
            Finding your perfect phone...
          </p>
          <p className="text-sm text-text-secondary">
            Scoring phones across battery, camera, performance, and build.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
        <div className="text-5xl" aria-hidden="true">⚠️</div>
        <div className="space-y-2">
          <p className="text-lg font-bold text-text-primary">
            Something went wrong
          </p>
          <p className="text-sm text-text-secondary max-w-xs mx-auto">
            {error}
          </p>
        </div>
        <Button onClick={reset} variant="secondary">
          Try again
        </Button>
      </div>
    )
  }

  if (result?.budget_gap) {
    const { brand_name, cheapest_phone_name, cheapest_price_ngn } = result.budget_gap
    const shortfall = cheapest_price_ngn - (budget_max ?? 0)
    const isApple = brand_name.toLowerCase() === 'apple'

    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-8 text-center max-w-md mx-auto">
        <div className="text-5xl" aria-hidden="true">📱</div>

        <div className="space-y-3">
          <p className="text-lg font-bold text-text-primary">
            No {brand_name} phones at this budget
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            The cheapest {brand_name} phone in Nigeria right now is the{' '}
            <span className="font-semibold text-text-primary">{cheapest_phone_name}</span>
            {' '}at{' '}
            <span className="font-semibold text-text-primary">{formatNaira(cheapest_price_ngn)}</span>
            {' '}—{' '}
            <span className="text-accent font-semibold">{formatNaira(shortfall)} above your budget</span>.
          </p>
        </div>

        <div className="w-full space-y-3 text-left">
          {isApple && (
            <div className="bg-surface border border-accent/30 rounded-sm p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold tracking-wider uppercase text-accent">
                  Recommended
                </p>
                <p className="text-sm font-semibold text-text-primary">
                  See what Android can do at {formatNaira(budget_max ?? 0)}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  At this budget there are excellent Android phones with great cameras,
                  long battery life, and official Nigerian warranty — without the gray
                  market risk.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={reset}>
                Try Android instead →
              </Button>
            </div>
          )}

          <div className="bg-surface border border-border rounded-sm p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-primary">
                Can you stretch your budget?
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {isApple
                  ? `The ${cheapest_phone_name} is the most affordable iPhone available in Nigeria right now.`
                  : `The ${cheapest_phone_name} is the cheapest ${brand_name} available right now.`}
              </p>
            </div>
            <Link
              href={`/phones?brand=${brand_name.toLowerCase()}`}
              className="inline-flex items-center text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              Browse {brand_name} phones →
            </Link>
          </div>
        </div>

        <button
          onClick={reset}
          className="text-xs text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors"
        >
          Start over with different preferences
        </button>
      </div>
    )
  }

  if (!result || result.recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
        <div className="text-5xl" aria-hidden="true">📱</div>
        <div className="space-y-2">
          <p className="text-lg font-bold text-text-primary">
            No phones found
          </p>
          <p className="text-sm text-text-secondary max-w-xs mx-auto">
            We couldn&apos;t find phones matching your budget and preferences.
            Try a higher budget or selecting &quot;No Preference&quot; for brand.
          </p>
        </div>
        <Button onClick={reset} variant="secondary">
          Adjust my preferences
        </Button>
      </div>
    )
  }

  const allPhones = sortByScore(result.recommendations)
  const top3 = allPhones.slice(0, 3)
  const others = allPhones.slice(3)
  const heading = buildResultsHeading(result)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-bold tracking-wider uppercase text-accent">
          {heading.eyebrow}
        </p>
        <h1 className="text-3xl font-black text-text-primary tracking-tight leading-tight">
          {heading.title}
        </h1>
        <p className="text-sm text-text-secondary">
          {heading.subtitle}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {os_type && (
          <PreferencePill label={os_type === 'ios' ? 'iPhone' : 'Android'} />
        )}
        {budget_max && (
          <PreferencePill label={`Up to ${formatNaira(budget_max)}`} />
        )}
        {usage_type && (
          <PreferencePill label={usage_type} />
        )}
      </div>

      <ResultHistoryGate
        result={result}
        userId={session?.user?.id ?? null}
        authLoading={status === 'loading'}
      />

      <div className="space-y-4">
        {top3.map((phone, index) => (
          <ResultCard
            key={phone.slug}
            phone={phone}
            rank={index + 1}
            priorities={priorities}
            result={result}
          />
        ))}
      </div>

      {others.length > 0 && (
        <OtherPhones phones={others} priorities={priorities} />
      )}

      <Divider />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-text-secondary text-center sm:text-left">
          Not quite right?
        </p>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={reset}>
            Start over
          </Button>
          <Link href="/phones">
            <Button variant="secondary" size="sm">
              Browse all phones
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

interface ResultHistoryGateProps {
  result: RecommendationResult
  userId: string | null
  authLoading: boolean
}

interface StoredRecommendationResult {
  id: string
  saved_at: string
  budget_max: number
  usage_type: string
  os_type: string
  top_matches: Array<{
    phone_id: number
    name: string
    slug: string
    match_percentage: number
    lowest_price_ngn: number | null
  }>
}

const buildStoredRecommendation = (
  result: RecommendationResult
): StoredRecommendationResult => ({
  id: `${Date.now()}`,
  saved_at: new Date().toISOString(),
  budget_max: result.preferences.budget_max,
  usage_type: result.preferences.usage_type,
  os_type: result.preferences.os_type,
  top_matches: result.recommendations.slice(0, 3).map((phone) => ({
    phone_id: phone.phone_id,
    name: phone.name,
    slug: phone.slug,
    match_percentage: phone.match_percentage,
    lowest_price_ngn: phone.lowest_price_ngn,
  })),
})

const ResultHistoryGate = ({
  result,
  userId,
  authLoading,
}: ResultHistoryGateProps) => {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(false)
  }, [result])

  const handleSave = () => {
    if (!userId || typeof window === 'undefined') {
      return
    }

    const key = `${RESULT_HISTORY_KEY_PREFIX}:${userId}`
    let existing: StoredRecommendationResult[] = []

    try {
      const current = window.localStorage.getItem(key)
      existing = current ? (JSON.parse(current) as StoredRecommendationResult[]) : []
    } catch {
      existing = []
    }

    const next = [buildStoredRecommendation(result), ...existing].slice(0, 12)

    window.localStorage.setItem(key, JSON.stringify(next))
    setSaved(true)
  }

  if (authLoading) {
    return null
  }

  if (!userId) {
    return (
      <section className="rounded-2xl border border-accent/20 bg-tealTint px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-black text-text-primary">
              Keep this recommendation history
            </p>
            <p className="text-xs leading-relaxed text-text-secondary">
              Sign in before leaving so Decide can tie your result history,
              watchlist, and alerts to one account.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent('/assistant')}`}
              className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-xs font-black text-white transition-colors duration-fast hover:bg-accent-hover"
            >
              Sign in
            </Link>
            <Link
              href={`/register?callbackUrl=${encodeURIComponent('/assistant')}`}
              className="inline-flex h-9 items-center rounded-md border border-borderHigh bg-white px-4 text-xs font-bold text-text-primary transition-colors duration-fast hover:border-accent/40 hover:text-accent"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-surfaceHigh px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-black text-text-primary">
            Save this result to your history
          </p>
          <p className="text-xs leading-relaxed text-text-secondary">
            Keep a snapshot of this recommendation so you can compare it with
            future searches from this device.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className="inline-flex h-9 items-center justify-center rounded-md border border-borderHigh bg-white px-4 text-xs font-black text-text-primary transition-colors duration-fast hover:border-accent/40 hover:text-accent disabled:cursor-default disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700"
          >
            {saved ? 'Saved' : 'Save result'}
          </button>
          <Link
            href="/results"
            className="inline-flex h-9 items-center justify-center rounded-md bg-text-primary px-4 text-xs font-black text-white transition-colors duration-fast hover:bg-slate-950"
          >
            History
          </Link>
        </div>
      </div>
    </section>
  )
}

interface ExplainabilitySectionProps {
  reasons: string[]
  tradeoffs: string[]
}

const ExplainabilitySection = ({ reasons, tradeoffs }: ExplainabilitySectionProps) => {
  const [open, setOpen] = useState(false)

  if (reasons.length === 0 && tradeoffs.length === 0) return null

  return (
    <div className="rounded-sm border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-surfaceHigh hover:bg-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold text-text-primary">
          Why we picked this
        </span>
        <span
          className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-2 space-y-3 bg-surface">
          {reasons.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Why it works for you
              </p>
              <ul className="space-y-1.5" role="list">
                {reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-success/15 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-success" />
                      </svg>
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">{reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tradeoffs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Before you buy
              </p>
              <ul className="space-y-1.5" role="list">
                {tradeoffs.map((tradeoff, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="mt-0.5 shrink-0 text-warning"
                      aria-hidden="true"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3v5M8 11v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">{tradeoff}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface OtherPhonesProps {
  phones: ScoredPhone[]
  priorities: PriorityWeights
}

const OtherPhones = ({ phones, priorities }: OtherPhonesProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-surfaceHigh hover:bg-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-text-primary">
          {phones.length} other phone{phones.length !== 1 ? 's' : ''} at your budget
        </span>
        <span
          className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="divide-y divide-border">
          {phones.map((phone, index) => (
            <OtherPhoneRow
              key={phone.slug}
              phone={phone}
              rank={index + 4}
              priorities={priorities}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface OtherPhoneRowProps {
  phone: ScoredPhone
  rank: number
  priorities: PriorityWeights
}

const OtherPhoneRow = ({ phone, rank: _rank, priorities: _priorities }: OtherPhoneRowProps) => {
  const matchColour = matchToColour(phone.match_percentage)

  const lowestPrice = phone.lowest_price_ngn

  return (
    <Link
      href={`/phones/${phone.slug}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-surfaceHigh transition-colors group"
      aria-label={`${phone.name} — ${phone.match_percentage}% match`}
    >
      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-surface rounded border border-border">
        {phone.image_url ? (
          <Image
            src={phone.image_url}
            alt={phone.name}
            width={32}
            height={32}
            className="object-contain w-8 h-8"
          />
        ) : (
          <span className="text-base" aria-hidden="true">📱</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted">{phone.brand_name}</p>
        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-brand transition-colors">
          {phone.name}
        </p>
        {lowestPrice != null && (
          <p className="text-xs text-text-secondary">{formatNaira(lowestPrice)}</p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-base font-black tabular-nums ${matchColour}`}>
          {Math.round(phone.match_percentage)}%
        </p>
        {phone.gray_market_risk === 'high' && (
          <span className="text-xs text-warning" title="High gray market risk">⚠️</span>
        )}
      </div>

      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-muted shrink-0">
        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

interface ResultCardProps {
  phone: ScoredPhone
  rank: number
  priorities: PriorityWeights
  result: RecommendationResult
}

const ResultCard = ({ phone, rank, priorities, result }: ResultCardProps) => {
  const addPhone = useCompareStore((s) => s.addPhone)
  const removePhone = useCompareStore((s) => s.removePhone)
  const isInTray = useCompareStore((s) => s.isInTray(phone.slug))
  const isTrayFull = useCompareStore((s) => s.isTrayFull())

  const isFirst = rank === 1
  const matchColour = matchToColour(phone.match_percentage)
  const matchLabel = formatMatchLabel(phone.match_percentage)
  const displayPrice = getPrimaryDisplayPrice(phone)
  const budgetStatus = useMemo(
    () => getBudgetStatus(result, phone),
    [result, phone]
  )

  const handleCompareToggle = (): void => {
    if (isInTray) {
      removePhone(phone.slug)
    } else {
      addPhone(
        mapToComparePhone({
          id: phone.phone_id,
          slug: phone.slug,
          name: phone.name,
          image_url: phone.image_url,
          brand_name: phone.brand_name,
          os_type: phone.os_type,
          prices: phone.prices,
        })
      )
    }
  }

  return (
    <article
      className={[
        'bg-surface border rounded-md overflow-hidden transition-colors duration-normal',
        isFirst ? 'border-accent/40' : 'border-border',
      ].join(' ')}
      aria-label={`${rank === 1 ? 'Best match' : `Match ${rank}`}: ${phone.name}`}
    >
      {isFirst && (
        <div className="bg-accent-subtle border-b border-accent/20 px-4 py-2 flex items-center gap-2">
          <span className="text-xs font-black text-accent tracking-wider uppercase">
            {budgetStatus.isFallback ? '✦ Closest Viable Pick' : '✦ Best Match'}
          </span>
        </div>
      )}

      <div className="p-5 space-y-5">
        {budgetStatus.isFallback && (
          <div className="rounded-sm border border-warning/25 bg-warning-subtle px-3 py-3 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-warning">
              Above-budget fallback
            </p>
            <p className="text-sm font-semibold text-text-primary">
              No strong clean fit was found within your stated budget.
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              This is the closest viable option we could stand behind for your current filters.
              {budgetStatus.overBudgetAmount != null && (
                <> It sits about <span className="font-semibold text-text-primary">{formatNaira(budgetStatus.overBudgetAmount)}</span> above your budget.</>
              )}
            </p>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-surfaceHigh rounded-sm">
            {phone.image_url ? (
              <Image
                src={phone.image_url}
                alt={phone.name}
                width={52}
                height={52}
                className="object-contain w-12 h-12"
              />
            ) : (
              <PhonePlaceholderIcon />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs text-text-muted font-medium">{phone.brand_name}</p>
            <h2 className="text-base font-bold text-text-primary leading-tight">{phone.name}</h2>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {phone.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>
          </div>

          <div className="shrink-0 text-right space-y-0.5">
            <p
              className={['text-2xl font-black tabular-nums leading-none', matchColour].join(' ')}
              aria-label={`${phone.match_percentage}% match`}
            >
              {Math.round(phone.match_percentage)}%
            </p>
            <p className="text-xs text-text-muted">{matchLabel}</p>
          </div>
        </div>

        {displayPrice != null && (
          <div className="rounded-sm border border-border bg-surfaceHigh px-3 py-2.5 space-y-1">
            <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">
              Recommendation price
            </p>
            <p className="text-lg font-bold text-text-primary">
              {formatNaira(displayPrice)}
            </p>
            {budgetStatus.isAboveBudget && budgetStatus.overBudgetAmount != null ? (
              <p className="text-xs text-warning">
                About {formatNaira(budgetStatus.overBudgetAmount)} above your budget
              </p>
            ) : (
              <p className="text-xs text-text-secondary">
                Used as the main budget reference for this recommendation
              </p>
            )}
          </div>
        )}

        <ScoreBarGroup
          scores={{
            battery: phone.score_battery,
            camera: phone.score_camera,
            performance: phone.score_performance,
            build: phone.score_build,
          }}
          priorities={priorities}
        />

        {phone.gray_market_risk !== 'low' && (
          <div className="flex items-start gap-2 bg-warning-subtle border border-warning/20 rounded-sm px-3 py-2.5">
            <span className="text-sm mt-0.5" aria-hidden="true">⚠️</span>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-warning">
                {phone.gray_market_risk === 'high' ? 'High Gray Market Risk' : 'Verify Before Buying'}
              </p>
              {phone.gray_market_note && (
                <p className="text-xs text-text-secondary leading-snug">{phone.gray_market_note}</p>
              )}
            </div>
          </div>
        )}

        {phone.local_support_note && (
          <p className="text-xs text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">Local support: </span>
            {phone.local_support_note}
          </p>
        )}

        <ExplainabilitySection
          reasons={phone.reasons ?? []}
          tradeoffs={phone.tradeoffs ?? []}
        />

        <MustCheckToggle
          os_type={phone.os_type}
          brand_name={phone.brand_name}
          phone_name={phone.name}
        />

        <PriceDisplay prices={phone.prices} />

        <div className="flex items-center gap-2 pt-1">
          <Link href={`/phones/${phone.slug}`} className="flex-1">
            <Button variant="primary" fullWidth size="sm">
              View Full Specs
            </Button>
          </Link>
          <Button
            variant={isInTray ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleCompareToggle}
            disabled={!isInTray && isTrayFull}
            aria-pressed={isInTray}
            aria-label={isInTray ? `Remove ${phone.name} from comparison` : `Add ${phone.name} to comparison`}
            className="shrink-0"
          >
            {isInTray ? '✓ Comparing' : 'Compare'}
          </Button>
        </div>
      </div>
    </article>
  )
}

const PreferencePill = ({ label }: { label: string }) => (
  <span className="inline-flex items-center h-6 px-2.5 rounded-sm bg-surfaceHigh border border-border text-xs font-medium text-text-secondary capitalize">
    {label}
  </span>
)

const PhonePlaceholderIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-text-muted"
    aria-hidden="true"
  >
    <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
  </svg>
)
