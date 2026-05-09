import type React from 'react'
import type { AlertEntitlement } from '@/types'

interface AlertPlanStatusProps {
  entitlement: AlertEntitlement | null
  loading?: boolean
}

const ALERT_PRO_PRICE_LABEL = 'N500 / 30d'

export const AlertPlanStatus = ({ entitlement, loading = false }: AlertPlanStatusProps) => {
  const isPro = entitlement?.plan === 'premium'

  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        isPro
          ? 'border-accent/25 bg-tealTint'
          : 'border-border bg-surfaceHigh'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
            Alert plan
          </p>
          <h3 className="text-lg font-black tracking-tight text-text-primary">
            {loading
              ? 'Checking your alert plan'
              : isPro
                ? 'Alert Pro active'
                : 'Free Launch active'}
          </h3>
          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
            {isPro
              ? 'Smart Nearby Alerts and optional Jiji marketplace leads are unlocked for your account.'
              : `Free keeps one exact trusted-store alert. Alert Pro is ${ALERT_PRO_PRICE_LABEL} and can be started from any alert setup to unlock Smart Nearby and Jiji leads.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PlanBadge tone={isPro ? 'positive' : 'neutral'}>
            {isPro ? 'Pro plan' : 'Free plan'}
          </PlanBadge>
          <PlanBadge tone="neutral">
            {entitlement
              ? `${entitlement.max_active_alerts} active ${
                  entitlement.max_active_alerts === 1 ? 'alert' : 'alerts'
                }`
              : '1 active alert'}
          </PlanBadge>
          {!isPro ? <PlanBadge tone="neutral">Pro {ALERT_PRO_PRICE_LABEL}</PlanBadge> : null}
          {isPro ? <PlanBadge tone="positive">Jiji unlocked</PlanBadge> : null}
          {isPro ? <PlanBadge tone="positive">Smart Nearby on</PlanBadge> : null}
        </div>
      </div>
    </div>
  )
}

const BADGE_TONES = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  neutral: 'border-border bg-white text-text-secondary',
} as const

const PlanBadge = ({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: keyof typeof BADGE_TONES
}) => (
  <span
    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${BADGE_TONES[tone]}`}
  >
    {children}
  </span>
)
