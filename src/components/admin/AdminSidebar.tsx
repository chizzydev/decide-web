'use client'

// decide-web/src/components/admin/AdminSidebar.tsx

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

export const AdminSidebar = () => {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 min-h-screen bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/" className="font-ui font-black text-lg tracking-tight">
          <span className="text-text-primary">deci</span>
          <span className="text-accent-brand">de</span>
        </Link>
        <p className="text-xs text-text-muted mt-0.5 font-medium">Admin Dashboard</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-fast',
                isActive
                  ? 'bg-tealTint text-accent font-semibold'
                  : 'text-text-secondary hover:bg-surfaceHigh hover:text-text-primary',
              ].join(' ')}
            >
              <span className="w-4 h-4 shrink-0">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-surfaceHigh hover:text-text-primary transition-colors duration-fast"
        >
          <span className="w-4 h-4 shrink-0"><ExternalIcon /></span>
          View site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-surfaceHigh hover:text-text-primary transition-colors duration-fast"
        >
          <span className="w-4 h-4 shrink-0"><SignOutIcon /></span>
          Sign out
        </button>
      </div>
    </aside>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────

const OverviewIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)
const ReviewsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const PhonesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
  </svg>
)
const BrandsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4l3 3"/>
  </svg>
)
const AlertsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)
const SyncIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M23 4v6h-6M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
)
const AuditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 12l2 2 4-4"/>
    <path d="M21 12c0 5-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9z"/>
    <path d="M12 7v.01"/>
  </svg>
)
const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)
const SignOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const NAV = [
  { href: '/admin',         label: 'Overview',   icon: <OverviewIcon /> },
  { href: '/admin/reviews', label: 'Reviews',    icon: <ReviewsIcon  /> },
  { href: '/admin/users',   label: 'Users',      icon: <UsersIcon    /> },
  { href: '/admin/phones',  label: 'Phones',     icon: <PhonesIcon   /> },
  { href: '/admin/brands',  label: 'Brands',     icon: <BrandsIcon   /> },
  { href: '/admin/alerts',  label: 'Alerts',     icon: <AlertsIcon   /> },
  { href: '/admin/audit',   label: 'Audit Log',  icon: <AuditIcon    /> },
  { href: '/admin/sync',    label: 'Price Sync', icon: <SyncIcon     /> },
]
