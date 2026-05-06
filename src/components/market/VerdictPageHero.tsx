import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui'
import type { EditorialPhoneSummary } from '@/types'

interface VerdictHeroBadge {
  label: string
  value: string
}

interface VerdictHeroAction {
  href: string
  label: string
  tone?: 'primary' | 'secondary'
}

interface VerdictPageHeroProps {
  eyebrow: string
  title: string
  description: string
  phone: EditorialPhoneSummary
  badges: VerdictHeroBadge[]
  actions: VerdictHeroAction[]
}

const hasRealImage = (url: string | null | undefined): boolean =>
  !!url && !url.includes('placeholder')

export const VerdictPageHero = ({
  eyebrow,
  title,
  description,
  phone,
  badges,
  actions,
}: VerdictPageHeroProps) => {
  return (
    <Card className="overflow-hidden border-borderHigh bg-surface p-0 shadow-sm">
      <div className="grid gap-6 bg-gradient-to-br from-tealTint via-surface to-surface px-5 py-6 md:px-6 lg:grid-cols-[1.6fr_0.9fr] lg:items-end">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {eyebrow}
            </p>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                {title}
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <HeroBadge
                key={`${badge.label}-${badge.value}`}
                label={badge.label}
                value={badge.value}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={[
                  'inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold transition-colors duration-fast',
                  action.tone === 'secondary'
                    ? 'border border-border bg-surface text-text-secondary hover:border-borderHigh hover:text-text-primary'
                    : 'bg-accent text-white hover:bg-accent-hover',
                ].join(' ')}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white/85 p-5 shadow-sm">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                Phone in focus
              </p>
              <h2 className="text-2xl font-black tracking-tight text-text-primary">
                {phone.name}
              </h2>
              <p className="text-sm text-text-secondary">{phone.brand_name}</p>
            </div>

            <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-border bg-surfaceHigh p-4">
              {hasRealImage(phone.image_url) ? (
                <Image
                  src={phone.image_url!}
                  alt={phone.name}
                  width={220}
                  height={220}
                  className="max-h-[180px] w-auto object-contain"
                />
              ) : (
                <PhonePlaceholder />
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface HeroBadgeProps {
  label: string
  value: string
}

const HeroBadge = ({ label, value }: HeroBadgeProps) => (
  <div className="rounded-full border border-border bg-white/80 px-3 py-1.5 text-xs">
    <span className="font-bold uppercase tracking-[0.14em] text-text-muted">
      {label}
    </span>
    <span className="ml-2 font-semibold text-text-primary">{value}</span>
  </div>
)

const PhonePlaceholder = () => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="text-text-muted"
  >
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="18.5" r="1" fill="currentColor" />
  </svg>
)
