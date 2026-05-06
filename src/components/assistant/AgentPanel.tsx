// decide-web/src/components/assistant/AgentPanel.tsx
// Free-form AI agent panel.
// Kept isolated from the guided assistant flow so we do not
// disturb the existing step-based recommendation wizard.

'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Divider } from '@/components/ui'
import { useAgent } from '@/hooks/useAgent'
import { matchToColour } from '@/lib/scoring'
import type {
  AgentPresentationAction,
  AgentAmbiguousCandidate,
  AgentPresentation,
  AgentPresentationComparisonRow,
  AgentResponseData,
} from '@/types/api'

const formatPrice = (amount: number | null | undefined): string => {
  if (amount == null) return 'Price unavailable'
  return `₦${amount.toLocaleString('en-NG')}`
}

const getPayloadString = (
  payload: AgentPresentationAction['payload'] | undefined,
  key: string
): string | undefined => {
  const value = payload?.[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

const buildCompareHref = (
  slugA: string | undefined,
  slugB: string | undefined
): string => {
  if (slugA && slugB) return `/compare/${slugA}/vs/${slugB}`
  if (slugA) return `/compare?slug_a=${encodeURIComponent(slugA)}`
  return '/compare'
}

const getActionHref = (action: AgentPresentationAction): string => {
  const slug = getPayloadString(action.payload, 'slug')
  const slugA = getPayloadString(action.payload, 'slug_a') ?? slug
  const slugB = getPayloadString(action.payload, 'slug_b')

  switch (action.type) {
    case 'view_phone':
      return slug ? `/phones/${slug}` : '/phones'
    case 'check_price':
      return slug ? `/phones/${slug}#prices` : '/phones'
    case 'compare_phone':
      return buildCompareHref(slugA, slugB)
    case 'analyze_phone':
      return slug ? `/analyze?phone=${encodeURIComponent(slug)}` : '/analyze'
    case 'view_alternatives':
    default:
      return '/phones'
  }
}

const getWinnerLabel = (
  row: AgentPresentationComparisonRow,
  presentation: AgentPresentation
): string => {
  if (row.winner === 'a') {
    return presentation.comparison_subjects?.phone_a.name ?? 'Phone A'
  }

  if (row.winner === 'b') {
    return presentation.comparison_subjects?.phone_b.name ?? 'Phone B'
  }

  return row.winner === 'tie' ? 'Tie' : 'No clear winner'
}

const getMatchTone = (matchPercentage: number): string => {
  if (matchPercentage >= 90) return 'Excellent match'
  if (matchPercentage >= 80) return 'Strong match'
  if (matchPercentage >= 70) return 'Good fit'
  return 'Possible fit'
}

const isPresentationData = (
  data: AgentResponseData | null | undefined
): data is Extract<AgentResponseData, { presentation?: AgentPresentation }> => {
  return Boolean(data && data.mode !== 'ambiguous')
}

const isAmbiguousData = (
  data: AgentResponseData | null | undefined
): data is Extract<AgentResponseData, { mode: 'ambiguous' }> => {
  return Boolean(data && data.mode === 'ambiguous')
}

const buildCandidateFollowUp = (
  data: Extract<AgentResponseData, { mode: 'ambiguous' }>,
  candidate: AgentAmbiguousCandidate
): string => {
  if (data.source_mode === 'analyze') {
    return `analyze ${candidate.name}`
  }

  if (data.source_mode === 'price') {
    return `price of ${candidate.name}`
  }

  if (data.source_mode === 'compare') {
    const otherPhone =
      data.target === 'phone_a' ? data.phone_b : data.phone_a

    if (otherPhone) {
      return data.target === 'phone_a'
        ? `compare ${candidate.name} vs ${otherPhone}`
        : `compare ${data.phone_a} vs ${candidate.name}`
    }
  }

  return candidate.name
}

const AgentMatchBadge = ({
  tag,
  matchPercentage,
}: {
  tag?: string
  matchPercentage?: number
}) => {
  const hasTag = Boolean(tag)
  const hasMatch = typeof matchPercentage === 'number'

  if (!hasTag && !hasMatch) return null

  const roundedMatch = hasMatch ? Math.round(matchPercentage) : null
  const matchColour = hasMatch ? matchToColour(matchPercentage) : ''

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      {hasTag && (
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
          {tag}
        </span>
      )}

      {hasMatch && roundedMatch != null && (
        <p className={`text-xs font-semibold ${matchColour}`}>
          {roundedMatch}% match
        </p>
      )}
    </div>
  )
}

const AgentPhoneCard = ({
  title,
  phone,
}: {
  title: string
  phone: AgentPresentation['primary_phone']
}) => {
  if (!phone) return null

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-text-muted mb-2">{title}</p>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-ui text-base font-semibold text-text-primary">
            {phone.name}
          </h3>

          <p className="text-sm text-text-secondary mt-1">
            {formatPrice(phone.price_ngn)}
          </p>

          {phone.reason && (
            <p className="text-sm text-text-muted mt-2 leading-6">
              {phone.reason}
            </p>
          )}
        </div>

        <AgentMatchBadge
          tag={phone.tag}
          matchPercentage={phone.match_percentage}
        />
      </div>
    </div>
  )
}

