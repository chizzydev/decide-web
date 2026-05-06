import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui'
import { formatNairaCompact } from '@/lib/formatters'
import {
  buildBuyNowWaitHref,
  buildPhoneDetailHref,
  buildWorthItHref,
} from '@/lib/variantHref'
import type { BuyNowWaitResponse } from '@/types'
import { PriceChangeBadge } from './PriceChangeBadge'
import { VerdictReasonList } from './VerdictReasonList'

interface BuyNowWaitCardProps {
  data: BuyNowWaitResponse
  compact?: boolean
  variantId?: number | null
}

const TONE_CLASS: Record<BuyNowWaitResponse['verdict']['tone'], string> = {
  positive: 'border-accent/15 bg-tealTint text-accent',
  neutral: 'border-border bg-surfaceHigh text-text-primary',
  warning: 'border-warning/20 bg-warning-subtle text-warning',
  negative: 'border-error/20 bg-error-subtle text-error',
}

export const BuyNowWaitCard = ({
  data,
  compact = false,
  variantId = null,
}: BuyNowWaitCardProps) => {
  const verdictHref = buildBuyNowWaitHref(data.phone.slug, { variantId })
  const worthItHref = buildWorthItHref(data.phone.slug, { variantId })
  const detailHref = buildPhoneDetailHref(data.phone.slug, { variantId })

  return (
    <Card className="overflow-hidden border-borderHigh bg-surface shadow-sm">
      <div className="border-b border-border bg-gradient-to-br from-tealTint via-surface to-surface px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Buy now or wait
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
            label="Best trusted"
            value={
              data.price_signal.current_best_price_ngn != null
                ? formatNairaCompact(data.price_signal.current_best_price_ngn)
                : 'N/A'
            }
          />
          <SignalStat
            label="Trusted position"
            value={data.price_signal.price_position.replace(/_/g, ' ')}
          />
          <SignalStat
            label="Support outlook"
            value={data.longevity_signal.support_outlook}
          />
          <div className="rounded-xl border border-border bg-surfaceHigh px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Trusted-store move
            </p>
            <div className="mt-2">
              <PriceChangeBadge
                amount_ngn={data.price_signal.strongest_recent_drop_ngn}
                percent={data.price_signal.strongest_recent_drop_percent}
                compact
              />
            </div>
          </div>
        </div>

        {!compact && (
          <div className="grid gap-6 lg:grid-cols-2">
            <VerdictReasonList title="Why Decide likes it" items={data.reasons} tone="positive" />
            <VerdictReasonList title="What to watch" items={data.tradeoffs} tone="warning" />
          </div>
        )}

        {compact ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
            <p className="max-w-2xl">
              {data.price_signal.summary}
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
                Price read
              </p>
              <p className="text-sm leading-relaxed text-text-secondary">
                {data.price_signal.summary}
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-accent/15 bg-tealTint px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Next Decide move
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  Before you leave Decide for any store, do one more trust check against the longer-term read or the full phone context.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={worthItHref}
                  className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
                >
                  Check still worth it
                </Link>
                <Link
                  href={detailHref}
                  className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                >
                  View phone detail
                </Link>
                <Link
                  href="/compare"
                  className="text-sm font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
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
