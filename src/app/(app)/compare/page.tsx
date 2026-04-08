// decide-web/src/app/(app)/compare/page.tsx
// Side-by-side phone comparison page.
// Reads slug_a and slug_b from URL search params.
// Both slugs are required — shows a prompt if either is missing.

import type { Metadata } from 'next'
import type { PhoneDetail } from '@/types'
import Link from 'next/link'
import { compareApi } from '@/lib/api'
import { Divider, Badge } from '@/components/ui'
import { PriceDisplay } from '@/components/shared'
import { ScoreBarGroup } from '@/components/phone'
import { PhoneSpecSheet } from '@/components/phone'

export const metadata: Metadata = {
  title: 'Compare Phones — Decide',
  description: 'Compare two phones side by side with Nigerian prices, specs, and Decide scores.',
}

interface ComparePageProps {
  searchParams: Promise<{
    slug_a?: string
    slug_b?: string
  }>
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { slug_a, slug_b } = await searchParams

  // ── Missing slugs ────────────────────────────────────────────
  if (!slug_a || !slug_b) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-2xl" aria-hidden="true">⚖️</p>
        <h1 className="text-2xl font-black text-text-primary">
          Compare two phones
        </h1>
        <p className="text-sm text-text-secondary">
          Add phones to your compare tray from the{' '}
          <Link href="/phones" className="text-accent hover:text-accent-hover">
            browse page
          </Link>{' '}
          or your recommendation results, then open the compare tray to compare them.
        </p>
      </div>
    )
  }

  // ── Fetch both phones ────────────────────────────────────────
  let phoneA: PhoneDetail | null = null
  let phoneB: PhoneDetail | null = null
  let error: string | null = null

  try {
    const result = await compareApi.compareTwoPhones({ slug_a, slug_b })
    phoneA = result.phone_a
    phoneB = result.phone_b
  } catch {
    error = 'Could not load comparison. Please try again.'
  }

  if (error || !phoneA || !phoneB) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-sm text-text-secondary">
          {error ?? 'One or both phones could not be found.'}
        </p>
        <Link href="/phones" className="text-accent hover:text-accent-hover text-sm">
          ← Back to phones
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          Compare
        </h1>
        <p className="text-sm text-text-secondary">
          {phoneA.name} vs {phoneB.name}
        </p>
      </div>

      {/* Phone name headers — sticky on scroll */}
      <div className="grid grid-cols-2 gap-4 sticky top-14 z-10 bg-bg py-3 border-b border-border">
        <div className="space-y-1">
          <p className="text-xs text-text-muted">{phoneA.brand_name}</p>
          <p className="text-base font-bold text-text-primary leading-tight">{phoneA.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-text-muted">{phoneB.brand_name}</p>
          <p className="text-base font-bold text-text-primary leading-tight">{phoneB.name}</p>
        </div>
      </div>

      {/* Scores */}
      <CompareSection title="Decide Scores">
        <div className="grid grid-cols-2 gap-6">
          <ScoreBarGroup scores={{
            battery:     phoneA.score_battery,
            camera:      phoneA.score_camera,
            performance: phoneA.score_performance,
            build:       phoneA.score_build,
          }} />
          <ScoreBarGroup scores={{
            battery:     phoneB.score_battery,
            camera:      phoneB.score_camera,
            performance: phoneB.score_performance,
            build:       phoneB.score_build,
          }} />
        </div>
      </CompareSection>

      <Divider />

      {/* Prices */}
      <CompareSection title="Prices">
        <div className="grid grid-cols-2 gap-6">
          <PriceDisplay prices={phoneA.prices} />
          <PriceDisplay prices={phoneB.prices} />
        </div>
      </CompareSection>

      <Divider />

      {/* Full specs */}
      <CompareSection title="Specifications">
        <div className="grid grid-cols-2 gap-6">
          <PhoneSpecSheet phone={phoneA} compact />
          <PhoneSpecSheet phone={phoneB} compact />
        </div>
      </CompareSection>

    </div>
  )
}

// ── CompareSection ─────────────────────────────────────────────

interface CompareSectionProps {
  title:    string
  children: React.ReactNode
}

const CompareSection = ({ title, children }: CompareSectionProps) => (
  <section className="space-y-4">
    <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">
      {title}
    </h2>
    {children}
  </section>
)