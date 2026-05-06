'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AlertPlanStatus } from '@/components/alerts/AlertPlanStatus'
import { MarketplaceLeadFeed } from '@/components/market/MarketplaceLeadFeed'
import { WatchCompareCard } from '@/components/market/WatchCompareCard'
import { RetentionNextStepPanel } from '@/components/market/RetentionNextStepPanel'
import { PriceAlertButton } from '@/components/phone/PriceAlertButton'
import { Spinner } from '@/components/ui'
import { marketApi } from '@/lib/api'
import { requestWithBackendAuth } from '@/lib/backendAuth'
import { STORE_LABELS } from '@/lib/constants'
import { formatNaira, formatRelativeTime } from '@/lib/formatters'
import {
  getPrimaryCompareAction,
  getWatchBuyNowWaitHref,
  getWatchDecisionPlan,
  getWatchDetailHref,
  getWatchFocusedVariantLabel,
  getWatchUsedGuideHref,
  getWatchlistCompareSuggestions,
  isAlertRelevantToWatchItem,
  type WatchCompareAction,
} from '@/lib/watchDecision'
import type {
  MarketplaceLeadsResponse,
  AlertEntitlement,
  PriceAlert,
  WatchlistItem,
  WatchlistResponse,
  WatchlistSummary,
} from '@/types'

const summarizeWatchlist = (items: WatchlistItem[]): WatchlistSummary => {
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
}

const SUPPORT_LABELS = {
  strong: 'Strong support',
  good: 'Good support',
  limited: 'Limited support',
  expired: 'Support ending',
  unknown: 'Support unclear',
} as const

const REPAIR_LABELS = {
  strong: 'Repair friendly',
  fair: 'Repair mixed',
  weak: 'Repair risk',
  unknown: 'Repair unclear',
} as const

const RESALE_LABELS = {
  strong: 'Resale strong',
  fair: 'Resale fair',
  weak: 'Resale weak',
  unknown: 'Resale unclear',
} as const

const BADGE_TONES = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  caution: 'border-amber-200 bg-amber-50 text-amber-700',
  warning: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-border bg-surfaceHigh text-text-secondary',
} as const

const getOwnershipTone = (value: string) => {
  if (value === 'strong' || value === 'good' || value === 'fair') {
    return BADGE_TONES.positive
  }

  if (value === 'limited') {
    return BADGE_TONES.caution
  }

  if (value === 'weak' || value === 'expired') {
    return BADGE_TONES.warning
  }

  return BADGE_TONES.neutral
}

const getStoreLabel = (store: string | null | undefined) =>
  store ? STORE_LABELS[store] ?? store : 'any tracked store'

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
        item.alerts.nearest_target_price == null || alert.target_price <= item.alerts.nearest_target_price
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

const buildWatchNote = (item: WatchlistItem): string => {
  if (item.alerts.active_alert_count > 0 && (item.recent_drop_amount_ngn ?? 0) > 0) {
    return `Already protected by ${item.alerts.active_alert_count} active alert${item.alerts.active_alert_count === 1 ? '' : 's'}, and the phone has already moved cheaper recently.`
  }

  if (item.alerts.active_alert_count > 0 && item.alerts.nearest_target_price != null) {
    return `Protected by an active alert. The nearest target is ${formatNaira(item.alerts.nearest_target_price)} on ${getStoreLabel(item.alerts.nearest_alert_store)}.`
  }

  if ((item.recent_drop_amount_ngn ?? 0) > 0) {
    return 'This phone has already moved recently. If you are waiting for a cleaner entry, set an alert so you do not have to check it manually.'
  }

  return 'This phone is saved, but there is no active alert protecting it yet. If the price matters, set one here so the watchlist can actually work for you.'
}

