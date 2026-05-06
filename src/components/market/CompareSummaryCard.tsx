import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui'
import type { CompareResult } from '@/types'

interface CompareSummaryCardProps {
  result: CompareResult
}

export const CompareSummaryCard = ({ result }: CompareSummaryCardProps) => {
  const winner =
    result.overall_winner === result.phone_a.slug
      ? result.phone_a
      : result.overall_winner === result.phone_b.slug
        ? result.phone_b
        : null

  return (
    <Card className="overflow-hidden border-borderHigh bg-surface shadow-sm">
      <div className="border-b border-border bg-gradient-to-br from-tealTint via-surface to-surface px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Decide compare summary
            </p>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-text-primary">
                {result.summary.headline}
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                {result.summary.subheadline}
              </p>
            </div>
          </div>

          <div className="rounded-full border border-accent/15 bg-tealTint px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-accent">
            {winner ? `Overall: ${winner.name}` : 'Overall: Close call'}
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-5 py-5 md:grid-cols-2 md:px-6">
        <CompareStrengthColumn
          title={result.phone_a.name}
          href={`/phones/${result.phone_a.slug}`}
          items={result.summary.strengths_a}
        />
        <CompareStrengthColumn
          title={result.phone_b.name}
          href={`/phones/${result.phone_b.slug}`}
          items={result.summary.strengths_b}
        />
      </div>
    </Card>
  )
}

interface CompareStrengthColumnProps {
  title: string
  href: string
  items: string[]
}

const CompareStrengthColumn = ({
  title,
  href,
  items,
}: CompareStrengthColumnProps) => (
  <div className="space-y-3 rounded-2xl border border-border bg-surfaceHigh px-4 py-4">
    <div className="space-y-1">
      <Link
        href={href}
        className="text-lg font-black tracking-tight text-text-primary transition-colors duration-fast hover:text-accent"
      >
        {title}
      </Link>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
        Where it stands out
      </p>
    </div>

    <ul className="space-y-2">
      {items.length > 0 ? (
        items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-text-secondary">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))
      ) : (
        <li className="text-sm text-text-muted">
          No clear advantage rows surfaced yet.
        </li>
      )}
    </ul>
  </div>
)
