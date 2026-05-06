import type { Metadata } from 'next'
import Link from 'next/link'
import { AnalyzerPanel } from '@/components/analyzer/AnalyzerPanel'

export const metadata: Metadata = {
  title: 'Should I Buy This Phone? - Decide',
  description:
    'Paste any phone name and get an honest verdict - match score, reasons, tradeoffs, and better alternatives at your budget. Built for the Nigerian market.',
}

export default function AnalyzePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="space-y-3">
          <p className="text-xs font-bold tracking-wider uppercase text-accent">
            Phone Analyzer
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-text-primary tracking-tight leading-tight md:text-4xl">
              Should I buy this phone?
            </h1>
            <p className="max-w-2xl text-sm text-text-secondary leading-relaxed md:text-base">
              Analyze is for buyers who already have a specific phone in mind and want a clearer
              yes, no, or maybe before they spend. Decide checks fit, tradeoffs, and better
              alternatives against your budget and use case.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {ANALYZE_START_PATHS.map((path) => (
            <AnalyzeStartCard
              key={path.href}
              eyebrow={path.eyebrow}
              title={path.title}
              description={path.description}
              href={path.href}
              actionLabel={path.actionLabel}
            />
          ))}
        </div>
      </section>

      <AnalyzerPanel />
    </div>
  )
}

const ANALYZE_START_PATHS = [
  {
    eyebrow: 'Need a recommendation?',
    title: 'Use the advisor instead',
    description:
      'Start with the guided advisor when you are not yet sure which phone belongs on your shortlist.',
    href: '/assistant',
    actionLabel: 'Open advisor',
  },
  {
    eyebrow: 'Timing first?',
    title: 'Check live deals today',
    description:
      'Open the deals radar if a strong price cut is more likely to change your decision than the phone itself.',
    href: '/deals/today',
    actionLabel: "Open today\'s shortlist",
  },
  {
    eyebrow: 'Two finalists?',
    title: 'Go straight to compare',
    description:
      'Use Compare when your real question is which of two phones wins for your money, not whether one phone is good in isolation.',
    href: '/compare',
    actionLabel: 'Compare phones',
  },
  {
    eyebrow: 'Buying tokunbo?',
    title: 'Open the used checker',
    description:
      'Use the used-phone checker when the real risk is seller trust, converted hardware, or whether a tokunbo offer is actually safe.',
    href: '/used/checker',
    actionLabel: 'Open used checker',
  },
] as const

interface AnalyzeStartCardProps {
  eyebrow: string
  title: string
  description: string
  href: string
  actionLabel: string
}

const AnalyzeStartCard = ({
  eyebrow,
  title,
  description,
  href,
  actionLabel,
}: AnalyzeStartCardProps) => (
  <section className="rounded-2xl border border-borderHigh bg-surface px-4 py-4 shadow-sm">
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
        {eyebrow}
      </p>
      <div className="space-y-1">
        <h2 className="text-lg font-black tracking-tight text-text-primary">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        {actionLabel}
      </Link>
    </div>
  </section>
)