const AgentAlternativeCard = ({
  phone,
}: {
  phone: AgentPresentation['alternatives'][number]
}) => {
  return (
    <div className="rounded-xl border border-border bg-bg px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-text-primary">{phone.name}</p>

          <p className="text-sm text-text-secondary mt-1">
            {formatPrice(phone.price_ngn)}
          </p>

          {phone.reason && (
            <p className="text-sm text-text-muted mt-2 leading-6">
              {phone.reason}
            </p>
          )}
        </div>

        <AgentMatchBadge
          tag={phone.tag}
          matchPercentage={phone.match_percentage}
        />
      </div>
    </div>
  )
}

const AgentComparisonSubjects = ({
  presentation,
}: {
  presentation: AgentPresentation
}) => {
  const subjects = presentation.comparison_subjects
  if (!subjects) return null

  const items = [
    { label: 'Phone A', subject: subjects.phone_a },
    { label: 'Phone B', subject: subjects.phone_b },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(({ label, subject }) => (
        <div
          key={subject.slug}
          className="rounded-2xl border border-border bg-bg px-4 py-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            {label}
          </p>
          <p className="mt-1 font-ui text-base font-semibold text-text-primary">
            {subject.name}
          </p>
          <p className="mt-1 text-xs font-medium text-accent">
            {subject.variant_label ?? 'Core tracked configuration'}
          </p>
        </div>
      ))}
    </div>
  )
}

