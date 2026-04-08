'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { requestAdminJson } from '@/lib/adminApi'

type AuditLevel = 'info' | 'warn' | 'error'

type AuditEventRow = {
  id: string
  level: AuditLevel
  event: string
  actor_user_id: string | null
  actor_email: string | null
  actor_provider: string | null
  session_id: string | null
  request_method: string | null
  request_path: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
}

type AuditResponse = {
  success: boolean
  message?: string
  data: {
    events: AuditEventRow[]
    summary: Record<AuditLevel, number>
    pagination: {
      page: number
      limit: number
      total: number
      total_pages: number
    }
    filters: {
      q: string
      level: string
    }
  }
}

type SecurityOverview = {
  window_hours: number
  summary: {
    failed_logins: number
    login_blocks: number
    password_reset_requests: number
    password_reset_blocks: number
    password_reset_failures: number
    failed_refreshes: number
    refresh_blocks: number
    google_failures: number
    google_blocks: number
    unique_networks: number
    affected_accounts: number
  }
  top_events: Array<{
    event: string
    count: number
  }>
}

type SecurityOverviewResponse = {
  success: boolean
  message?: string
  data: SecurityOverview
}

const PAGE_SIZE = 25
const SECURITY_WINDOW_HOURS = 24

const levelStyles: Record<AuditLevel, string> = {
  info: 'bg-slate-100 text-slate-700',
  warn: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
}

const securityEventFamilies = [
  'auth.login_rejected',
  'mobile_auth.login_rejected',
  'password_reset.requested',
  'password_reset.reset_rejected',
  'password_reset.email_failed',
  'mobile_auth.refresh_rejected',
  'mobile_auth.google_rejected',
  'google_auth.identity_unverified',
  'google_auth.sub_mismatch',
  'google_auth.email_mismatch',
  'google_auth.reauth_missing_iat',
  'google_auth.reauth_expired',
  'auth_security.login_temporarily_blocked',
  'auth_security.password_reset_request_temporarily_blocked',
  'auth_security.password_reset_attempt_temporarily_blocked',
  'auth_security.refresh_temporarily_blocked',
  'auth_security.google_temporarily_blocked',
]

const formatSecurityEventLabel = (value: string) =>
  value
    .replaceAll('.', ' / ')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())

