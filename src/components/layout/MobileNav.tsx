// decide-web/src/components/layout/MobileNav.tsx
// Fixed bottom navigation bar — visible only on mobile (md:hidden).
// Kept as a separate file so it can be imported into the server component layout
// without forcing the entire layout into a client component.

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Icons ──────────────────────────────────────────────────────────────────────

const AdvisorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
  </svg>
)

const BrowseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="18" r="1" fill="currentColor"/>
    <path d="M9 7h6M9 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const AnalyzeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const CompareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="9" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="13" y="4" width="9" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 9h-2M7 12h-2M7 15h-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M18 9h-2M18 12h-2M18 15h-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const MOBILE_NAV_LINKS = [
  { href: '/assistant', label: 'Advisor',  icon: <AdvisorIcon /> },
  { href: '/phones',    label: 'Browse',   icon: <BrowseIcon  /> },
  { href: '/analyze',   label: 'Analyze',  icon: <AnalyzeIcon /> },
  { href: '/compare',   label: 'Compare',  icon: <CompareIcon /> },
]

export const MobileNav = () => {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-border"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-16">
        {MOBILE_NAV_LINKS.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-1 text-center transition-colors duration-fast',
                isActive
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="w-5 h-5 flex items-center justify-center" aria-hidden="true">
                {icon}
              </span>
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area spacer for phones with home indicator */}
      <div className="h-safe-bottom bg-bg" />
    </nav>
  )
}

