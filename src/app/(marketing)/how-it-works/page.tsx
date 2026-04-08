// decide-web/src/app/(marketing)/how-it-works/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How It Works — Decide',
  description: 'Learn how Decide helps you find the perfect phone for your budget and lifestyle in Nigeria.',
}

export default function HowItWorksPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-12">

      <div className="space-y-3">
        <h1 className="text-4xl font-black text-text-primary tracking-tight">
          How it works
        </h1>
        <p className="text-base text-text-secondary">
          Three steps to your perfect phone.
        </p>
      </div>

      <div className="space-y-8">
        {[
          {
            step: '1',
            title: 'Tell us your needs',
            body: 'Answer five quick questions-OS, brand preference, budget, usage type, and what you care about most.',
          },
          {
            step: '2',
            title: 'We score every phone',
            body: 'Our engine scores every phone in our catalogue against your priorities and returns your top three matches.',
          },
          {
            step: '3',
            title: 'Buy with confidence',
            body: 'See real Nigerian prices, gray market warnings, and local support quality, then buy from the best store.',
          },
        ].map(({ step, title, body }) => (
          <div key={step} className="flex gap-5">
            <div className="shrink-0 w-8 h-8 rounded-sm bg-accent text-black font-black text-sm flex items-center justify-center">
              {step}
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-base font-bold text-text-primary">{title}</p>
              <p className="text-sm text-text-secondary">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/assistant"
        className="inline-flex items-center gap-2 h-10 px-5 rounded-sm bg-accent text-black text-sm font-bold hover:bg-accent-hover transition-colors"
      >
        Find my phone →
      </Link>
    </div>
  )
}