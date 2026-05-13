import Image from 'next/image'
import Link from 'next/link'
import type { BestAlternativeInsight } from '@/lib/bestAlternative'
import { formatNairaCompact } from '@/lib/formatters'
import { buildVersionedImageUrl } from '@/lib/imageUrl'

interface BestAlternativePanelProps {
  phoneName: string
  insight: BestAlternativeInsight | null
}

const hasRealImage = (url: string | null | undefined): boolean =>
  !!url && !url.includes('placeholder')

export const BestAlternativePanel = ({
  phoneName,
  insight,
}: BestAlternativePanelProps) => {
  if (!insight) {
    return null
  }

  const imageUrl = buildVersionedImageUrl(insight.phone.image_url, insight.phone.updated_at)

  return (
    <section className="overflow-hidden rounded-xl border border-borderHigh bg-surface shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              {insight.label}
            </p>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-text-primary">
                Before buying {phoneName}, check {insight.phone.name}
              </h2>
              <p className="text-sm font-bold text-accent">{insight.headline}</p>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                {insight.summary}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surfaceHigh px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                Alternative price
              </p>
              <p className="mt-1 text-xl font-black text-text-primary">
                {insight.priceNgN != null
                  ? formatNairaCompact(insight.priceNgN)
                  : 'Waiting for price'}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surfaceHigh px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                Current phone price
              </p>
              <p className="mt-1 text-xl font-black text-text-primary">
                {insight.basePriceNgN != null
                  ? formatNairaCompact(insight.basePriceNgN)
                  : 'Waiting for price'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                Why it deserves a look
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-text-secondary">
                {insight.reasons.map((reason) => (
                  <li key={reason} className="rounded-lg bg-tealTint px-3 py-2">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                Do not ignore
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-text-secondary">
                {insight.cautions.map((caution) => (
                  <li key={caution} className="rounded-lg bg-surfaceHigh px-3 py-2">
                    {caution}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {insight.compareContext ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {insight.compareContext}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href={insight.href}
              className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-black text-white transition-colors duration-fast hover:bg-accent-hover"
            >
              Compare both phones
            </Link>
            <Link
              href={insight.detailHref}
              className="inline-flex h-10 items-center justify-center rounded-md border border-borderHigh bg-surface px-4 text-sm font-black text-text-primary transition-colors duration-fast hover:bg-surfaceHigh"
            >
              View alternative
            </Link>
          </div>
        </div>

        <div className="flex min-h-64 items-center justify-center border-t border-border bg-gradient-to-br from-tealTint via-surfaceHigh to-surface p-6 lg:border-l lg:border-t-0">
          {hasRealImage(imageUrl) ? (
            <Image
              src={imageUrl!}
              alt={insight.phone.name}
              width={220}
              height={220}
              className="max-h-56 object-contain"
            />
          ) : (
            <div className="space-y-2 text-center">
              <p className="text-4xl font-black text-accent">
                {insight.phone.brand_name.slice(0, 1)}
              </p>
              <p className="text-sm font-bold text-text-secondary">{insight.phone.name}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
