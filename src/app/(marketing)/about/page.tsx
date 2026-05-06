import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About - Decide',
  description:
    'Decide is a Nigerian-first phone decision intelligence tool built to help buyers make confident purchases.',
}

const SECTIONS = [
  {
    title: 'A decision layer, not a specs dump',
    body:
      'Specs matter, but Nigerian buyers also need to know whether the price is fair today, whether support is realistic, whether the unit is risky, and whether a nearby alternative makes more sense.',
  },
  {
    title: 'Trusted prices and Jiji leads stay separate',
    body:
      'Jumia and Slot are treated as trusted retail signals. Jiji is treated as a marketplace lane: useful for cheaper opportunities, but always framed as a lead to inspect, not a safe-to-pay verdict.',
  },
  {
    title: 'Built around real budgets',
    body:
      'Decide does not shame older phones or push upgrades for the sake of it. It explains the tradeoff clearly so buyers can decide whether to stretch, wait, compare, or buy what already fits their reality.',
  },
  {
    title: 'Trust before monetization',
    body:
      'The recommendation layer is designed around fit, value, price timing, support, repair, resale, and risk. No sponsored ranking should override the core buying advice.',
  },
] as const

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          About Decide
        </p>
        <h1 className="text-4xl font-black tracking-tight text-text-primary">
          Built for the Nigerian phone market
        </h1>
        <p className="text-base leading-relaxed text-text-secondary">
          Decide helps people buy phones with clearer context: real Nigerian prices,
          ownership risk, marketplace caution, and advice that respects actual budgets.
        </p>
      </header>

      <div className="grid gap-5">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-border bg-surface px-5 py-5 shadow-sm"
          >
            <h2 className="text-xl font-black tracking-tight text-text-primary">
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <Link
          href="/assistant"
          className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
        >
          Find my phone
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
        >
          Back to Decide
        </Link>
      </div>
    </main>
  )
}
