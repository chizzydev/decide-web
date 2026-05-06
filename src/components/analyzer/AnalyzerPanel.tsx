'use client'

import React, { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { analyzeApi, phonesApi } from '@/lib/api'
import { formatNaira, formatNairaCompact } from '@/lib/formatters'
import { matchToColour } from '@/lib/scoring'
import { Badge, Button, Spinner } from '@/components/ui'
import { MustCheckToggle } from '@/components/phone/MustCheckToggle'
import type { PhoneCard, ScoredPhone } from '@/types'
import type { AnalyzeResult, PhoneVerdict, VerdictColour } from '@/types/analyzer'

const USAGE_OPTIONS = [
  { value: 'social', label: 'Social Media', icon: 'SM' },
  { value: 'gaming', label: 'Gaming', icon: 'GM' },
  { value: 'photo', label: 'Photography', icon: 'CAM' },
  { value: 'work', label: 'Work', icon: 'WK' },
  { value: 'student', label: 'Student', icon: 'ST' },
  { value: 'flex', label: 'Status & Style', icon: 'FX' },
] as const

type UsageType = typeof USAGE_OPTIONS[number]['value']

const BUDGET_PRESETS = [
  { label: '\u20A680k', value: 80_000 },
  { label: '\u20A6150k', value: 150_000 },
  { label: '\u20A6250k', value: 250_000 },
  { label: '\u20A6400k', value: 400_000 },
  { label: '\u20A6600k', value: 600_000 },
  { label: '\u20A61M+', value: 1_000_000 },
]

const VERDICT_STYLES: Record<
  VerdictColour,
  { bg: string; border: string; text: string; badge: string; bar: string }
> = {
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    bar: 'bg-emerald-500',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    bar: 'bg-blue-500',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-700',
    bar: 'bg-yellow-500',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    bar: 'bg-orange-500',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    bar: 'bg-red-500',
  },
}

const getLowestTrackedPrice = (
  phone: Pick<ScoredPhone, 'lowest_price_ngn' | 'prices'>
) => {
  if (phone.lowest_price_ngn != null) {
    return phone.lowest_price_ngn
  }

  const prices = phone.prices
    .filter((price) => price.price_ngn > 0 && price.in_stock)
    .map((price) => price.price_ngn)

  if (prices.length === 0) {
    return null
  }

  return Math.min(...prices)
}

const getLowestTrackedPriceFromCard = (phone: PhoneCard) => {
  const prices = phone.prices
    .filter((price) => price.price_ngn > 0 && price.in_stock)
    .map((price) => price.price_ngn)

  if (prices.length === 0) {
    return null
  }

  return Math.min(...prices)
}

