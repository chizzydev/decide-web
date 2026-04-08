'use client'

// decide-web/src/app/admin/alerts/page.tsx

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatNaira } from '@/lib/formatters'
import { requestAdminJson } from '@/lib/adminApi'

interface AdminAlert {
  id:          number
  phone_id:    number
  phone_name:  string
  phone_slug:  string
  email:       string
  target_price: number
  store:       string | null
  created_at:  string
}

export default function AdminAlertsPage() {
  const [alerts,  setAlerts]  = useState<AdminAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    requestAdminJson<{ success: boolean; data: AdminAlert[] }>('/alerts')
      .then((json) => { if (json.success) setAlerts(json.data) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = alerts.filter((a) =>
    !search ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.phone_name.toLowerCase().includes(search.toLowerCase())
  )

  // Group by phone for summary
  const byPhone = alerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.phone_name] = (acc[a.phone_name] ?? 0) + 1
    return acc
  }, {})

  const topPhones = Object.entries(byPhone)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Price Alerts</h1>
        <p className="text-sm text-text-secondary mt-1">
          {loading ? '...' : `${alerts.length} active alert${alerts.length !== 1 ? 's' : ''} across all users`}
        </p>
      </div>

      {/* Top phones by alert count */}
      {topPhones.length > 0 && (
        <div className="bg-surface border border-border rounded-md p-4 space-y-3">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wide">Most Wanted Phones</p>
          <div className="space-y-2">
            {topPhones.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between gap-3">
                <p className="text-sm text-text-primary font-medium truncate">{name}</p>
                <span className="text-xs font-bold text-accent shrink-0">{count} alert{count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email or phone name..."
        className="w-full max-w-sm px-3 py-2 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
      />

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-surface border border-border rounded-md animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-text-muted py-8 text-center">No alerts found.</p>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surfaceHigh">
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Target</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide hidden lg:table-cell">Store</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide hidden lg:table-cell">Set on</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert, i) => (
                <tr key={alert.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surfaceHigh/40'}`}>
                  <td className="px-4 py-3">
                    <Link href={`/phones/${alert.phone_slug}`} className="font-semibold text-accent hover:underline text-sm">
                      {alert.phone_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-text-secondary">{alert.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-text-primary">{formatNaira(alert.target_price)}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-text-secondary capitalize">{alert.store ?? 'Any'}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-text-muted">
                      {new Date(alert.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
