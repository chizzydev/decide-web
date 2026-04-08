// decide-web/src/app/(app)/assistant/page.tsx
// The assistant page — renders the full-screen decision flow.
// This is a thin wrapper: its only job is to establish the
// 'use client' boundary and render AssistantShell.
// All step logic lives inside AssistantShell and its children.

import type { Metadata } from 'next'
import { AssistantShell } from '@/components/assistant'

export const metadata: Metadata = {
  title: 'Find My Phone — Decide',
  description:
    'Answer five quick questions and get a personalised phone recommendation with real Nigerian prices.',
}

export default function AssistantPage() {
  return <AssistantShell />
}