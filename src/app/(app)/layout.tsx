// decide-web/src/app/(app)/layout.tsx
// App layout — wraps all core app pages.

'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { Footer } from '@/components/layout/Footer'
import { CompareTray } from '@/components/layout/CompareTray'
import { FeedbackWidget } from '@/components/feedback'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const isAssistantRoute = pathname === '/assistant'

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <div className={isAssistantRoute ? 'hidden md:block' : ''}>
        <Navbar />
      </div>
      {/* pb-20 clears the fixed MobileNav on small screens. md:pb-0 removes it on desktop. */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      {!isAssistantRoute ? <Footer /> : null}
      {!isAssistantRoute ? <CompareTray /> : null}
      <FeedbackWidget />
      <MobileNav />
    </div>
  )
}
