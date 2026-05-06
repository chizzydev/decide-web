import type {
  RepairSupportOutlook,
  ResaleOutlook,
  SupportOutlook,
} from '@/types'

interface OwnershipSignalPanelProps {
  phoneName: string
  yearsSinceRelease?: number | null
  estimatedYearsOfSupportLeft?: number | null
  support: {
    outlook: SupportOutlook
    summary: string
  }
  repair: {
    outlook: RepairSupportOutlook
    summary: string
  }
  resale: {
    outlook: ResaleOutlook
    summary: string
  }
}

const SUPPORT_LABELS: Record<SupportOutlook, string> = {
  strong: 'Strong support runway',
  good: 'Healthy support runway',
  limited: 'Limited support runway',
  expired: 'Support window is near the end',
  unknown: 'Support visibility is limited',
}

const REPAIR_LABELS: Record<RepairSupportOutlook, string> = {
  strong: 'Repair outlook is strong',
  fair: 'Repair outlook is mixed',
  weak: 'Repair outlook is weak',
  unknown: 'Repair outlook is still unclear',
}

const RESALE_LABELS: Record<ResaleOutlook, string> = {
  strong: 'Resale confidence is strong',
  fair: 'Resale confidence is mixed',
  weak: 'Resale confidence is weak',
  unknown: 'Resale confidence is still unclear',
}

const TONE_CLASSES = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  caution: 'border-amber-200 bg-amber-50 text-amber-700',
  warning: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-border bg-surfaceHigh text-text-secondary',
}

const getSupportTone = (outlook: SupportOutlook) => {
  if (outlook === 'strong' || outlook === 'good') {
    return TONE_CLASSES.positive
  }

  if (outlook === 'limited') {
    return TONE_CLASSES.caution
  }

  if (outlook === 'expired') {
    return TONE_CLASSES.warning
  }

  return TONE_CLASSES.neutral
}

const getRepairTone = (outlook: RepairSupportOutlook) => {
  if (outlook === 'strong') {
    return TONE_CLASSES.positive
  }

  if (outlook === 'fair') {
    return TONE_CLASSES.caution
  }

  if (outlook === 'weak') {
    return TONE_CLASSES.warning
  }

  return TONE_CLASSES.neutral
}

const getResaleTone = (outlook: ResaleOutlook) => {
  if (outlook === 'strong') {
    return TONE_CLASSES.positive
  }

  if (outlook === 'fair') {
    return TONE_CLASSES.caution
  }

  if (outlook === 'weak') {
    return TONE_CLASSES.warning
  }

  return TONE_CLASSES.neutral
}

export const OwnershipSignalPanel = ({
  phoneName,
  yearsSinceRelease,
  estimatedYearsOfSupportLeft,
  support,
  repair,
  resale,
}: OwnershipSignalPanelProps) => (
  <section className="rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-5 py-5 shadow-sm md:px-6 md:py-6">
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Ownership signals
          </p>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              What {phoneName} looks like after the first week
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              Specs and live price are only the first layer. These signals bring support runway,
              repair reality, and resale confidence into the actual buying decision.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
          {yearsSinceRelease != null ? (
            <StatChip label="Years old" value={String(yearsSinceRelease)} />
          ) : null}
          {estimatedYearsOfSupportLeft != null ? (
            <StatChip
              label="Support left"
              value={`${estimatedYearsOfSupportLeft} yr${estimatedYearsOfSupportLeft === 1 ? '' : 's'}`}
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <OwnershipCard
          eyebrow="Support runway"
          title={SUPPORT_LABELS[support.outlook]}
          summary={support.summary}
          badgeTone={getSupportTone(support.outlook)}
        />
        <OwnershipCard
          eyebrow="Repair reality"
          title={REPAIR_LABELS[repair.outlook]}
          summary={repair.summary}
          badgeTone={getRepairTone(repair.outlook)}
        />
        <OwnershipCard
          eyebrow="Resale confidence"
          title={RESALE_LABELS[resale.outlook]}
          summary={resale.summary}
          badgeTone={getResaleTone(resale.outlook)}
        />
      </div>
    </div>
  </section>
)

interface StatChipProps {
  label: string
  value: string
}

const StatChip = ({ label, value }: StatChipProps) => (
  <div className="rounded-full border border-accent/15 bg-white/80 px-3 py-1.5">
    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
      {label}
    </span>{' '}
    <span className="text-sm font-bold text-text-primary">{value}</span>
  </div>
)

interface OwnershipCardProps {
  eyebrow: string
  title: string
  summary: string
  badgeTone: string
}

const OwnershipCard = ({
  eyebrow,
  title,
  summary,
  badgeTone,
}: OwnershipCardProps) => (
  <article className="rounded-2xl border border-borderHigh bg-surface px-4 py-4 shadow-sm">
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${badgeTone}`}
        >
          {title}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{summary}</p>
    </div>
  </article>
)
