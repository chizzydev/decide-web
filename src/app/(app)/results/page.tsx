import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Results - Decide',
  description:
    'Open your guided phone recommendations from the main assistant flow.',
}

interface ResultsPageProps {
  searchParams: Promise<{
    redirect?: string
  }>
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { redirect: redirectTarget } = await searchParams

  if (redirectTarget === 'assistant') {
    redirect('/assistant')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
        Guided results
      </p>
      <h1 className="text-3xl font-black tracking-tight text-text-primary">
        Open your recommendations from the assistant
      </h1>
      <p className="text-sm leading-relaxed text-text-secondary">
        Decide now keeps recommendation results inside the guided assistant flow
        instead of on a separate standalone results page.
      </p>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/assistant"
          className="inline-flex items-center justify-center rounded-full border border-accent/15 bg-tealTint px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-accent transition-colors duration-fast hover:border-accent/25 hover:bg-accent-subtle"
        >
          Open guided assistant
        </Link>
        <Link
          href="/analyze"
          className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-text-primary transition-colors duration-fast hover:border-borderHigh hover:bg-surfaceHigh"
        >
          Use analyzer instead
        </Link>
      </div>
    </div>
  )
}
