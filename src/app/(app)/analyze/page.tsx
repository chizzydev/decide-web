// decide-web/src/app/(app)/analyze/page.tsx
// "Should I Buy This Phone?" — standalone analyzer page.
// Server component shell — all interactive logic lives in AnalyzerPanel.

import type { Metadata } from 'next'
import { AnalyzerPanel } from '@/components/analyzer/AnalyzerPanel'

export const metadata: Metadata = {
  title: 'Should I Buy This Phone? — Decide',
  description:
    'Paste any phone name and get an honest verdict — match score, reasons, tradeoffs, and better alternatives at your budget. Built for the Nigerian market.',
}

export default function AnalyzePage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-8">

      {/* Page header */}
      <div className="space-y-2">
        <p className="text-xs font-bold tracking-wider uppercase text-accent">
          Phone Analyzer
        </p>
        <h1 className="text-3xl font-black text-text-primary tracking-tight leading-tight">
          Should I buy this phone?
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Search for any phone, enter your budget and use case — get an honest
          verdict with clear reasons, tradeoffs, and better alternatives if they exist.
        </p>
      </div>

      {/* Panel */}
      <AnalyzerPanel />

    </div>
  )
}