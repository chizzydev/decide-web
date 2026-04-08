// decide-web/src/app/(marketing)/page.tsx
// The landing page — the first thing a new user sees.
// One job: get the user to click "Find My Phone".

import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { phonesApi } from '@/lib/api'
import { PhoneGrid } from '@/components/phone'
import { Divider }   from '@/components/ui'
import { formatNaira } from '@/lib/formatters'
import type { PhoneCard } from '@/types'

export const metadata: Metadata = {
  title: 'Nigeria\'s Smartest Phone Advisor',
  description:
    'Answer five questions. Get the right phone for your budget and lifestyle — with real Nigerian prices and gray market warnings.',
}

export const revalidate = 21600

export default async function HomePage() {
  let featuredPhones: PhoneCard[] = []

  try {
    featuredPhones = await phonesApi.getFeatured()
  } catch {
    featuredPhones = []
  }

  return (
    <div className="flex flex-col">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">

        {/* Teal grid — replaces amber */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(#14b8a6 1px, transparent 1px),
              linear-gradient(90deg, #14b8a6 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
          aria-hidden="true"
        />

        {/* Teal glow — replaces amber */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] opacity-[0.06] rounded-full blur-3xl pointer-events-none"
          style={{ background: '#14b8a6' }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-text-primary leading-tight tracking-tight">
            Stop guessing.
            <br />
            <span className="text-accent">Find your phone.</span>
          </h1>

          <p className="text-lg text-text-secondary leading-relaxed max-w-lg mx-auto">
            Answer five questions about your budget, brand preference,
            and priorities. Get a personalised recommendation with real
            Nigerian prices from Jumia and Slot.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/assistant"
              className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-accent text-navy-800 font-bold text-base tracking-wide hover:bg-accent-hover active:scale-[0.98] transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Find My Phone →
            </Link>
            <Link
              href="/phones"
              className="inline-flex items-center justify-center h-12 px-8 rounded-md border border-border text-text-secondary text-base font-medium hover:border-borderHigh hover:text-text-primary transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Browse phones
            </Link>
          </div>

          <p className="text-xs text-text-muted">
            Prices updated every 6 hours · Gray market warnings included ·
            No ads, no affiliate bias
          </p>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <p className="text-xs font-bold tracking-wider uppercase text-text-muted">How it works</p>
            <h2 className="text-3xl font-black text-text-primary tracking-tight">
              Three steps to your perfect phone
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, index) => (
              <HowItWorksStep
                key={step.title}
                number={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Nigerian market differentiators ───────────────── */}
      <section className="py-20 px-4 border-t border-border bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <p className="text-xs font-bold tracking-wider uppercase text-text-muted">Why Decide</p>
            <h2 className="text-3xl font-black text-text-primary tracking-tight">
              Built for Nigerian buyers
            </h2>
            <p className="text-base text-text-secondary max-w-lg mx-auto">
              GSMArena tells you specs. We tell you specs, where to buy,
              what it costs today in our local currency, and whether to trust the phone you want to buy alongside the seller.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DIFFERENTIATORS.map((item) => (
              <DifferentiatorCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Should I Buy This? ────────────────────────────── */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-10">

            {/* Text side */}
            <div className="flex-1 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-bold tracking-wider uppercase text-accent">
                  Phone Analyzer
                </p>
                <h2 className="text-3xl font-black text-text-primary tracking-tight leading-tight">
                  Already have a phone<br />in mind?
                </h2>
                <p className="text-base text-text-secondary leading-relaxed">
                  Search any phone, enter your budget and use case — get
                  an honest verdict with match score, reasons, tradeoffs,
                  and better alternatives if they exist.
                </p>
              </div>

              <ul className="space-y-2">
                {[
                  'Honest match score — not marketing',
                  'Real reasons why it works (or doesn\'t)',
                  'Gray market and age warnings',
                  'Better alternatives at the same budget',
                ].map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="w-4 h-4 rounded-full bg-accent-subtle border border-accent/20 flex items-center justify-center shrink-0" aria-hidden="true">
                      {/* Teal checkmark — replaces amber hardcode */}
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l2 2 3-3" stroke="#14b8a6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {point}
                  </li>
                ))}
              </ul>

              <Link
                href="/analyze"
                className="inline-flex items-center justify-center h-11 px-7 rounded-md bg-accent text-navy-800 font-bold text-sm tracking-wide hover:bg-accent-hover active:scale-[0.98] transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Analyze a Phone →
              </Link>
            </div>

            {/* Visual side — mock analyzer card */}
            <div className="w-full sm:w-72 shrink-0">
              <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-sm">

                <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
                  <span aria-hidden="true">✅</span>
                  <span className="text-xs font-black text-emerald-700 tracking-wider uppercase">
                    Excellent choice
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md border border-border bg-surfaceHigh flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
                      📱
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">Samsung</p>
                      <p className="text-sm font-bold text-text-primary">Galaxy A55 5G</p>
                      <p className="text-xs text-slate-500">from ₦280,000</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black text-emerald-600">87%</p>
                      <p className="text-[10px] text-slate-400">match</p>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-surfaceHigh rounded-full overflow-hidden">
                    <div className="h-full w-[87%] bg-emerald-500 rounded-full" />
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-medium text-emerald-700">
                    <span aria-hidden="true">✓</span>
                    Fits your budget — ₦20,000 left over
                  </div>

                  <div className="space-y-1.5">
                    {['Strong camera for photos & reels', 'Excellent local Samsung support'].map((r) => (
                      <div key={r} className="flex items-start gap-2">
                        <span className="mt-0.5 w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0" aria-hidden="true">
                          <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4l2 2 3-3" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        <p className="text-xs text-text-secondary">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Featured phones ───────────────────────────────── */}
      {featuredPhones.length > 0 && (
        <section className="py-20 px-4 border-t border-border bg-surface">
          <div className="max-w-6xl mx-auto">
            <PhoneGrid
              phones={featuredPhones}
              title="Featured Phones"
              subtitle="Featured phones with verified live prices"
              action={
                <Link
                  href="/phones"
                  className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors duration-fast"
                >
                  View all →
                </Link>
              }
            />
          </div>
        </section>
      )}

      {/* ── Budget ranges ─────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-border bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <p className="text-xs font-bold tracking-wider uppercase text-text-muted">Every budget</p>
            <h2 className="text-3xl font-black text-text-primary tracking-tight">
              From ₦30k to ₦800k+
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {BUDGET_RANGES.map((range) => (
              <Link
                key={range.label}
                href={`/phones?max_price=${range.max}`}
                className="group flex flex-col items-center gap-2 p-4 bg-bg border border-border rounded-md hover:border-accent/40 hover:bg-tealTint transition-all duration-fast text-center"
              >
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide group-hover:text-accent transition-colors duration-fast">
                  {range.label}
                </span>
                <span className="text-sm font-black text-text-primary">
                  {range.display}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-border text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-4xl font-black text-text-primary tracking-tight leading-tight">
            Ready to decide?
          </h2>
          <p className="text-base text-text-secondary">
            Takes less than two minutes. No sign-up, no email required.
          </p>
          <Link
            href="/assistant"
            className="inline-flex items-center justify-center h-12 px-10 rounded-md bg-accent text-navy-800 font-bold text-base tracking-wide hover:bg-accent-hover active:scale-[0.98] transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Find My Phone →
          </Link>
        </div>
      </section>

    </div>
  )
}

// ── Static data ───────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    icon:        '🎯',
    title:       'Tell us your needs',
    description: 'Answer five quick questions — OS, brand preference, budget, usage type, and what you care about most.',
  },
  {
    icon:        '⚡',
    title:       'We score every phone',
    description: 'Our engine scores every phone in our catalogue against your priorities and returns your top three matches.',
  },
  {
    icon:        '🛒',
    title:       'Buy with confidence',
    description: 'See real Nigerian prices, gray market warnings, and local support quality — then buy from the best store.',
  },
]

const DIFFERENTIATORS = [
  {
    icon:        '💰',
    title:       'Real Nigerian prices',
    description: 'Prices scraped from Jumia every 6 hours. Not US prices converted at the wrong rate.',
  },
  {
    icon:        '⚠️',
    title:       'Gray market warnings',
    description: 'We flag phones with no official Nigerian warranty so you know exactly what you are buying before you pay.',
  },
  {
    icon:        '🎯',
    title:       'Honest phone verdicts',
    description: 'Already have a phone in mind? Get a match score, real reasons it works for you, and tradeoffs — not a sales pitch.',
  },
  {
    icon:        '🔧',
    title:       'Local support ratings',
    description: 'We track which brands have service centres in Nigeria so you know where to go if something goes wrong.',
  },
  {
    icon:        '🚫',
    title:       'No ads, no bias',
    description: 'No brand pays to appear higher in results. Recommendations are ranked purely by fit to your preferences.',
  },
]

const BUDGET_RANGES = [
  { label: 'Entry',     display: 'Under ₦80k',    max: 80000    },
  { label: 'Mid-Range', display: '₦80k – ₦150k',  max: 150000   },
  { label: 'Premium',   display: '₦150k – ₦300k', max: 300000   },
  { label: 'High-End',  display: '₦300k – ₦500k', max: 500000   },
  { label: 'Flagship',  display: '₦500k+',         max: 10000000 },
]

// ── Sub-components ────────────────────────────────────────────

interface HowItWorksStepProps {
  number:      number
  icon:        string
  title:       string
  description: string
}

const HowItWorksStep = ({ number, icon, title, description }: HowItWorksStepProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <span className="w-7 h-7 rounded-md bg-accent-subtle border border-accent/20 flex items-center justify-center text-xs font-black text-accent shrink-0" aria-hidden="true">
        {number}
      </span>
      <span className="text-xl" aria-hidden="true">{icon}</span>
    </div>
    <div className="space-y-1">
      <h3 className="text-base font-bold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  </div>
)

interface DifferentiatorCardProps {
  icon:        string
  title:       string
  description: string
}

const DifferentiatorCard = ({ icon, title, description }: DifferentiatorCardProps) => (
  <div className="flex gap-4 p-4 bg-bg border border-border rounded-md hover:border-borderHigh transition-colors duration-fast">
    <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  </div>
)