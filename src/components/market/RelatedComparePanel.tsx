import Link from 'next/link'
import type { PhoneCard } from '@/types'
import type { RelatedCompareAction } from '@/lib/relatedCompare'
import { formatNairaCompact } from '@/lib/formatters'
import { Card } from '@/components/ui'

interface RelatedComparePanelProps {
  phoneName: string
  actions: RelatedCompareAction<PhoneCard>[]
}

const getLowestTrackedPrice = (phone: PhoneCard) => {
  const prices = phone.prices
    .filter((price) => price.price_ngn > 0)
    .map((price) => price.price_ngn)

  if (prices.length === 0) {
    return null
  }

  return Math.min(...prices)
}

export const RelatedComparePanel = ({
  phoneName,
  actions,
}: RelatedComparePanelProps) => {
  if (actions.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-text-primary">
          Compare against likely alternatives
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
          If you are close to buying {phoneName}, these are the fastest head-to-heads to sanity-check before you commit.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {actions.map((action) => {
          const lowestTrackedPrice = getLowestTrackedPrice(action.counterpart)

          return (
            <Card
              key={action.href}
              className="flex h-full flex-col gap-4 border-borderHigh bg-surface"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  {action.counterpart.brand_name}
                </p>
                <h3 className="text-lg font-black tracking-tight text-text-primary">
                  {action.counterpart.name}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {action.reason ?? 'Open a direct head-to-head compare for this nearby alternative.'}
                </p>
                {action.compare_context ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                    {action.compare_context}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1 rounded-2xl border border-border bg-surfaceHigh px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  Current best tracked price
                </p>
                <p className="text-base font-bold text-text-primary">
                  {lowestTrackedPrice != null
                    ? formatNairaCompact(lowestTrackedPrice)
                    : 'Waiting for tracked price'}
                </p>
              </div>

              <Link
                href={action.href}
                className="inline-flex h-10 items-center justify-center rounded-md border border-accent/25 bg-tealTint px-4 text-sm font-black text-accent transition-colors duration-fast hover:border-accent/40 hover:bg-accent/10 hover:text-accent-hover"
              >
                Compare with {action.counterpart.name}
              </Link>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