export const AnalyzerPanel = () => {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PhoneCard[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPhone, setSelectedPhone] = useState<PhoneCard | null>(null)

  const [budget, setBudget] = useState<number | null>(null)
  const [usageType, setUsageType] = useState<UsageType | null>(null)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setSelectedPhone(null)
    setResult(null)

    if (value.trim().length < 2) {
      setSearchResults([])
      return
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

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

  const canSubmit = !!selectedPhone && !!budget && !!usageType && !loading

  const handleSubmit = async () => {
    if (!selectedPhone || !budget || !usageType) {
      return
    }

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
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        100
      )
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

  const bestAlternative = result?.alternatives[0] ?? null

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Which phone are you considering?
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="e.g. Samsung Galaxy A55, iPhone 15..."
              className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              autoComplete="off"
            />
            {searching ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            ) : null}

            {searchResults.length > 0 ? (
              <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-lg">
                {searchResults.map((phone) => {
                  const lowestPrice = getLowestTrackedPriceFromCard(phone)

                  return (
                    <button
                      key={phone.slug}
                      type="button"
                      onClick={() => selectPhone(phone)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surfaceHigh"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-surfaceHigh">
                        {phone.image_url ? (
                          <Image
                            src={phone.image_url}
                            alt={phone.name}
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-text-muted">IMG</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {phone.name}
                        </p>
                        <p className="text-xs text-text-muted">{phone.brand_name}</p>
                      </div>
                      {lowestPrice != null ? (
                        <p className="shrink-0 text-xs text-text-secondary">
                          from {formatNaira(lowestPrice)}
                        </p>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          {selectedPhone ? (
            <div className="flex items-center gap-2 rounded-sm border border-accent/20 bg-accent-subtle px-3 py-2">
              <span className="text-xs font-semibold text-accent">Selected:</span>
              <span className="text-xs text-text-primary">{selectedPhone.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPhone(null)
                  setQuery('')
                }}
                className="ml-auto text-xs text-text-muted transition-colors hover:text-text-primary"
                aria-label="Clear selection"
              >
                x
              </button>
            </div>
          ) : null}
        </div>

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
                  'rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors',
                  budget === preset.value
                    ? 'border-accent bg-accent text-white'
                    : 'border-border bg-surface text-text-secondary hover:border-accent/50',
                ].join(' ')}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-text-muted">or type:</span>
            <input
              type="number"
              placeholder="Custom amount e.g. 320000"
              value={budget && !BUDGET_PRESETS.find((preset) => preset.value === budget) ? budget : ''}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (value > 0) {
                  setBudget(value)
                }
              }}
              className="w-48 rounded-sm border border-border bg-surface px-3 py-1.5 text-xs text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            {budget ? <span className="text-xs font-semibold text-accent">{formatNaira(budget)}</span> : null}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Main use case
          </label>
          <div className="grid grid-cols-3 gap-2">
            {USAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setUsageType(option.value)}
                className={[
                  'flex flex-col items-center gap-1 rounded-md border px-2 py-3 text-center transition-colors',
                  usageType === option.value
                    ? 'border-accent/40 bg-accent-subtle text-accent'
                    : 'border-border bg-surface text-text-secondary hover:border-accent/30',
                ].join(' ')}
              >
                <span className="text-[10px] font-black tracking-[0.18em]" aria-hidden="true">
                  {option.icon}
                </span>
                <span className="text-xs font-semibold leading-tight">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!canSubmit}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" /> Analyzing...
            </span>
          ) : (
            'Analyze This Phone'
          )}
        </Button>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      {result ? (
        <div ref={resultRef} className="space-y-6 pt-2">
          {result.dealbreaker ? (
            <DealbreakerCard message={result.dealbreaker.message} phone={selectedPhone!} />
          ) : null}

          {result.verdict ? <VerdictCard verdict={result.verdict} budget={budget!} /> : null}

          {bestAlternative ? (
            <AnalyzerShowdownCard
              selectedPhone={selectedPhone!}
              bestAlternative={bestAlternative}
              hasVerdict={!!result.verdict}
            />
          ) : null}

          {result.alternatives.length > 0 ? (
            <AlternativesSection
              alternatives={result.alternatives}
              hasVerdict={!!result.verdict}
              selectedPhoneSlug={selectedPhone!.slug}
            />
          ) : null}

          <ResultNextSteps
            phoneSlug={selectedPhone!.slug}
            hasVerdict={!!result.verdict}
            bestAlternative={bestAlternative}
          />

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2 text-xs text-text-muted underline underline-offset-2 transition-colors hover:text-text-secondary"
          >
            Analyze a different phone
          </button>
        </div>
      ) : null}
    </div>
  )
}

const DealbreakerCard = ({
  message,
  phone,
}: {
  message: string
  phone: PhoneCard
}) => (
  <div className="overflow-hidden rounded-md border border-red-200 bg-red-50">
    <div className="flex items-center gap-2 border-b border-red-200 bg-red-100 px-4 py-2">
      <span className="text-xs font-black uppercase tracking-wider text-red-700">
        Not Recommended
      </span>
    </div>
    <div className="space-y-3 p-4">
      <p className="text-sm leading-relaxed text-red-700">{message}</p>
      <MustCheckToggle
        os_type={phone.os_type}
        brand_name={phone.brand_name}
        phone_name={phone.name}
      />
    </div>
  </div>
)

const VerdictCard = ({
  verdict,
  budget,
}: {
  verdict: PhoneVerdict
  budget: number
}) => {
  const { phone, verdict: meta, budget_status, price_gap_ngn } = verdict
  const styles = VERDICT_STYLES[meta.colour]
  const matchColour = matchToColour(phone.match_percentage)

  return (
    <article className={`overflow-hidden rounded-md border ${styles.border}`}>
      <div className={`flex items-center gap-2 border-b px-4 py-2 ${styles.bg} ${styles.border}`}>
        <span className={`text-xs font-black uppercase tracking-wider ${styles.text}`}>
          {meta.headline}
        </span>
      </div>

      <div className="space-y-5 bg-surface p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm border border-border bg-surfaceHigh">
            {phone.image_url ? (
              <Image
                src={phone.image_url}
                alt={phone.name}
                width={52}
                height={52}
                className="h-12 w-12 object-contain"
              />
            ) : (
              <span className="text-[10px] font-bold text-text-muted">IMG</span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs text-text-muted">{phone.brand_name}</p>
            <h2 className="text-base font-bold leading-tight text-text-primary">{phone.name}</h2>
            <p className="text-xs leading-relaxed text-text-secondary">{meta.subheadline}</p>
          </div>

          <div className="shrink-0 space-y-0.5 text-right">
            <p className={`text-2xl font-black leading-none tabular-nums ${matchColour}`}>
              {phone.match_percentage}%
            </p>
            <p className="text-xs text-text-muted">match</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surfaceHigh">
            <div
              className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
              style={{ width: `${phone.match_percentage}%` }}
            />
          </div>
        </div>

        {budget_status !== 'no_price_data' && price_gap_ngn !== null ? (
          <div
            className={[
              'flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-medium',
              budget_status === 'within_budget'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-orange-200 bg-orange-50 text-orange-700',
            ].join(' ')}
          >
            {budget_status === 'within_budget'
              ? `Fits your budget with ${formatNaira(price_gap_ngn)} left over`
              : `${formatNaira(price_gap_ngn)} above your ${formatNaira(budget)} budget`}
          </div>
        ) : null}

        {phone.reasons.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Why it works</p>
            <ul className="space-y-1.5">
              {phone.reasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100" />
                  <p className="text-xs leading-relaxed text-text-secondary">{reason}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {phone.tradeoffs.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Before you buy</p>
            <ul className="space-y-1.5">
              {phone.tradeoffs.map((tradeoff, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-amber-300" />
                  <p className="text-xs leading-relaxed text-text-secondary">{tradeoff}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {phone.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {phone.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <MustCheckToggle
          os_type={phone.os_type}
          brand_name={phone.brand_name}
          phone_name={phone.name}
        />

        <Link href={`/phones/${phone.slug}`}>
          <Button variant="secondary" fullWidth size="sm">
            View full specs
          </Button>
        </Link>
      </div>
    </article>
  )
}

const AnalyzerShowdownCard = ({
  selectedPhone,
  bestAlternative,
  hasVerdict,
}: {
  selectedPhone: PhoneCard
  bestAlternative: ScoredPhone
  hasVerdict: boolean
}) => {
  const selectedPrice = getLowestTrackedPriceFromCard(selectedPhone)
  const alternativePrice = getLowestTrackedPrice(bestAlternative)

  return (
    <section className="space-y-4 rounded-md border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-4 py-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          Best next showdown
        </p>
        <h2 className="text-lg font-black tracking-tight text-text-primary">
          Put your current pick beside the strongest alternative
        </h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          The analyzer has already narrowed this down. The smartest next move is to pressure-test
          your pick against the best alternative instead of staying in recommendation mode.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CompareLaneBlock
          eyebrow="Your pick"
          name={selectedPhone.name}
          brand={selectedPhone.brand_name}
          price={selectedPrice}
        />
        <CompareLaneBlock
          eyebrow="Strongest alternative"
          name={bestAlternative.name}
          brand={bestAlternative.brand_name}
          price={alternativePrice}
          match={bestAlternative.match_percentage}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NextMoveLink
          href={`/compare/${selectedPhone.slug}/vs/${bestAlternative.slug}`}
          title={`Compare with ${bestAlternative.name}`}
          description="Open the direct head-to-head and resolve the shortlist properly."
        />
        <NextMoveLink
          href={hasVerdict ? `/buy-now-or-wait/${selectedPhone.slug}` : `/phones/${selectedPhone.slug}`}
          title={hasVerdict ? 'Read buy now or wait' : 'Open full phone detail'}
          description={
            hasVerdict
              ? 'Check the timing verdict for your current pick before you commit.'
              : 'Open the full phone page for tracked prices and deeper context.'
          }
        />
        <NextMoveLink
          href={`/worth-it/${bestAlternative.slug}`}
          title={`Check if ${bestAlternative.name} is still worth it`}
          description="Pressure-test the strongest alternative on ownership and age, not just fit."
        />
        <NextMoveLink
          href={`/phones/${bestAlternative.slug}`}
          title={`Open ${bestAlternative.name}`}
          description="Review the strongest alternative in full before you switch your shortlist."
        />
      </div>
    </section>
  )
}

const CompareLaneBlock = ({
  eyebrow,
  name,
  brand,
  price,
  match,
}: {
  eyebrow: string
  name: string
  brand: string
  price: number | null
  match?: number
}) => (
  <div className="rounded-md border border-border bg-white/80 px-4 py-4">
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-accent">{eyebrow}</p>
      <p className="text-xs text-text-muted">{brand}</p>
      <h3 className="text-base font-bold text-text-primary">{name}</h3>
      <p className="text-sm text-text-secondary">
        {price != null ? formatNairaCompact(price) : 'Waiting for tracked price'}
      </p>
      {match != null ? (
        <p className={`text-sm font-bold ${matchToColour(match)}`}>{match}% analyzer match</p>
      ) : null}
    </div>
  </div>
)

const ResultNextSteps = ({
  phoneSlug,
  hasVerdict,
  bestAlternative,
}: {
  phoneSlug: string
  hasVerdict: boolean
  bestAlternative: ScoredPhone | null
}) => {
  const compareHref = bestAlternative
    ? `/compare/${phoneSlug}/vs/${bestAlternative.slug}`
    : '/compare'

  return (
    <div className="space-y-3 rounded-md border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-4 py-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          Next smart moves
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          Do not stop at the analyzer score. Use these follow-up paths to pressure-test the
          decision before you buy.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {hasVerdict ? (
          <>
            <NextMoveLink
              href={`/buy-now-or-wait/${phoneSlug}`}
              title="Buy now or wait"
              description="Open the timing verdict when the current price and purchase window matter most."
            />
            <NextMoveLink
              href={`/worth-it/${phoneSlug}`}
              title="Still worth it"
              description="Check the longer-term ownership case before you commit to this model."
            />
          </>
        ) : (
          <NextMoveLink
            href={`/phones/${phoneSlug}`}
            title="Open full phone detail"
            description="Review the full spec sheet, support context, and live tracked prices for this phone."
          />
        )}

        <NextMoveLink
          href={compareHref}
          title={bestAlternative ? `Compare with ${bestAlternative.name}` : 'Compare against another phone'}
          description={
            bestAlternative
              ? 'Go straight into a head-to-head with the strongest alternative from this result.'
              : 'If you already have another candidate in mind, use Compare next.'
          }
        />

        {bestAlternative ? (
          <NextMoveLink
            href={`/worth-it/${bestAlternative.slug}`}
            title={`Check if ${bestAlternative.name} is still worth it`}
            description="Pressure-test the strongest alternative on long-term ownership before you switch."
          />
        ) : null}

        <NextMoveLink
          href={`/used/${phoneSlug}`}
          title="Open the used buying guide"
          description="If the phone may be bought used or tokunbo, pressure-test the seller and inspection flow before you pay."
        />

        <NextMoveLink
          href="/deals/today"
          title="Check live deals today"
          description="A stronger live drop elsewhere may change what makes sense right now."
        />
      </div>
    </div>
  )
}

const NextMoveLink = ({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) => (
  <Link
    href={href}
    className="rounded-md border border-border bg-white/85 px-3 py-3 transition-colors duration-fast hover:border-borderHigh hover:bg-white"
  >
    <div className="space-y-1">
      <p className="text-sm font-bold text-text-primary">{title}</p>
      <p className="text-xs leading-relaxed text-text-secondary">{description}</p>
    </div>
  </Link>
)

const AlternativesSection = ({
  alternatives,
  hasVerdict,
  selectedPhoneSlug,
}: {
  alternatives: ScoredPhone[]
  hasVerdict: boolean
  selectedPhoneSlug: string
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
        const matchColour = matchToColour(phone.match_percentage)
        const lowestPrice = getLowestTrackedPrice(phone)

        return (
          <article key={phone.slug} className="rounded-md border border-border bg-surface">
            <Link
              href={`/phones/${phone.slug}`}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surfaceHigh"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-surfaceHigh">
                {phone.image_url ? (
                  <Image
                    src={phone.image_url}
                    alt={phone.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-text-muted">IMG</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs text-text-muted">{phone.brand_name}</p>
                <p className="truncate text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">
                  {phone.name}
                </p>
                {lowestPrice != null ? (
                  <p className="text-xs text-text-secondary">{formatNaira(lowestPrice)}</p>
                ) : null}
              </div>

              <div className="shrink-0 space-y-0.5 text-right">
                <p className={`text-base font-black tabular-nums ${matchColour}`}>
                  {phone.match_percentage}%
                </p>
                <p className="text-xs text-text-muted">match</p>
              </div>

              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="shrink-0 text-text-muted"
              >
                <path
                  d="M5 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <div className="flex flex-wrap items-center gap-3 px-4 pb-3 text-xs">
              <Link
                href={`/compare/${selectedPhoneSlug}/vs/${phone.slug}`}
                className="font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
              >
                Compare with your pick
              </Link>
              <Link
                href={`/worth-it/${phone.slug}`}
                className="font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
              >
                Check still worth it
              </Link>
              <Link
                href={`/buy-now-or-wait/${phone.slug}`}
                className="font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
              >
                Read buy now or wait
              </Link>
            </div>
          </article>
        )
      })}
    </div>
  </div>
)
