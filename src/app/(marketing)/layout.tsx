// decide-web/src/app/(marketing)/layout.tsx
// Layout for the marketing route group.
// Wraps landing and how-it-works pages with the transparent
// marketing navbar and the shared footer.
// The (marketing) folder name is a Next.js route group —
// it does not appear in the URL.

import React from 'react'
import { MarketingNavbar } from '@/components/layout/MarketingNavbar'
import { CompareTray }     from '@/components/layout/CompareTray'
import { MobileNav }       from '@/components/layout/MobileNav'
import { Footer }          from '@/components/layout/Footer'
import { FeedbackWidget }  from '@/components/feedback'

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingNavbar />
      {/* pb-20 clears the fixed MobileNav on small screens. md:pb-0 removes it on desktop. */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      <CompareTray />
      <FeedbackWidget />
      <MobileNav />
    </div>
  )
}
