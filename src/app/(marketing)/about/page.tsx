// decide-web/src/app/(marketing)/about/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Decide',
  description: 'Decide is a Nigerian-first phone decision intelligence tool built to help buyers make confident purchases.',
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">

      <div className="space-y-3">
        <h1 className="text-4xl font-black text-text-primary tracking-tight">
          About Decide
        </h1>
        <p className="text-base text-text-secondary">
          Built for Nigeria. Not adapted from somewhere else.
        </p>
      </div>

      <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
        <p>
          GSMArena tells you specs. We tell you where to buy, what it costs today, and whether to trust the seller.
        </p>
        <p>
          Every phone in our catalogue has manually verified Nigerian market scores, gray market risk assessments, and local support quality notes. None of it is auto-generated.
        </p>
        <p>
          No commissions influencing results. No sponsored rankings in the core algorithm. Just honest recommendations based on your budget and priorities.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/assistant"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-sm bg-accent text-black text-sm font-bold hover:bg-accent-hover transition-colors"
        >
          Find my phone →
        </Link>
      </div>

    </div>
  )
}