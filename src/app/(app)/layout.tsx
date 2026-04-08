// decide-web/src/app/(app)/layout.tsx
// App layout — wraps all core app pages.

import React from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { Footer } from '@/components/layout/Footer'
import { CompareTray } from '@/components/layout/CompareTray'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      {/* pb-20 clears the fixed MobileNav on small screens. md:pb-0 removes it on desktop. */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      <CompareTray />
      <MobileNav />
    </div>
  )
}