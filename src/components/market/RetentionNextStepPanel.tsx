import React from 'react'
import Link from 'next/link'
import type { WatchDecisionTone } from '@/lib/watchDecision'

interface RetentionNextStepPanelProps {
  title: string
  description: string
  href: string
  label: string
  tone: WatchDecisionTone
}

const TONE_CLASSES: Record<WatchDecisionTone, string> = {
  accent: 'border-accent/15 bg-tealTint',
  warning: 'border-amber-200 bg-amber-50',
  neutral: 'border-border bg-surfaceHigh',
}

export const RetentionNextStepPanel = ({
  title,
  description,
  href,
  label,
  tone,
}: RetentionNextStepPanelProps) => (
  <section className={`rounded-2xl border px-4 py-4 ${TONE_CLASSES[tone]}`}>
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
        Decide next move
      </p>
      <div className="space-y-1">
        <h3 className="text-base font-black tracking-tight text-text-primary">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        {label}
      </Link>
    </div>
  </section>
)
