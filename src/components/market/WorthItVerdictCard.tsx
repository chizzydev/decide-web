import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui'
import { formatNairaCompact } from '@/lib/formatters'
import {
  buildBuyNowWaitHref,
  buildPhoneDetailHref,
  buildWorthItHref,
} from '@/lib/variantHref'
import type { StillWorthItResponse } from '@/types'
import { VerdictReasonList } from './VerdictReasonList'

interface WorthItVerdictCardProps {
  data: StillWorthItResponse
  compact?: boolean
  variantId?: number | null
}

const TONE_CLASS: Record<StillWorthItResponse['verdict']['tone'], string> = {
  positive: 'border-accent/15 bg-tealTint text-accent',
  neutral: 'border-border bg-surfaceHigh text-text-primary',
  warning: 'border-warning/20 bg-warning-subtle text-warning',
  negative: 'border-error/20 bg-error-subtle text-error',
}

export const WorthItVerdictCard = ({
  data,
  compact = false,
  variantId = null,
}: WorthItVerdictCardProps) => {
  const verdictHref = buildWorthItHref(data.phone.slug, { variantId })
  const buyNowWaitHref = buildBuyNowWaitHref(data.phone.slug, { variantId })
  const detailHref = buildPhoneDetailHref(data.phone.slug, { variantId })

  return (
    <Card className="overflow-hidden border-borderHigh bg-surface shadow-sm">
      <div className="border-b border-border bg-gradient-to-br from-tealTint via-surface to-surface px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Still worth it
            </p>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-text-primary">
                {data.verdict.headline}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
                {data.verdict.summary}
              </p>
            </div>
          </div>

          <div
            className={[
              'inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em]',
              TONE_CLASS[data.verdict.tone],
            ].join(' ')}
          >
            {data.verdict.label.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 md:px-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SignalStat
            label="Best current"
            value={
              data.price_signal.current_best_price_ngn != null
                ? formatNairaCompact(data.price_signal.current_best_price_ngn)
                : 'N/A'
            }
          />
          <SignalStat
            label="Years old"
            value={
              data.longevity_signal.years_since_release != null
                ? String(data.longevity_signal.years_since_release)
                : 'Unknown'
            }
          />
          <SignalStat
            label="Repair outlook"
            value={data.repair_support_signal.outlook}
          />
          <SignalStat
            label="Resale outlook"
            value={data.resale_value_signal.outlook}
          />
        </div>

        {!compact && (
          <div className="grid gap-6 lg:grid-cols-2">
            <VerdictReasonList title="Why it still works" items={data.reasons} tone="positive" />
            <VerdictReasonList title="Where it is aging" items={data.tradeoffs} tone="warning" />
          </div>
        )}

        {compact ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
            <p className="max-w-2xl">
              {data.longevity_signal.summary}
            </p>
            <Link
              href={verdictHref}
              className="font-semibold text-accent transition-colors duration-fast hover:text-accent-hover"
            >
              Read full verdict
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 rounded-2xl border border-border bg-surface px-4 py-4 lg:grid-cols-[1.35fr_1fr]">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Longevity read
              </p>
              <p className="text-sm leading-relaxed text-text-secondary">
                {data.longevity_signal.summary}
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-accent/15 bg-tealTint px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Next Decide move
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  Keep the phone inside Decide long enough to check the timing verdict or the full product context before you act on the current market price.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={buyNowWaitHref}
                  className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
                >
                  Read buy/wait
                </Link>
                <Link
                  href={detailHref}
                  className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                >
                  View phone detail
                </Link>
                <Link
                  href="/compare"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-accent/25 bg-tealTint px-4 text-sm font-black text-accent transition-colors duration-fast hover:border-accent/40 hover:bg-accent/10 hover:text-accent-hover"
                >
                  Compare phones
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

interface SignalStatProps {
  label: string
  value: string
}

const SignalStat = ({ label, value }: SignalStatProps) => (
  <div className="rounded-xl border border-border bg-surfaceHigh px-3 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold capitalize text-text-primary">{value}</p>
  </div>
)
