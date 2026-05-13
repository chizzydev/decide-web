import { Badge } from '@/components/ui'
import type { MarketConfidence } from '@/lib/marketConfidence'

interface MarketConfidencePanelProps {
  confidence: MarketConfidence | null
  compact?: boolean
}

const BADGE_VARIANTS: Record<MarketConfidence['tone'], 'success' | 'accent' | 'warning' | 'error'> = {
  strong: 'success',
  steady: 'accent',
  caution: 'warning',
  weak: 'error',
}

export const MarketConfidencePanel = ({
  confidence,
  compact = false,
}: MarketConfidencePanelProps) => {
  if (!confidence) {
    return null
  }

  if (compact) {
    return (
      <Badge
        variant={BADGE_VARIANTS[confidence.tone]}
        className="px-1.5 py-0 text-[10px] tracking-[0.12em]"
      >
        {confidence.label}
      </Badge>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surfaceHigh px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
            Market confidence
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={BADGE_VARIANTS[confidence.tone]}>
              {confidence.label}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {confidence.summary}
          </p>
        </div>

        <div className="grid min-w-48 gap-2 sm:grid-cols-3 lg:min-w-0">
          {confidence.signals.map((signal) => (
            <div
              key={signal.label}
              className="rounded-lg border border-border bg-surface px-3 py-2"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                {signal.label}
              </p>
              <p className="mt-0.5 text-xs font-bold text-text-primary">
                {signal.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
