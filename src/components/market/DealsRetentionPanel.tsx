import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui'

interface DealsRetentionPanelProps {
  title?: string
  description?: string
}

const DEFAULT_ITEMS = [
  {
    eyebrow: 'Watchlist',
    title: 'Save the likely finalists',
    description:
      'When a live drop looks interesting but you are not ready to act yet, move it into Watchlist so Decide can keep the shortlist organized.',
    href: '/saved',
    label: 'Open watchlist',
  },
  {
    eyebrow: 'Alerts',
    title: 'Protect the price move',
    description:
      'Use alerts when timing is the whole point. That keeps you from checking the same moving price manually every day.',
    href: '/alerts',
    label: 'Manage alerts',
  },
  {
    eyebrow: 'Compare',
    title: 'Pressure-test the finalists',
    description:
      'Once two deal candidates start looking close, Compare is still the cleanest way to see which one actually deserves the money.',
    href: '/compare',
    label: 'Compare phones',
  },
] as const

export const DealsRetentionPanel = ({
  title = 'Turn a live drop into a real decision loop',
  description = 'Deals should not end as a page view. The stronger Decide move is to keep promising drops inside Watchlist, protect the ones that matter with alerts, and compare finalists before you leave for a store.',
}: DealsRetentionPanelProps) => {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-text-primary">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {DEFAULT_ITEMS.map((item) => (
          <Card
            key={item.href}
            className="flex h-full flex-col gap-3 border-borderHigh bg-surface"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                {item.eyebrow}
              </p>
              <h3 className="text-lg font-black tracking-tight text-text-primary">
                {item.title}
              </h3>
            </div>

            <p className="flex-1 text-sm leading-relaxed text-text-secondary">
              {item.description}
            </p>

            <Link
              href={item.href}
              className="text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
            >
              {item.label}
            </Link>
          </Card>
        ))}
      </div>
    </section>
  )
}
