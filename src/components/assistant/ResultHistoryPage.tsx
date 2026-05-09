'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { AuthRequiredState } from '@/components/auth/AuthRequiredState'
import { Spinner } from '@/components/ui'
import { formatNaira } from '@/lib/formatters'

const RESULT_HISTORY_KEY_PREFIX = 'decide_result_history'

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

export const ResultHistoryPage = () => {
  const { data: session, status } = useSession()
  const [history, setHistory] = useState<StoredRecommendationResult[]>([])

  useEffect(() => {
    if (!session?.user?.id || typeof window === 'undefined') {
      return
    }

    try {
      const stored = window.localStorage.getItem(
        `${RESULT_HISTORY_KEY_PREFIX}:${session.user.id}`
      )
      setHistory(stored ? (JSON.parse(stored) as StoredRecommendationResult[]) : [])
    } catch {
      setHistory([])
    }
  }, [session?.user?.id])

  if (status === 'loading') {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Spinner centered />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <AuthRequiredState
        eyebrow="Result history"
        title="Sign in to view saved recommendations"
        description="Recommendation history is account-owned so your saved results, watchlist, and alerts stay connected when you come back."
        callbackUrl="/results"
      />
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <section className="overflow-hidden rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-6 py-8 shadow-sm md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">
              Result history
            </p>
            <h1 className="text-3xl font-black tracking-tight text-text-primary md:text-4xl">
              Your saved recommendations
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
              Saved assistant results from this device appear here while the full
              cross-device history sync is being built.
            </p>
          </div>
          <Link
            href="/assistant"
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-black text-white transition-colors duration-fast hover:bg-accent-hover"
          >
            Start a new result
          </Link>
        </div>
      </section>

      {history.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-3">
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              No saved results yet
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              Run the assistant, then save the result after Decide recommends
              phones for your budget and priorities.
            </p>
            <Link
              href="/assistant"
              className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-black text-white transition-colors duration-fast hover:bg-accent-hover"
            >
              Open assistant
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {history.map((result) => (
            <article
              key={result.id}
              className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                      {new Date(result.saved_at).toLocaleDateString()}
                    </p>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-text-primary">
                      Up to {formatNaira(result.budget_max)}
                    </h2>
                  </div>
                  <span className="rounded-full border border-accent/20 bg-accent-subtle px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-accent">
                    {result.os_type}
                  </span>
                </div>

                <div className="space-y-2">
                  {result.top_matches.map((phone, index) => (
                    <Link
                      key={`${result.id}-${phone.phone_id}`}
                      href={`/phones/${phone.slug}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-surfaceHigh px-3 py-2 transition-colors duration-fast hover:border-accent/35"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-text-primary">
                          {index + 1}. {phone.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {phone.lowest_price_ngn != null
                            ? formatNaira(phone.lowest_price_ngn)
                            : 'No tracked price'}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-black text-accent">
                        {Math.round(phone.match_percentage)}%
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
