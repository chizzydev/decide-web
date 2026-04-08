// decide-web/src/components/assistant/AgentPanel.tsx
// Free-form AI agent panel.
// Kept isolated from the guided assistant flow so we do not
// disturb the existing step-based recommendation wizard.

'use client'

import React, { useMemo, useState } from 'react'
import { Button, Divider } from '@/components/ui'
import { useAgent } from '@/hooks/useAgent'
import { matchToColour } from '@/lib/scoring'
import type {
  AgentAmbiguousCandidate,
  AgentPresentation,
  AgentResponseData,
} from '@/types/api'

const formatPrice = (amount: number | null | undefined): string => {
  if (amount == null) return 'Price unavailable'
  return `₦${amount.toLocaleString('en-NG')}`
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
        <div className="flex items-start justify-between gap-4">
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
        <div className="rounded-2xl border border-border bg-card p-4 overflow-x-auto">
          <h3 className="font-ui text-sm font-semibold text-text-primary mb-3">
            Comparison details
          </h3>

          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-text-muted border-b border-border">
                <th className="py-2 pr-4">Metric</th>
                <th className="py-2 pr-4">Phone A</th>
                <th className="py-2 pr-4">Phone B</th>
                <th className="py-2 pr-4">Winner</th>
              </tr>
            </thead>
            <tbody>
              {presentation.comparison_rows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 text-text-primary">{row.label}</td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {String(row.phone_a_value)}
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {String(row.phone_b_value)}
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
      )}

      {presentation.actions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-ui text-sm font-semibold text-text-primary mb-3">
            Suggested next actions
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary">
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
    setMessage(candidate.name)
    await runAgent(candidate.name)
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