export default function SavedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null)
  const [marketplaceLeads, setMarketplaceLeads] =
    useState<MarketplaceLeadsResponse | null>(null)
  const [entitlement, setEntitlement] = useState<AlertEntitlement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingPhoneId, setRemovingPhoneId] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (!session?.user?.id) {
      return
    }

    setLoading(true)
    setError(null)

    void marketApi
      .getMarketplaceLeads(6)
      .then((data) => setMarketplaceLeads(data))
      .catch(() => setMarketplaceLeads(null))

    Promise.all([
      requestWithBackendAuth<WatchlistResponse>('/watchlist/me'),
      requestWithBackendAuth<AlertEntitlement>('/billing/alerts/me/entitlement').catch(() => null),
    ])
      .then(([data, entitlementData]) => {
        setWatchlist(data)
        setEntitlement(entitlementData)
      })
      .catch((fetchError) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Could not load your watchlist right now.'
        )
      })
      .finally(() => setLoading(false))
  }, [router, session?.user?.id, status])

  const handleUnsave = async (phoneId: number) => {
    if (!watchlist) {
      return
    }

    const previous = watchlist
    const nextItems = previous.items.filter((item) => item.phone_id !== phoneId)

    setRemovingPhoneId(phoneId)
    setWatchlist({
      ...previous,
      items: nextItems,
      summary: summarizeWatchlist(nextItems),
    })

    try {
      await requestWithBackendAuth<null>(`/saved/me/${phoneId}`, {
        method: 'DELETE',
      })
    } catch (removeError) {
      setWatchlist(previous)
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Could not update your watchlist right now.'
      )
    } finally {
      setRemovingPhoneId(null)
    }
  }

  const handleAlertCreated = (alert: PriceAlert) => {
    setError(null)
    setWatchlist((previous) => applyCreatedAlertToWatchlist(previous, alert))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Spinner centered />
      </div>
    )
  }

  const items = watchlist?.items ?? []
  const summary = watchlist ? summarizeWatchlist(watchlist.items) : summarizeWatchlist([])
  const compareSuggestions = getWatchlistCompareSuggestions(items)
  const compareActionsByPhoneId = new Map(
    items.map((item) => [item.phone_id, getPrimaryCompareAction(item, items)])
  )

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section className="overflow-hidden rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-6 py-8 shadow-sm md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
              Retention hub
            </p>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                Your watchlist
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
                Saved phones, alert coverage, and recent market movement now live in one place. This is where Decide should help you come back, not start the research from zero again.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/phones"
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Browse phones
              </Link>
              <Link
                href="/alerts"
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                Manage alerts
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Saved" value={String(summary.saved_count)} />
            <SummaryCard label="Alert covered" value={String(summary.alert_covered_count)} />
            <SummaryCard label="Recently cheaper" value={String(summary.recently_cheaper_count)} />
            <SummaryCard label="Unprotected saved" value={String(summary.unprotected_count)} />
          </div>
        </div>
        <div className="mt-6">
          <AlertPlanStatus entitlement={entitlement} loading={loading && !entitlement} />
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {compareSuggestions.length > 0 ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Compare next
            </p>
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              Strong head-to-heads from your watchlist
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              These pairs are the clearest compare candidates from the phones you are already watching.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {compareSuggestions.map((suggestion) => (
              <WatchCompareCard
                key={`${suggestion.left.phone_id}-${suggestion.right.phone_id}`}
                suggestion={suggestion}
              />
            ))}
          </div>
        </section>
      ) : null}

      {marketplaceLeads?.offers.length ? (
        <MarketplaceLeadFeed
          offers={marketplaceLeads.offers}
          title="Jiji leads worth checking before you buy"
          description="These bargain leads stay separate from your trusted-store watchlist. Use them for discovery, then inspect the seller, device, and handoff before paying."
          compact
        />
      ) : null}

      {items.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl space-y-3">
            <p className="text-4xl" aria-hidden="true">
              {"\uD83E\uDD0D"}
            </p>
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              Your watchlist is empty
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              Save phones you care about first, then use alerts and Decide verdicts to stay disciplined while the market moves.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/phones"
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Browse phones
              </Link>
              <Link
                href="/deals/today"
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                Open deals today
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <WatchlistCard
              key={item.saved_entry_id}
              item={item}
              compareAction={compareActionsByPhoneId.get(item.phone_id) ?? null}
              removing={removingPhoneId === item.phone_id}
              onAlertCreated={handleAlertCreated}
              onRemove={() => void handleUnsave(item.phone_id)}
            />
          ))}
        </section>
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

