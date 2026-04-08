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
}

export default function AdminOverviewPage() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

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
