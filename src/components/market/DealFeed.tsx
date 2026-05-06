import React from 'react'
import type { ReactNode } from 'react'
import type { PriceDropRadarItem } from '@/types'
import { getPrimaryDealCompareAction } from '@/lib/relatedCompare'
import { DealCard } from './DealCard'

interface DealFeedProps {
  deals: PriceDropRadarItem[]
  title?: string
  description?: string
  eyebrow?: string
  action?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
}

export const DealFeed = ({
  deals,
  title = 'Live price drops',
  description = 'Fresh tracked drops from Jumia and Slot.',
  eyebrow = 'Deals radar',
  action,
  emptyTitle = 'No qualifying drops right now',
  emptyDescription = 'Decide is still tracking live prices. When a meaningful drop lands across the stores we monitor, it will show up here.',
}: DealFeedProps) => {
  const compareActionsByKey = new Map(
    deals.map((deal) => [
      `${deal.phone_slug}-${deal.store}`,
      getPrimaryDealCompareAction(deal, deals),
    ])
  )

  if (deals.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-text-primary">
          {emptyTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
          {emptyDescription}
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {deals.map((deal) => (
          <DealCard
            key={`${deal.phone_slug}-${deal.store}`}
            deal={deal}
            compareAction={
              compareActionsByKey.get(`${deal.phone_slug}-${deal.store}`) ?? null
            }
          />
        ))}
      </div>
    </section>
  )
}