const isSecurityEvent = (value: string) =>
  securityEventFamilies.includes(value)

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export default function AdminAuditPage() {
  const [events, setEvents] = useState<AuditEventRow[]>([])
  const [securityOverview, setSecurityOverview] = useState<SecurityOverview>({
    window_hours: SECURITY_WINDOW_HOURS,
    summary: {
      failed_logins: 0,
      login_blocks: 0,
      password_reset_requests: 0,
      password_reset_blocks: 0,
      password_reset_failures: 0,
      failed_refreshes: 0,
      refresh_blocks: 0,
      google_failures: 0,
      google_blocks: 0,
      unique_networks: 0,
      affected_accounts: 0,
    },
    top_events: [],
  })
  const [summary, setSummary] = useState<Record<AuditLevel, number>>({
    info: 0,
    warn: 0,
    error: 0,
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [level, setLevel] = useState<'all' | AuditLevel>('all')
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      })

      if (submittedQuery.trim()) params.set('q', submittedQuery.trim())
      if (level !== 'all') params.set('level', level)

      const [json, securityJson] = await Promise.all([
        requestAdminJson<AuditResponse>(`/audit-events?${params.toString()}`),
        requestAdminJson<SecurityOverviewResponse>(
          `/audit-events/security-overview?window_hours=${SECURITY_WINDOW_HOURS}`
        ),
      ])

      if (!json.success) {
        setError(json.message ?? 'Failed to load the audit log.')
        setEvents([])
        return
      }

      if (!securityJson.success) {
        setError(securityJson.message ?? 'Failed to load the security overview.')
        setEvents([])
        return
      }

      setEvents(json.data.events)
      setSecurityOverview(securityJson.data)
      setSummary({
        info: json.data.summary.info ?? 0,
        warn: json.data.summary.warn ?? 0,
        error: json.data.summary.error ?? 0,
      })
      setTotalPages(json.data.pagination.total_pages)
      setTotal(json.data.pagination.total)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load the audit log.'
      )
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [level, page, submittedQuery])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const summaryCards = useMemo(
    () => [
      {
        label: 'Events',
        value: total,
        className: 'border-border bg-surface',
      },
      {
        label: 'Warnings',
        value: summary.warn,
        className: 'border-amber-200 bg-amber-50',
      },
      {
        label: 'Errors',
        value: summary.error,
        className: 'border-red-200 bg-red-50',
      },
    ],
    [summary.error, summary.warn, total]
  )

  const securityCards = useMemo(
    () => [
      {
        label: 'Failed sign-ins',
        value: securityOverview.summary.failed_logins,
        className: 'border-amber-200 bg-amber-50',
      },
      {
        label: 'Temporary blocks',
        value:
          securityOverview.summary.login_blocks +
          securityOverview.summary.refresh_blocks +
          securityOverview.summary.google_blocks,
        className: 'border-red-200 bg-red-50',
      },
      {
        label: 'Affected accounts',
        value: securityOverview.summary.affected_accounts,
        className: 'border-border bg-surface',
      },
      {
        label: 'Unique networks',
        value: securityOverview.summary.unique_networks,
        className: 'border-border bg-surface',
      },
    ],
    [securityOverview]
  )

  const applyQuickFilter = (nextQuery: string, nextLevel: 'all' | AuditLevel = 'all') => {
    setQuery(nextQuery)
    setSubmittedQuery(nextQuery)
    setLevel(nextLevel)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Audit Log</h1>
          <p className="text-sm text-text-secondary mt-1">
            Review security-sensitive Decide activity across auth, accounts, alerts, reviews, and sessions.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-md border p-4 ${card.className}`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-black text-text-primary">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-4 rounded-md border border-border bg-surface p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-text-primary">
              Suspicious auth overview
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Login abuse, refresh-token abuse, and Google identity failures across the last{' '}
              {securityOverview.window_hours} hours.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyQuickFilter('temporarily_blocked', 'warn')}
              className="rounded-sm border border-border px-3 py-2 text-xs font-bold text-text-secondary hover:border-borderHigh hover:text-text-primary transition-colors duration-fast"
            >
              View lockouts
            </button>
            <button
              type="button"
              onClick={() => applyQuickFilter('login_rejected', 'warn')}
              className="rounded-sm border border-border px-3 py-2 text-xs font-bold text-text-secondary hover:border-borderHigh hover:text-text-primary transition-colors duration-fast"
            >
              View failed sign-ins
            </button>
            <button
              type="button"
              onClick={() => applyQuickFilter('google_auth', 'warn')}
              className="rounded-sm border border-border px-3 py-2 text-xs font-bold text-text-secondary hover:border-borderHigh hover:text-text-primary transition-colors duration-fast"
            >
              View Google issues
            </button>
            <button
              type="button"
              onClick={() => applyQuickFilter('password_reset', 'warn')}
              className="rounded-sm border border-border px-3 py-2 text-xs font-bold text-text-secondary hover:border-borderHigh hover:text-text-primary transition-colors duration-fast"
            >
              View reset issues
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {securityCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-md border p-4 ${card.className}`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-black text-text-primary">
                {card.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="rounded-md border border-border bg-surfaceHigh p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              Breakdown
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Failed refresh attempts
                </p>
                <p className="mt-1 text-2xl font-black text-text-primary">
                  {securityOverview.summary.failed_refreshes.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Refresh lockouts
                </p>
                <p className="mt-1 text-2xl font-black text-text-primary">
                  {securityOverview.summary.refresh_blocks.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Google auth failures
                </p>
                <p className="mt-1 text-2xl font-black text-text-primary">
                  {securityOverview.summary.google_failures.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Google auth lockouts
                </p>
                <p className="mt-1 text-2xl font-black text-text-primary">
                  {securityOverview.summary.google_blocks.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Password reset requests
                </p>
                <p className="mt-1 text-2xl font-black text-text-primary">
                  {securityOverview.summary.password_reset_requests.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Reset abuse / blocks
                </p>
                <p className="mt-1 text-2xl font-black text-text-primary">
                  {(
                    securityOverview.summary.password_reset_failures +
                    securityOverview.summary.password_reset_blocks
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-surfaceHigh p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              Top suspicious events
            </p>
            <div className="mt-3 space-y-3">
              {securityOverview.top_events.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No suspicious auth events recorded in this window.
                </p>
              ) : (
                securityOverview.top_events.map((item) => (
                  <div
                    key={item.event}
                    className="flex items-start justify-between gap-3 rounded-sm border border-border bg-surface px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary break-words">
                        {formatSecurityEventLabel(item.event)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-text-primary">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="bg-surface border border-border rounded-md p-4 space-y-4">
        <form
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setSubmittedQuery(query)
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by event, email mask, user id, path, or IP..."
            className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
          />

          <select
            value={level}
            onChange={(event) => {
              setLevel(event.target.value as 'all' | AuditLevel)
              setPage(1)
            }}
            className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary focus:outline-none focus:border-accent transition-colors duration-fast"
          >
            <option value="all">All levels</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>

          <button
            type="submit"
            className="h-11 px-4 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast"
          >
            Apply filters
          </button>
        </form>

        {submittedQuery && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSubmittedQuery('')
              setPage(1)
            }}
            className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors duration-fast"
          >
            Clear search
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-md border border-border bg-surface animate-pulse"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-md border border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
          No audit events match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <article
              key={event.id}
              className={`rounded-md border bg-surface p-4 space-y-3 ${
                isSecurityEvent(event.event)
                  ? 'border-amber-200'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wide ${levelStyles[event.level]}`}
                    >
                      {event.level}
                    </span>
                    <p className="text-sm font-bold text-text-primary break-words">
                      {event.event}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                    <span>{formatDateTime(event.created_at)}</span>
                    {event.actor_email && <span>{event.actor_email}</span>}
                    {event.actor_provider && (
                      <span className="capitalize">{event.actor_provider}</span>
                    )}
                    {event.actor_user_id && <span>{event.actor_user_id}</span>}
                  </div>
                </div>

                {event.session_id && (
                  <div className="rounded-sm bg-surfaceHigh px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                    Session {event.session_id.slice(0, 8)}
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-sm bg-surfaceHigh p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Request
                  </p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    {event.request_method ?? '—'}
                  </p>
                  <p className="mt-1 break-words text-xs text-text-secondary">
                    {event.request_path ?? 'No request path captured'}
                  </p>
                </div>

                <div className="rounded-sm bg-surfaceHigh p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Network
                  </p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    {event.ip_address ?? 'IP unavailable'}
                  </p>
                  <p className="mt-1 break-words text-xs text-text-secondary">
                    {event.user_agent ?? 'User agent unavailable'}
                  </p>
                </div>

                <div className="rounded-sm bg-surfaceHigh p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Actor
                  </p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    {event.actor_email ?? 'System or unknown'}
                  </p>
                  <p className="mt-1 break-words text-xs text-text-secondary">
                    {event.actor_user_id ?? 'No linked user id'}
                  </p>
                </div>
              </div>

              {Object.keys(event.metadata ?? {}).length > 0 && (
                <details className="rounded-sm border border-border bg-surfaceHigh">
                  <summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                    Event metadata
                  </summary>
                  <pre className="overflow-x-auto border-t border-border px-3 py-3 text-xs text-text-secondary">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3">
        <p className="text-xs text-text-muted">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page <= 1 || loading}
            className="h-9 px-3 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            disabled={page >= totalPages || loading}
            className="h-9 px-3 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