const AgentMobileComparisonRows = ({
  presentation,
}: {
  presentation: AgentPresentation
}) => {
  const rows = presentation.comparison_rows ?? []
  if (rows.length === 0) return null

  return (
    <div className="space-y-3 sm:hidden">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-xl border border-border bg-bg px-4 py-3"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium text-text-primary">{row.label}</p>
            <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
              {getWinnerLabel(row, presentation)}
            </span>
          </div>

          <div className="mt-3 grid gap-2 text-sm">
            <div className="rounded-lg bg-card px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                {presentation.comparison_subjects?.phone_a.name ?? 'Phone A'}
              </p>
              <p className="mt-1 text-text-secondary">
                {String(row.phone_a_value ?? 'Not available')}
              </p>
            </div>
            <div className="rounded-lg bg-card px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                {presentation.comparison_subjects?.phone_b.name ?? 'Phone B'}
              </p>
              <p className="mt-1 text-text-secondary">
                {String(row.phone_b_value ?? 'Not available')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const AgentPresentationView = ({
  presentation,
  text,
}: {
  presentation: AgentPresentation
  text?: string
}) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {presentation.mode}
            </p>
            <h2 className="mt-1 font-ui text-xl font-semibold text-text-primary">
              {presentation.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              {presentation.summary}
            </p>

            {presentation.breakdown && (
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {presentation.breakdown}
              </p>
            )}
          </div>

          {presentation.verdict && (
            <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {presentation.verdict.headline}
            </span>
          )}
        </div>
      </div>

      {presentation.mode === 'compare' && (
        <AgentComparisonSubjects presentation={presentation} />
      )}

      <AgentPhoneCard
        title="Primary result"
        phone={presentation.primary_phone}
      />

      {presentation.budget && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-text-muted mb-2">Budget check</p>
          <p className="text-sm text-text-secondary">
            {presentation.budget.message}
          </p>
        </div>
      )}

      {presentation.reasons.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-ui text-sm font-semibold text-text-primary mb-3">
            Strengths
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            {presentation.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {presentation.tradeoffs.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-ui text-sm font-semibold text-text-primary mb-3">
            Tradeoffs
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            {presentation.tradeoffs.map((tradeoff) => (
              <li key={tradeoff}>• {tradeoff}</li>
            ))}
          </ul>
        </div>
      )}

      {presentation.alternatives.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-ui text-sm font-semibold text-text-primary mb-3">
            Alternatives
          </h3>

          <div className="space-y-3">
            {presentation.alternatives.map((phone) => (
              <AgentAlternativeCard
                key={phone.slug}
                phone={phone}
              />
            ))}
          </div>
        </div>
      )}

      {presentation.comparison_rows && presentation.comparison_rows.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-ui text-sm font-semibold text-text-primary mb-3">
            Comparison details
          </h3>

          <AgentMobileComparisonRows presentation={presentation} />

          <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-text-muted border-b border-border">
                <th className="py-2 pr-4">Metric</th>
                <th className="py-2 pr-4">
                  {presentation.comparison_subjects?.phone_a.name ?? 'Phone A'}
                </th>
                <th className="py-2 pr-4">
                  {presentation.comparison_subjects?.phone_b.name ?? 'Phone B'}
                </th>
                <th className="py-2 pr-4">Winner</th>
              </tr>
            </thead>
            <tbody>
              {presentation.comparison_rows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 text-text-primary">{row.label}</td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {String(row.phone_a_value ?? 'Not available')}
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {String(row.phone_b_value ?? 'Not available')}
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {row.winner === 'a'
                      ? 'Phone A'
                      : row.winner === 'b'
                      ? 'Phone B'
                      : row.winner === 'tie'
                      ? 'Tie'
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {presentation.actions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-ui text-sm font-semibold text-text-primary mb-3">
            Suggested next actions
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {presentation.actions.map((action) => (
              <Link
                key={`${action.type}-${action.label}`}
                href={getActionHref(action)}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-bg px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {action.label}
              </Link>
            ))}
          </div>
          <ul className="hidden space-y-2 text-sm text-text-secondary">
            {presentation.actions.map((action) => (
              <li key={`${action.type}-${action.label}`}>• {action.label}</li>
            ))}
          </ul>
        </div>
      )}

      {process.env.NODE_ENV !== 'production' && text && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-ui text-sm font-semibold text-text-primary mb-3">
            Raw assistant text
          </h3>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-text-secondary font-sans">
            {text}
          </pre>
        </div>
      )}
    </div>
  )
}

const AmbiguousCandidateList = ({
  query,
  candidates,
  onChoose,
}: {
  query: string
  candidates: AgentAmbiguousCandidate[]
  onChoose: (candidate: AgentAmbiguousCandidate) => void
}) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-ui text-base font-semibold text-text-primary">
        Multiple close matches found
      </h3>
      <p className="mt-2 text-sm text-text-secondary">
        I found multiple possible matches for “{query}”. Choose one to continue.
      </p>

      <div className="mt-4 space-y-3">
        {candidates.map((candidate) => (
          <button
            key={candidate.slug}
            type="button"
            onClick={() => onChoose(candidate)}
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-left transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <p className="font-medium text-text-primary">{candidate.name}</p>
            <p className="mt-1 text-sm text-text-muted">{candidate.brand_name}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export const AgentPanel = () => {
  const [message, setMessage] = useState('')
  const { response, loading, error, runAgent, resetAgent } = useAgent()

  const responseData = response?.data ?? null

  const canSubmit = useMemo(() => message.trim().length > 0, [message])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await runAgent(message)
  }

  const handleChooseCandidate = async (
    candidate: AgentAmbiguousCandidate
  ): Promise<void> => {
    const nextMessage = isAmbiguousData(responseData)
      ? buildCandidateFollowUp(responseData, candidate)
      : candidate.name

    setMessage(nextMessage)
    await runAgent(nextMessage)
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          AI assistant
        </p>
        <h1 className="mt-2 font-ui text-3xl font-semibold text-text-primary">
          Ask naturally
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Try things like “best Samsung phone under 500k”, “analyze Redmi Note 13”,
          or “compare Samsung A34 vs Redmi Note 13”.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="agent-message" className="sr-only">
            Ask Decide Assistant
          </label>

          <textarea
            id="agent-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Ask Decide anything about phones..."
            className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setMessage('')
                resetAgent()
              }}
            >
              Clear
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit || loading}
            >
              {loading ? 'Thinking...' : 'Ask Assistant'}
            </Button>
          </div>
        </form>

        {error && (
          <>
            <Divider className="my-4" />
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          </>
        )}
      </div>

      {responseData && isAmbiguousData(responseData) && (
        <AmbiguousCandidateList
          query={responseData.query}
          candidates={responseData.candidates}
          onChoose={handleChooseCandidate}
        />
      )}

      {responseData && isPresentationData(responseData) && responseData.presentation && (
        <AgentPresentationView
          presentation={responseData.presentation}
          text={responseData.text}
        />
      )}
    </div>
  )
}