interface WatchlistCardProps {
  item: WatchlistItem
  compareAction: WatchCompareAction | null
  removing: boolean
  onAlertCreated: (alert: PriceAlert) => void
  onRemove: () => void
}

const WatchlistCard = ({
  item,
  compareAction,
  removing,
  onAlertCreated,
  onRemove,
}: WatchlistCardProps) => {
  const decisionPlan = getWatchDecisionPlan(item)
  const detailHref = getWatchDetailHref(item)
  const focusedVariantLabel = getWatchFocusedVariantLabel(item)

  return (
  <article className="rounded-3xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
    <div className="space-y-5">
      <div className="flex gap-4">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-border bg-surfaceHigh">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.phone_name}
              width={96}
              height={96}
              className="h-24 w-24 object-contain"
            />
          ) : (
            <PhonePlaceholder />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              {item.brand_name}
            </p>
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              {item.phone_name}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {focusedVariantLabel ? (
              <FlagBadge tone="neutral">Tracking {focusedVariantLabel}</FlagBadge>
            ) : null}
            {item.alerts.active_alert_count > 0 ? (
              <FlagBadge tone="positive">
                {item.alerts.active_alert_count} active alert{item.alerts.active_alert_count === 1 ? '' : 's'}
              </FlagBadge>
            ) : (
              <FlagBadge tone="neutral">No active alert yet</FlagBadge>
            )}

            {(item.recent_drop_amount_ngn ?? 0) > 0 ? (
              <FlagBadge tone="caution">
                Recently cheaper by {formatNaira(item.recent_drop_amount_ngn!)}
              </FlagBadge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricBlock
          label="Current best tracked price"
          value={
            item.current_best_price_ngn != null
              ? formatNaira(item.current_best_price_ngn)
              : 'No price yet'
          }
          note={
            focusedVariantLabel
              ? item.freshest_price_at
                ? `${focusedVariantLabel} tracked ${formatRelativeTime(item.freshest_price_at)}`
                : `Waiting for tracked ${focusedVariantLabel} pricing`
              : item.freshest_price_at
                ? `Tracked ${formatRelativeTime(item.freshest_price_at)}`
                : 'Waiting for a tracked store price'
          }
        />
        <MetricBlock
          label="Watch status"
          value={item.alerts.active_alert_count > 0 ? 'Protected' : 'Watching only'}
          note={buildWatchNote(item)}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <SignalBadge
          label={SUPPORT_LABELS[item.ownership.support_outlook]}
          tone={getOwnershipTone(item.ownership.support_outlook)}
        />
        <SignalBadge
          label={REPAIR_LABELS[item.ownership.repair_outlook]}
          tone={getOwnershipTone(item.ownership.repair_outlook)}
        />
        <SignalBadge
          label={RESALE_LABELS[item.ownership.resale_outlook]}
          tone={getOwnershipTone(item.ownership.resale_outlook)}
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
          {item.alerts.active_alert_count > 0 ? (
            <Link
              href="/alerts"
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
          >
            Manage alerts
          </Link>
        ) : (
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
        )}
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {removing ? 'Removing...' : 'Remove'}
        </button>
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

interface MetricBlockProps {
  label: string
  value: string
  note: string
}

const MetricBlock = ({ label, value, note }: MetricBlockProps) => (
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

const FlagBadge = ({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: keyof typeof BADGE_TONES
}) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${BADGE_TONES[tone]}`}
  >
    {children}
  </span>
)

const SignalBadge = ({ label, tone }: { label: string; tone: string }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] ${tone}`}
  >
    {label}
  </span>
)

const PhonePlaceholder = () => (
  <div className="flex flex-col items-center gap-2 text-slate-300">
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="10" y="4" width="28" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="38" r="2" fill="currentColor" />
    </svg>
  </div>
)
