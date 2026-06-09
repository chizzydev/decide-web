'use client'

// decide-web/src/app/admin/page.tsx

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { requestAdminJson } from '@/lib/adminApi'

interface Stats {
  total_users:        number
  total_reviews:      number
  total_phones:       number
  phones_with_prices: number
  flagged_reviews:    number
  phones_no_image:    number
  active_alerts:      number
  analytics?: AnalyticsOverview
}

interface AnalyticsOverview {
  online_now:       number
  visits_today:     number
  page_views_today: number
  actions_today:    number
  top_pages: Array<{
    path:  string
    count: number
  }>
  top_events: Array<{
    event_name: string
    count:      number
  }>
  top_referrers?: Array<{
    referrer: string
    count:    number
  }>
  top_landing_pages?: Array<{
    path:  string
    count: number
  }>
  top_utm_sources?: Array<{
    source: string
    count:  number
  }>
}

const EMPTY_ANALYTICS: AnalyticsOverview = {
  online_now: 0,
  visits_today: 0,
  page_views_today: 0,
  actions_today: 0,
  top_pages: [],
  top_events: [],
  top_referrers: [],
  top_landing_pages: [],
  top_utm_sources: [],
}

export default function AdminOverviewPage() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const analytics = stats?.analytics ?? EMPTY_ANALYTICS

  useEffect(() => {
    requestAdminJson<{ success: boolean; data: Stats }>('/stats')
      .then((json) => { if (json.success) setStats(json.data) })
      .finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { label: 'Total Users',         value: stats.total_users,        href: '/admin/users',   accent: false },
    { label: 'Total Reviews',       value: stats.total_reviews,      href: '/admin/reviews', accent: false },
    { label: 'Active Phones',       value: stats.total_phones,       href: '/admin/phones',  accent: false },
    { label: 'Phones with Prices',  value: stats.phones_with_prices, href: null,             accent: false },
    { label: 'Flagged Reviews',     value: stats.flagged_reviews,    href: '/admin/reviews?filter=flagged', accent: stats.flagged_reviews > 0 },
    { label: 'Phones Missing Image',value: stats.phones_no_image,    href: '/admin/phones',  accent: stats.phones_no_image > 0 },
    { label: 'Active Alerts',       value: stats.active_alerts,      href: '/admin/alerts',  accent: false },
  ] : []

  const analyticsCards = stats ? [
    { label: 'Active now', value: analytics.online_now, detail: 'Last 5 minutes' },
    { label: 'Visits today', value: analytics.visits_today, detail: 'Unique browser sessions' },
    { label: 'Page views today', value: analytics.page_views_today, detail: 'All first-party views' },
    { label: 'Actions today', value: analytics.actions_today, detail: 'Tracked product events' },
  ] : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Overview</h1>
        <p className="text-sm text-text-secondary mt-1">Your Decide dashboard at a glance.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-md p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map(({ label, value, href, accent }) => {
            const content = (
              <div className={[
                'bg-surface border rounded-md p-5 space-y-1 transition-colors duration-fast',
                accent ? 'border-amber-300 bg-amber-50' : 'border-border hover:border-borderHigh',
                href ? 'cursor-pointer' : '',
              ].join(' ')}>
                <p className="text-3xl font-black text-text-primary">{value.toLocaleString()}</p>
                <p className={`text-xs font-semibold ${accent ? 'text-amber-700' : 'text-text-muted'}`}>
                  {label}
                </p>
              </div>
            )
            return href ? (
              <Link key={label} href={href}>{content}</Link>
            ) : (
              <div key={label}>{content}</div>
            )
          })}
        </div>
      )}

      {stats ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Web Analytics</h2>
            <p className="text-sm text-text-secondary mt-1">
              First-party Decide traffic, collected without Vercel Analytics limits.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsCards.map((card) => (
              <div key={card.label} className="bg-surface border border-border rounded-md p-5 space-y-1">
                <p className="text-3xl font-black text-text-primary">{card.value.toLocaleString()}</p>
                <p className="text-xs font-semibold text-text-muted">{card.label}</p>
                <p className="text-[11px] text-text-muted">{card.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AnalyticsList
              title="Top pages"
              empty="No page views recorded in the last 24 hours."
              rows={analytics.top_pages.map((item) => ({
                label: item.path,
                count: item.count,
              }))}
            />
            <AnalyticsList
              title="Top events"
              empty="No events recorded in the last 24 hours."
              rows={analytics.top_events.map((item) => ({
                label: formatEventName(item.event_name),
                count: item.count,
              }))}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <AnalyticsList
              title="Top referrers"
              empty="No referrer data recorded in the last 24 hours."
              rows={(analytics.top_referrers ?? []).map((item) => ({
                label: item.referrer,
                count: item.count,
              }))}
            />
            <AnalyticsList
              title="Landing pages"
              empty="No landing pages recorded in the last 24 hours."
              rows={(analytics.top_landing_pages ?? []).map((item) => ({
                label: item.path,
                count: item.count,
              }))}
            />
            <AnalyticsList
              title="UTM sources"
              empty="No UTM sources recorded in the last 24 hours."
              rows={(analytics.top_utm_sources ?? []).map((item) => ({
                label: formatUtmSource(item.source),
                count: item.count,
              }))}
            />
          </div>
        </section>
      ) : null}

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/sync" className="h-9 px-4 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast inline-flex items-center">
            Trigger Price Sync
          </Link>
          <Link href="/admin/reviews?filter=flagged" className="h-9 px-4 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast inline-flex items-center">
            Review Flagged Content
          </Link>
          <Link href="/admin/phones" className="h-9 px-4 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast inline-flex items-center">
            Fix Missing Images
          </Link>
          <Link href="/admin/audit" className="h-9 px-4 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast inline-flex items-center">
            Open Audit Log
          </Link>
        </div>
      </div>
    </div>
  )
}

function formatEventName(eventName: string) {
  return eventName
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatUtmSource(source: string) {
  try {
    return decodeURIComponent(source.replace(/\+/g, ' '))
  } catch {
    return source
  }
}

interface AnalyticsListProps {
  title: string
  empty: string
  rows: Array<{
    label: string
    count: number
  }>
}

function AnalyticsList({ title, empty, rows }: AnalyticsListProps) {
  return (
    <div className="bg-surface border border-border rounded-md p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">24h</span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-text-muted">{empty}</p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <p className="min-w-0 truncate text-sm font-medium text-text-secondary" title={row.label}>
                {row.label}
              </p>
              <span className="shrink-0 rounded-full border border-border bg-surfaceHigh px-2.5 py-1 text-xs font-bold text-text-primary">
                {row.count.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
