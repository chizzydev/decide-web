// decide-web/src/components/layout/MarketingNavbar.tsx
// Simpler navbar for the landing page and marketing pages.
// No search bar, no active link states.
// Transparent at the top — transitions to a solid background on scroll.

'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const NAV_LINKS = [
  { href: '/phones',       label: 'Browse Phones' },
  { href: '/how-it-works', label: 'How It Works'  },
]

export const MarketingNavbar = () => {
  const [scrolled,     setScrolled]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { data: session }               = useSession()
  const userMenuRef                     = useRef<HTMLDivElement>(null)
  const pathname                         = usePathname()
  const isAssistantRoute                 = pathname.startsWith('/assistant')

  useEffect(() => {
    const handleScroll = (): void => { setScrolled(window.scrollY > 40) }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClick)
    }
  }, [userMenuOpen])

  useEffect(() => {
    if (!userMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [userMenuOpen])

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-sticky',
        'transition-all duration-slow',
        scrolled
          ? 'bg-bg border-b border-border'
          : 'bg-transparent border-b border-transparent',
      ].join(' ')}
    >
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="font-ui font-black text-xl tracking-tight text-text-primary hover:text-accent transition-colors duration-fast"
        >
          deci<span className="text-accent">de</span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surfaceHigh transition-colors duration-fast"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {session ? (
            // ── Logged in ──────────────────────────────────────────────
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-text-secondary hover:bg-surfaceHigh transition-colors duration-fast"
                aria-label="User menu"
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center bg-accent text-white text-xs font-bold shrink-0">
                  {initials}
                </span>
                <span className="hidden md:block max-w-[100px] truncate">
                  {session.user.name ?? session.user.email}
                </span>
                <ChevronIcon />
              </button>

              {userMenuOpen && (
                <>
                  <div className="absolute right-0 top-full z-dropdown mt-2 hidden w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg sm:block">
                    <AccountMenuContent
                      session={session}
                      onClose={() => setUserMenuOpen(false)}
                      onSignOut={() => signOut({ callbackUrl: '/' })}
                    />
                  </div>
                  <button
                    type="button"
                    className="fixed inset-0 z-modal bg-black/30 sm:hidden"
                    aria-label="Close account menu"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div
                    className="fixed inset-x-3 bottom-20 z-modal max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[28px] border border-border bg-surface shadow-2xl sm:hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Account menu"
                  >
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary truncate">
                          {session.user.name ?? 'Account'}
                        </p>
                        <p className="text-xs text-text-muted truncate">{session.user.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUserMenuOpen(false)}
                        className="ml-3 rounded-full border border-border px-3 py-1 text-xs font-bold text-text-secondary"
                      >
                        Close
                      </button>
                    </div>
                    <AccountMenuContent
                      session={session}
                      onClose={() => setUserMenuOpen(false)}
                      onSignOut={() => signOut({ callbackUrl: '/' })}
                      hideIdentity
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            // ── Logged out ─────────────────────────────────────────────
            <>
              <Link
                href="/login"
                className="hidden sm:block text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors duration-fast"
              >
                Sign in
              </Link>

              {/* Mobile — text link */}
              <Link
                href="/login"
                className="sm:hidden text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors duration-fast"
              >
                Sign in
              </Link>
            </>
          )}

          {/* Primary CTA */}
          {isAssistantRoute ? (
            <span
              className="inline-flex h-9 cursor-default items-center rounded-sm bg-surfaceHigh px-5 text-sm font-bold tracking-wide text-text-muted"
              aria-current="page"
              aria-disabled="true"
            >
              Find My Phone
            </span>
          ) : (
            <Link
              href="/assistant"
              className="inline-flex h-9 items-center rounded-sm bg-accent px-5 text-sm font-bold tracking-wide text-white transition-all duration-fast hover:bg-accent-hover active:scale-[0.98]"
            >
              Find My Phone
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AccountMenuContent = ({
  session,
  onClose,
  onSignOut,
  hideIdentity = false,
}: {
  session: any
  onClose: () => void
  onSignOut: () => void
  hideIdentity?: boolean
}) => (
  <div className="overflow-hidden bg-surface">
    {!hideIdentity && (
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold text-text-primary truncate">
          {session.user.name ?? 'Account'}
        </p>
        <p className="text-xs text-text-muted truncate">{session.user.email}</p>
      </div>
    )}
    <AccountLink href="/account" onClose={onClose}>My Account</AccountLink>
    <AccountLink href="/saved" onClose={onClose}>Watchlist</AccountLink>
    <AccountLink href="/alerts" onClose={onClose}>My Alerts</AccountLink>
    {session.user.role === 'admin' && (
      <AccountLink href="/admin" onClose={onClose} accent>Admin Dashboard</AccountLink>
    )}
    <div className="border-t border-border">
      <button
        type="button"
        onClick={onSignOut}
        className="w-full px-5 py-4 text-left text-sm font-semibold text-slate-500 transition-colors duration-fast hover:bg-surfaceHigh hover:text-text-primary sm:px-4 sm:py-2.5"
      >
        Sign out
      </button>
    </div>
  </div>
)

const AccountLink = ({
  href,
  children,
  onClose,
  accent = false,
}: {
  href: string
  children: React.ReactNode
  onClose: () => void
  accent?: boolean
}) => (
  <Link
    href={href}
    onClick={onClose}
    className={[
      'flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-colors duration-fast hover:bg-tealTint sm:px-4 sm:py-2.5',
      accent ? 'text-accent' : 'text-text-secondary',
    ].join(' ')}
  >
    {children}
  </Link>
)
