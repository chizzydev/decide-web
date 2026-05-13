import type { PriceVerdict } from '@/lib/priceVerdict'

interface PriceVerdictBadgeProps {
  verdict: PriceVerdict | null
  compact?: boolean
  className?: string
}

const TONE_CLASSES: Record<PriceVerdict['tone'], string> = {
  great: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  fair: 'border-accent/25 bg-tealTint text-accent',
  overpriced: 'border-red-200 bg-red-50 text-red-700',
}

export const PriceVerdictBadge = ({
  verdict,
  compact = false,
  className = '',
}: PriceVerdictBadgeProps) => {
  if (!verdict) {
    return null
  }

  return (
    <span
      className={[
        'inline-flex w-fit items-center justify-center rounded-full border font-bold uppercase tracking-[0.14em]',
        compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
        TONE_CLASSES[verdict.tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title={verdict.summary}
    >
      {verdict.label}
    </span>
  )
}
