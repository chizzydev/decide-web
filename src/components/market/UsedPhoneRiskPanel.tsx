import { Badge } from '@/components/ui'
import type { UsedPhoneRiskIndicator, UsedPhoneRiskTone } from '@/lib/usedPhoneRisk'

interface UsedPhoneRiskPanelProps {
  title?: string
  description?: string
  indicators: UsedPhoneRiskIndicator[]
}

const BADGE_VARIANTS: Record<UsedPhoneRiskTone, 'error' | 'warning' | 'accent' | 'success'> = {
  danger: 'error',
  caution: 'warning',
  watch: 'accent',
  safer: 'success',
}

const TONE_LABELS: Record<UsedPhoneRiskTone, string> = {
  danger: 'High risk',
  caution: 'Verify hard',
  watch: 'Watch closely',
  safer: 'Lower risk',
}

export const UsedPhoneRiskPanel = ({
  title = 'Scam and risk indicators',
  description = 'These are the warning signals Decide wants you to check before a seller gets your money.',
  indicators,
}: UsedPhoneRiskPanelProps) => {
  if (indicators.length === 0) {
    return null
  }

  return (
    <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Used-phone trust
          </p>
          <h2 className="text-xl font-black tracking-tight text-text-primary">
            {title}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {indicators.map((indicator) => (
            <article
              key={indicator.title}
              className="rounded-xl border border-border bg-surfaceHigh px-4 py-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-base font-black tracking-tight text-text-primary">
                    {indicator.title}
                  </h3>
                  <Badge variant={BADGE_VARIANTS[indicator.tone]}>
                    {TONE_LABELS[indicator.tone]}
                  </Badge>
                </div>

                <p className="text-sm leading-relaxed text-text-secondary">
                  {indicator.summary}
                </p>

                <ul className="space-y-1.5 text-xs leading-relaxed text-text-secondary">
                  {indicator.checks.map((check) => (
                    <li key={check} className="flex gap-2">
                      <span className="mt-0.5 font-bold text-accent">-</span>
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
