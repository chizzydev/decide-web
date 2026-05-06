import Link from 'next/link'
import { formatNaira } from '@/lib/formatters'
import type { WatchCompareSuggestion } from '@/lib/watchDecision'

interface WatchCompareCardProps {
  suggestion: WatchCompareSuggestion
  eyebrow?: string
}

export const WatchCompareCard = ({
  suggestion,
  eyebrow = 'Watchlist finalists',
}: WatchCompareCardProps) => (
  <article className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <h3 className="text-xl font-black tracking-tight text-text-primary">
          {suggestion.left.phone_name} vs {suggestion.right.phone_name}
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {suggestion.reason}
        </p>
        {suggestion.compare_context ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            {suggestion.compare_context}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <WatchComparePhoneBlock item={suggestion.left} />
        <WatchComparePhoneBlock item={suggestion.right} />
      </div>

      <Link
        href={suggestion.href}
        className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        Open comparison
      </Link>
    </div>
  </article>
)

const WatchComparePhoneBlock = ({
  item,
}: {
  item: WatchCompareSuggestion['left']
}) => (
  <div className="rounded-2xl border border-border bg-surfaceHigh px-4 py-4">
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {item.brand_name}
      </p>
      <h4 className="text-sm font-bold text-text-primary">{item.phone_name}</h4>
      {item.focused_variant?.label ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          {item.focused_variant.label}
        </p>
      ) : null}
      <p className="text-sm text-text-secondary">
        {item.current_best_price_ngn != null
          ? formatNaira(item.current_best_price_ngn)
          : 'Waiting for tracked price'}
      </p>
    </div>
  </div>
)
