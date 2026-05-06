'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AlertPlanStatus } from '@/components/alerts/AlertPlanStatus'
import { MarketplaceLeadFeed } from '@/components/market/MarketplaceLeadFeed'
import { WatchCompareCard } from '@/components/market/WatchCompareCard'
import { RetentionNextStepPanel } from '@/components/market/RetentionNextStepPanel'
import { PriceAlertButton } from '@/components/phone/PriceAlertButton'
import { marketApi } from '@/lib/api'
import { requestWithBackendAuth } from '@/lib/backendAuth'
import { STORE_LABELS } from '@/lib/constants'
import { formatNaira, formatRelativeTime } from '@/lib/formatters'
import {
  getActiveAlertDecisionPlan,
  getAlertDetailHref,
  getPrimaryCompareAction,
  getWatchBuyNowWaitHref,
  getWatchDetailHref,
  getWatchFocusedVariantLabel,
  getWatchDecisionPlan,
  getWatchUsedGuideHref,
  getWatchlistCompareSuggestions,
  getRelevantAlertsForWatchItem,
  isAlertRelevantToWatchItem,
  type WatchCompareAction,
} from '@/lib/watchDecision'
import { Button, Divider, Spinner } from '@/components/ui'
import type {
  MarketplaceLeadsResponse,
  AlertEntitlement,
  PriceAlert,
  WatchlistItem,
  WatchlistResponse,
} from '@/types'

const getStoreLabel = (store: string | null | undefined) =>
  store ? STORE_LABELS[store] ?? store : 'Any tracked store'

const applyCreatedAlertToWatchlist = (
  previous: WatchlistResponse | null,
  alert: PriceAlert
): WatchlistResponse | null => {
  if (!previous) {
    return previous
  }

  const targetItem = previous.items.find((item) => isAlertRelevantToWatchItem(item, alert))

  if (!targetItem) {
    return previous
  }

  const wasProtected = targetItem.alerts.active_alert_count > 0

  return {
    ...previous,
    items: previous.items.map((item) => {
      if (!isAlertRelevantToWatchItem(item, alert)) {
        return item
      }

      const nextNearestTarget =
        item.alerts.nearest_target_price == null
          ? alert.target_price
          : Math.min(item.alerts.nearest_target_price, alert.target_price)

      const nextNearestStore =
        item.alerts.nearest_target_price == null ||
        alert.target_price <= item.alerts.nearest_target_price
          ? alert.store
          : item.alerts.nearest_alert_store

      return {
        ...item,
        alerts: {
          active_alert_count: item.alerts.active_alert_count + 1,
          nearest_target_price: nextNearestTarget,
          nearest_alert_store: nextNearestStore,
        },
      }
    }),
    summary: {
      ...previous.summary,
      alert_covered_count: wasProtected
        ? previous.summary.alert_covered_count
        : previous.summary.alert_covered_count + 1,
      unprotected_count: wasProtected
        ? previous.summary.unprotected_count
        : Math.max(0, previous.summary.unprotected_count - 1),
    },
  }
}

export default function AlertsPage() {
  return (
    <Suspense fallback={<Spinner centered />}>
      <AlertsPageContent />
    </Suspense>
  )
}

function AlertsPageContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()

  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null)
  const [marketplaceLeads, setMarketplaceLeads] =
    useState<MarketplaceLeadsResponse | null>(null)
  const [entitlement, setEntitlement] = useState<AlertEntitlement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [alertData, watchlistData, marketplaceData, entitlementData] = await Promise.all([
        requestWithBackendAuth<PriceAlert[]>('/alerts/me'),
        requestWithBackendAuth<WatchlistResponse>('/watchlist/me'),
        marketApi.getMarketplaceLeads(6).catch(() => null),
        requestWithBackendAuth<AlertEntitlement>('/billing/alerts/me/entitlement').catch(() => null),
      ])
      setAlerts(alertData)
      setWatchlist(watchlistData)
      setMarketplaceLeads(marketplaceData)
      setEntitlement(entitlementData)
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

  useEffect(() => {
    const reference = searchParams?.get('reference')
    const upgrade = searchParams?.get('upgrade')

    if (!session?.user?.email || !reference || upgrade !== 'success') return

    let cancelled = false

    const verifyReturnedPayment = async () => {
      try {
        const result = await requestWithBackendAuth<{
          status: string
          entitlement: { plan: 'free' | 'premium'; label: string }
        }>(`/billing/alerts/premium/verify/${encodeURIComponent(reference)}`)

        if (cancelled) return

        if (result.entitlement.plan === 'premium') {
          setEntitlement({
            plan: 'premium',
            label: result.entitlement.label,
            max_active_alerts: 10,
            max_creations_per_24h: 20,
            min_seconds_between_creations: 60,
            marketplace_alerts_enabled: true,
            smart_nearby_alerts_enabled: true,
            max_smart_notifications_per_alert_per_week: 3,
            default_max_above_target_percent: 15,
          })
          setUpgradeNotice(
            'Alert Pro is active. Smart Nearby Alerts and Jiji leads are unlocked.'
          )
        } else {
          setUpgradeNotice(
            'Payment is not confirmed yet. Open the alert modal and refresh Pro status in a moment.'
          )
        }
      } catch (verifyError) {
        if (cancelled) return
        setError(
          verifyError instanceof Error
            ? verifyError.message
            : 'Could not verify Alert Pro payment.'
        )
      }
    }

    void verifyReturnedPayment()

    return () => {
      cancelled = true
    }
  }, [searchParams, session?.user?.email])

  const handleDelete = async (alertId: number) => {
    const deletedAlert = alerts.find((alert) => alert.id === alertId)

    try {
      await requestWithBackendAuth<null>(`/alerts/me/${alertId}`, {
        method: 'DELETE',
      })
      const remainingAlerts = alerts.filter((alert) => alert.id !== alertId)

      setAlerts(remainingAlerts)
      setWatchlist((previous) => {
        if (!previous || !deletedAlert) {
          return previous
        }

        const targetItem = previous.items.find(
          (item) => isAlertRelevantToWatchItem(item, deletedAlert)
        )

        if (!targetItem) {
          return previous
        }

        const phoneAlerts = getRelevantAlertsForWatchItem(targetItem, remainingAlerts)
        const nextNearestAlert = phoneAlerts.reduce<PriceAlert | null>(
          (nearest, alert) => {
            if (!nearest || alert.target_price < nearest.target_price) {
              return alert
            }

            return nearest
          },
          null
        )
        const wasProtected = targetItem.alerts.active_alert_count > 0
        const staysProtected = phoneAlerts.length > 0

        return {
          ...previous,
          items: previous.items.map((item) =>
            isAlertRelevantToWatchItem(item, deletedAlert)
              ? {
                  ...item,
                  alerts: {
                    active_alert_count: phoneAlerts.length,
                    nearest_target_price: nextNearestAlert?.target_price ?? null,
                    nearest_alert_store: nextNearestAlert?.store ?? null,
                  },
                }
              : item
          ),
          summary: {
            ...previous.summary,
            alert_covered_count:
              wasProtected && !staysProtected
                ? Math.max(0, previous.summary.alert_covered_count - 1)
                : previous.summary.alert_covered_count,
            unprotected_count:
              wasProtected && !staysProtected
                ? previous.summary.unprotected_count + 1
                : previous.summary.unprotected_count,
          },
        }
      })
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete alert. Please try again.'
      )
    }
  }

  const isLoggedIn = !!session?.user

  const smartSuggestions = useMemo(() => {
    return (watchlist?.items ?? [])
      .filter((item) => item.alerts.active_alert_count === 0)
      .sort((left, right) => {
        const dropDelta =
          (right.recent_drop_amount_ngn ?? 0) - (left.recent_drop_amount_ngn ?? 0)
        if (dropDelta !== 0) {
          return dropDelta
        }

        const leftPrice = left.current_best_price_ngn ?? Number.MAX_SAFE_INTEGER
        const rightPrice = right.current_best_price_ngn ?? Number.MAX_SAFE_INTEGER
        return leftPrice - rightPrice
      })
      .slice(0, 4)
  }, [watchlist])

  const watchlistSummary = useMemo(() => {
    const items = watchlist?.items ?? []
    const alertCoveredCount = items.filter(
      (item) => item.alerts.active_alert_count > 0
    ).length
    const recentlyCheaperCount = items.filter(
      (item) => (item.recent_drop_amount_ngn ?? 0) > 0
    ).length

    return {
      saved_count: items.length,
      alert_covered_count: alertCoveredCount,
      recently_cheaper_count: recentlyCheaperCount,
      unprotected_count: Math.max(0, items.length - alertCoveredCount),
    }
  }, [watchlist])

  const watchlistItemsByPhoneId = useMemo(
    () => new Map((watchlist?.items ?? []).map((item) => [item.phone_id, item])),
    [watchlist]
  )

  const allWatchCompareActionsByPhoneId = useMemo(
    () =>
      new Map(
        (watchlist?.items ?? []).map((item) => [
          item.phone_id,
          getPrimaryCompareAction(item, watchlist?.items ?? []),
        ])
      ),
    [watchlist]
  )

  const activeAlertItems = useMemo(
    () =>
      (watchlist?.items ?? []).filter((item) => item.alerts.active_alert_count > 0),
    [watchlist]
  )

  const alertsWithContext = useMemo(
    () =>
      alerts.map((alert) => ({
        alert,
        item: watchlistItemsByPhoneId.get(alert.phone_id) ?? null,
      })),
    [alerts, watchlistItemsByPhoneId]
  )

  const activeAlertCompareSuggestions = useMemo(
    () => getWatchlistCompareSuggestions(activeAlertItems),
    [activeAlertItems]
  )

  const activeAlertCompareActionsByPhoneId = useMemo(
    () =>
      new Map(
        activeAlertItems.map((item) => [
          item.phone_id,
          getPrimaryCompareAction(item, activeAlertItems),
        ])
      ),
    [activeAlertItems]
  )

  const handleAlertCreated = (alert: PriceAlert) => {
    setError(null)
    setAlerts((previous) => [alert, ...previous])
    setWatchlist((previous) => applyCreatedAlertToWatchlist(previous, alert))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <section className="overflow-hidden rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-6 py-8 shadow-sm md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
              Alert layer
            </p>
            <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                Price alerts
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
                Free alerts watch exact trusted-store targets. Alert Pro adds
                Jiji opt-in leads and Smart Nearby Alerts, so Decide can tell you
                when a better nearby option is worth checking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/saved"
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Open watchlist
              </Link>
              <Link
                href="/phones"
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                Browse phones
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Active alerts" value={String(alerts.length)} />
            <SummaryCard
              label="Watchlist"
              value={String(watchlistSummary.saved_count)}
            />
            <SummaryCard
              label="Unprotected saved"
              value={String(watchlistSummary.unprotected_count)}
            />
            <SummaryCard label="Alert Pro" value="N500 / 30d" />
          </div>
        </div>
        {isLoggedIn ? (
          <div className="mt-6">
            <AlertPlanStatus entitlement={entitlement} loading={loading && !entitlement} />
          </div>
        ) : null}
      </section>

      {!isLoggedIn && status !== 'loading' && (
        <div className="rounded-md border border-accent/20 bg-tealTint px-4 py-4">
          <p className="text-sm text-text-secondary">
            <Link
              href="/login"
              className="font-semibold text-accent transition-colors duration-fast hover:text-accent-hover"
            >
              Sign in
            </Link>{' '}
            to manage your Decide alerts securely. We no longer expose alert
            management by email alone.
          </p>
        </div>
      )}

      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {upgradeNotice ? (
        <div className="rounded-2xl border border-accent/20 bg-tealTint px-4 py-4 text-sm font-semibold text-accent">
          {upgradeNotice}
        </div>
      ) : null}

      <Divider />

      {status === 'loading' || loading ? (
        <Spinner centered />
      ) : !isLoggedIn ? (
        <div className="space-y-2 py-16 text-center">
          <p className="text-2xl" aria-hidden="true">
            {'\uD83D\uDD12'}
          </p>
          <p className="text-base font-semibold text-text-primary">
            Sign in to manage alerts
          </p>
          <p className="text-sm text-text-secondary">
            Your alert history now loads through your authenticated Decide account
            for better security.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-block text-sm font-semibold text-accent transition-colors duration-fast hover:text-accent-hover"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
              <div className="mx-auto max-w-xl space-y-3">
                <p className="text-2xl" aria-hidden="true">
                  {'\uD83D\uDD14'}
                </p>
                <p className="text-2xl font-black tracking-tight text-text-primary">
                  No alerts yet
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  You are still watching phones, but none of them are protected
                  yet. The best first alerts are usually the phones already sitting
                  in your watchlist.
                </p>
              </div>
            </div>
          ) : (
            <section className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Active alerts
                </p>
                <h2 className="text-2xl font-black tracking-tight text-text-primary">
                  Alert coverage you already have
                </h2>
              </div>

              <div className="space-y-3">
                {alertsWithContext.map(({ alert, item }) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    item={item}
                    compareAction={
                      item
                        ? activeAlertCompareActionsByPhoneId.get(item.phone_id) ?? null
                        : null
                    }
                    onDelete={() => void handleDelete(alert.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {activeAlertCompareSuggestions.length > 0 ? (
            <section className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Compare while protected
                </p>
                <h2 className="text-2xl font-black tracking-tight text-text-primary">
                  Finalists already covered by alerts
                </h2>
                <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                  These phones are already being watched live, which makes them the
                  best compare candidates before you react too quickly to a new
                  price move.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {activeAlertCompareSuggestions.map((suggestion) => (
                  <WatchCompareCard
                    key={`${suggestion.left.phone_id}-${suggestion.right.phone_id}`}
                    suggestion={suggestion}
                    eyebrow="Alerts in motion"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {marketplaceLeads?.offers.length ? (
            <MarketplaceLeadFeed
              offers={marketplaceLeads.offers}
              title="Marketplace leads for opt-in alerts"
              description="Jiji leads are deliberately separate from trusted Jumia/Slot alerts. Use this lane to spot cheaper marketplace candidates, then opt in only when you are comfortable watching a seller-led market."
              compact
            />
          ) : null}

          {smartSuggestions.length > 0 ? (
            <section className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Smart next alerts
                </p>
                <h2 className="text-2xl font-black tracking-tight text-text-primary">
                  Watchlist phones still missing protection
                </h2>
                <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                  These are the saved phones where an alert would add the most value
                  next, especially if the price has already started moving.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {smartSuggestions.map((item) => (
                  <AlertSuggestionCard
                    key={item.saved_entry_id}
                    item={item}
                    compareAction={
                      allWatchCompareActionsByPhoneId.get(item.phone_id) ?? null
                    }
                    onAlertCreated={handleAlertCreated}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: string
}

const SummaryCard = ({ label, value }: SummaryCardProps) => (
  <div className="rounded-2xl border border-accent/10 bg-white/80 px-3 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
  </div>
)

interface AlertCardProps {
  alert: PriceAlert
  item: WatchlistItem | null
  compareAction: WatchCompareAction | null
  onDelete: () => void
}

const AlertCard = ({ alert, item, compareAction, onDelete }: AlertCardProps) => {
  const decisionPlan = getActiveAlertDecisionPlan(item, alert)
  const currentPrice = alert.current_price_ngn ?? item?.current_best_price_ngn ?? null
  const freshestAt = alert.current_price_fresh_at ?? item?.freshest_price_at ?? null
  const focusedVariantLabel = alert.variant_label ?? (item ? getWatchFocusedVariantLabel(item) : null)
  const detailHref = item ? getWatchDetailHref(item) : getAlertDetailHref(alert)
  const targetReached = currentPrice != null && currentPrice <= alert.target_price
  const targetGap =
    currentPrice != null ? Math.max(0, currentPrice - alert.target_price) : null

  return (
    <article className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Active alert
            </p>
            <h3 className="text-xl font-black tracking-tight text-text-primary">
              {alert.phone_name}
            </h3>
            <p className="text-sm text-text-secondary">
              Alert when price drops below{' '}
              <span className="font-semibold text-accent">
                {formatNaira(alert.target_price)}
              </span>{' '}
              on {getStoreLabel(alert.store)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
              {focusedVariantLabel ? (
              <AlertFlag tone="neutral">Alert on {focusedVariantLabel}</AlertFlag>
            ) : null}
            <AlertFlag tone={targetReached ? 'positive' : 'neutral'}>
              {targetReached ? 'Target reached' : 'Watching target'}
            </AlertFlag>
            {item && (item.recent_drop_amount_ngn ?? 0) > 0 ? (
              <AlertFlag tone="caution">
                Recently cheaper by {formatNaira(item.recent_drop_amount_ngn!)}
              </AlertFlag>
            ) : null}
            {alert.nearby_deals_enabled ? (
              <AlertFlag tone="positive">Smart Nearby on</AlertFlag>
            ) : null}
            {alert.marketplace_alerts_enabled || alert.store === 'jiji' ? (
              <AlertFlag tone="caution">Jiji opt-in</AlertFlag>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <AlertMetricBlock
            label="Current tracked price"
            value={currentPrice != null ? formatNaira(currentPrice) : 'No price yet'}
            note={
              focusedVariantLabel
                ? freshestAt
                  ? `${focusedVariantLabel} tracked ${formatRelativeTime(freshestAt)}`
                  : `Waiting for tracked ${focusedVariantLabel} pricing`
                : freshestAt
                  ? `Tracked ${formatRelativeTime(freshestAt)}`
                  : 'Waiting for a fresh tracked store price'
            }
          />
          <AlertMetricBlock
            label="Target price"
            value={formatNaira(alert.target_price)}
            note={`Watching ${getStoreLabel(alert.store)}`}
          />
          <AlertMetricBlock
            label="Target gap"
            value={
              targetReached
                ? 'In range'
                : targetGap != null
                  ? formatNaira(targetGap)
                  : 'Unknown'
            }
            note={
              targetReached
                ? 'Current tracked price is already at or below target.'
                : targetGap != null
                  ? 'Amount still above your alert target.'
                  : 'Need a fresh tracked price to measure the gap.'
            }
          />
        </div>

        <RetentionNextStepPanel
          title={decisionPlan.title}
          description={decisionPlan.description}
          href={decisionPlan.href}
          label={decisionPlan.label}
          tone={decisionPlan.tone}
        />

        <div className="flex flex-wrap gap-3">
          <Link
            href={detailHref}
            className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
          >
            View phone
          </Link>
          {item ? (
            <Link
              href={getWatchBuyNowWaitHref(item)}
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Read buy or wait
            </Link>
          ) : null}
          {item ? (
            <Link
              href={compareAction?.href ?? '/compare'}
              title={
                compareAction
                  ? compareAction.context ??
                    `Compare ${item.phone_name} with ${compareAction.counterpart.phone_name}`
                  : undefined
              }
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              {compareAction ? 'Compare finalists' : 'Compare phones'}
            </Link>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            aria-label={`Delete alert for ${alert.phone_name}`}
          >
            Remove
          </Button>
        </div>
        {compareAction?.context ? (
          <p className="text-xs leading-relaxed text-text-muted">
            {compareAction.context}
          </p>
        ) : null}
      </div>
    </article>
  )
}

const AlertMetricBlock = ({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) => (
  <div className="rounded-2xl border border-border bg-surfaceHigh px-4 py-4">
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p className="text-lg font-black tracking-tight text-text-primary">{value}</p>
      <p className="text-xs leading-relaxed text-text-secondary">{note}</p>
    </div>
  </div>
)

const ALERT_BADGE_TONES = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  caution: 'border-amber-200 bg-amber-50 text-amber-700',
  neutral: 'border-border bg-surfaceHigh text-text-secondary',
} as const

const AlertFlag = ({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: keyof typeof ALERT_BADGE_TONES
}) => (
  <span
    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${ALERT_BADGE_TONES[tone]}`}
  >
    {children}
  </span>
)

const AlertSuggestionCard = ({
  item,
  compareAction,
  onAlertCreated,
}: {
  item: WatchlistItem
  compareAction: WatchCompareAction | null
  onAlertCreated: (alert: PriceAlert) => void
}) => {
  const decisionPlan = getWatchDecisionPlan(item)
  const focusedVariantLabel = getWatchFocusedVariantLabel(item)

  return (
    <article className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            {item.brand_name}
          </p>
          <h3 className="text-xl font-black tracking-tight text-text-primary">
            {item.phone_name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {focusedVariantLabel ? (
            <span className="inline-flex rounded-full border border-border bg-surfaceHigh px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
              Tracking {focusedVariantLabel}
            </span>
          ) : null}
          {(item.recent_drop_amount_ngn ?? 0) > 0 ? (
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">
              Recently cheaper by {formatNaira(item.recent_drop_amount_ngn!)}
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-border bg-surfaceHigh px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
              Watching only
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">
            {item.current_best_price_ngn != null
              ? `Tracked from ${formatNaira(item.current_best_price_ngn)}`
              : 'Waiting for a fresh tracked price'}
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            {(item.recent_drop_amount_ngn ?? 0) > 0
              ? `This phone has already moved on ${getStoreLabel(item.recent_drop_store)}. If you still want a lower entry, set an alert now instead of checking manually.`
              : 'This phone is saved but still uncovered. Adding an alert is the cleanest way to make the watchlist actually useful.'}
          </p>
        </div>

        <RetentionNextStepPanel
          title={decisionPlan.title}
          description={decisionPlan.description}
          href={decisionPlan.href}
          label={decisionPlan.label}
          tone={decisionPlan.tone}
        />

        <div className="flex flex-wrap gap-3">
          <PriceAlertButton
            phoneId={item.phone_id}
            phoneName={item.phone_name}
            variantId={item.focused_variant?.id ?? null}
            variantLabel={item.focused_variant?.label ?? null}
            lowestPrice={item.current_best_price_ngn ?? undefined}
            buttonLabel="Set alert"
            triggerVariant="inlinePrimary"
            onSuccess={onAlertCreated}
          />
          <Link
            href={getWatchBuyNowWaitHref(item)}
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
          >
            Read buy or wait
          </Link>
          <Link
            href={getWatchUsedGuideHref(item)}
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
          >
            Used guide
          </Link>
          {compareAction ? (
            <Link
              href={compareAction.href}
              title={
                compareAction.context ??
                `Compare ${item.phone_name} with ${compareAction.counterpart.phone_name}`
              }
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Compare finalists
            </Link>
          ) : null}
        </div>
        {compareAction?.context ? (
          <p className="text-xs leading-relaxed text-text-muted">
            {compareAction.context}
          </p>
        ) : null}
      </div>
    </article>
  )
}
