import React from 'react'
import { formatNairaCompact } from '@/lib/formatters'

interface PriceChangeBadgeProps {
  amount_ngn: number | null
  percent?: number | null
  compact?: boolean
}

export const PriceChangeBadge = ({
  amount_ngn,
  percent,
  compact = false,
}: PriceChangeBadgeProps) => {
  if (amount_ngn === null || amount_ngn === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-surfaceHigh px-2.5 py-1 text-xs font-semibold text-text-muted">
        No change
      </span>
    )
  }

  const isDrop = amount_ngn > 0
  const toneClass = isDrop
    ? 'border-accent/15 bg-tealTint text-accent'
    : 'border-warning/20 bg-warning-subtle text-warning'
  const directionLabel = isDrop ? 'Down' : 'Up'
  const absAmount = Math.abs(amount_ngn)

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold',
        toneClass,
      ].join(' ')}
    >
      {compact
        ? `${directionLabel} ${percent ? `${Math.abs(percent)}%` : formatNairaCompact(absAmount)}`
        : `${directionLabel} ${formatNairaCompact(absAmount)}${percent ? ` (${Math.abs(percent)}%)` : ''}`}
    </span>
  )
}
