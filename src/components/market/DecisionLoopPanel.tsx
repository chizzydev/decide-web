import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui'

interface DecisionLoopItem {
  eyebrow: string
  title: string
  description: string
  href: string
  label: string
}

interface DecisionLoopPanelProps {
  title: string
  description: string
  items: DecisionLoopItem[]
}

export const DecisionLoopPanel = ({
  title,
  description,
  items,
}: DecisionLoopPanelProps) => {
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
        {items.map((item) => (
          <Card
            key={`${item.href}-${item.title}`}
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
