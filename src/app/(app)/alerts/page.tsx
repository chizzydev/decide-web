'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { requestWithBackendAuth } from '@/lib/backendAuth'
import { Button, Divider, Spinner } from '@/components/ui'
import { formatNaira } from '@/lib/formatters'
import { STORE_LABELS } from '@/lib/constants'
import type { PriceAlert } from '@/types'

export default function AlertsPage() {
  const { data: session, status } = useSession()

  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await requestWithBackendAuth<PriceAlert[]>('/alerts/me')
      setAlerts(data)
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Could not load alerts. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.email) {
      void fetchAlerts()
    }
  }, [fetchAlerts, session])

  const handleDelete = async (alertId: number) => {
    try {
      await requestWithBackendAuth<null>(`/alerts/me/${alertId}`, {
        method: 'DELETE',
      })
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete alert. Please try again.'
      )
    }
  }

  const isLoggedIn = !!session?.user

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          Price Alerts
        </h1>
        <p className="text-base text-text-secondary">
          {isLoggedIn
            ? `Alerts for ${session.user.email}`
            : 'Sign in to manage your Decide alerts securely.'}
        </p>
      </div>

      {!isLoggedIn && status !== 'loading' && (
        <div className="bg-tealTint border border-accent/20 rounded-md px-4 py-4">
          <p className="text-sm text-text-secondary">
            <Link
              href="/login"
              className="text-accent font-semibold hover:text-accent-hover transition-colors duration-fast"
            >
              Sign in
            </Link>
            {' '}to view and remove your alerts. We no longer expose alert management by email alone.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <Divider />

      {status === 'loading' || loading ? (
        <Spinner centered />
      ) : !isLoggedIn ? (
        <div className="py-16 text-center space-y-2">
          <p className="text-2xl" aria-hidden="true">{"\uD83D\uDD12"}</p>
          <p className="text-base font-semibold text-text-primary">Sign in to manage alerts</p>
          <p className="text-sm text-text-secondary">
            Your alert history now loads through your authenticated Decide account for better security.
          </p>
          <Link
            href="/login"
            className="inline-block mt-2 text-sm text-accent font-semibold hover:text-accent-hover transition-colors duration-fast"
          >
            Go to sign in →
          </Link>
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <p className="text-2xl" aria-hidden="true">{"\uD83D\uDD14"}</p>
          <p className="text-base font-semibold text-text-primary">No alerts yet</p>
          <p className="text-sm text-text-secondary">
            Browse phones and set a target price to get notified when it drops.
          </p>
          <Link
            href="/phones"
            className="inline-block mt-2 text-sm text-accent font-semibold hover:text-accent-hover transition-colors duration-fast"
          >
            Browse phones →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            {alerts.length} active alert{alerts.length === 1 ? '' : 's'}
          </p>
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDelete={() => void handleDelete(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface AlertCardProps {
  alert: PriceAlert
  onDelete: () => void
}

const AlertCard = ({ alert, onDelete }: AlertCardProps) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3 bg-surface border border-border rounded-md">
    <div className="space-y-0.5 min-w-0">
      <p className="text-sm font-bold text-text-primary truncate">
        {alert.phone_name}
      </p>
      <p className="text-xs text-text-secondary">
        Alert when price drops below{' '}
        <span className="font-semibold text-accent">
          {formatNaira(alert.target_price)}
        </span>
        {alert.store && <> on {STORE_LABELS[alert.store]}</>}
      </p>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={onDelete}
      aria-label={`Delete alert for ${alert.phone_name}`}
    >
      Remove
    </Button>
  </div>
)
