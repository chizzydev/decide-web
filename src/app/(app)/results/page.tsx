import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ResultHistoryPage } from '@/components/assistant/ResultHistoryPage'

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

  return <ResultHistoryPage />
}
