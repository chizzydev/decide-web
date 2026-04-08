// decide-web/src/components/layout/MarketingNavbar.tsx
// Simpler navbar for the landing page and marketing pages.
// No search bar, no active link states.
// Transparent at the top — transitions to a solid background on scroll.

'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
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
                <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-border rounded-md shadow-md z-dropdown overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {session.user.name ?? 'Account'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
                  </div>
                  <Link href="/account" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-tealTint transition-colors duration-fast">
                    My Account
                  </Link>
                  <Link href="/saved" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-tealTint transition-colors duration-fast">
                    Saved Phones
                  </Link>
                  <Link href="/alerts" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-tealTint transition-colors duration-fast">
                    My Alerts
                  </Link>
                  {session.user.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-accent font-semibold hover:bg-tealTint transition-colors duration-fast">
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="border-t border-border">
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-surfaceHigh hover:text-text-primary transition-colors duration-fast"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
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
          <Link
            href="/assistant"
            className="inline-flex items-center h-9 px-5 rounded-sm bg-accent text-black text-sm font-bold tracking-wide hover:bg-accent-hover active:scale-[0.98] transition-all duration-fast"
          >
            Find My Phone
          </Link>
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