// decide-web/src/components/layout/Navbar.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Input } from '@/components/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { phonesApi } from '@/lib/api'
import type { PhoneCard } from '@/types'

const NAV_LINKS = [
  { href: '/phones',  label: 'Browse'  },
  { href: '/brands',  label: 'Brands'  },
  { href: '/analyze', label: 'Analyze' },
  { href: '/compare', label: 'Compare' },
  { href: '/alerts',  label: 'Alerts'  },
  { href: '/saved',   label: 'Watchlist' },
]

export const Navbar = () => {
  const pathname          = usePathname()
  const { data: session } = useSession()
  const hideSearchOnPhonesBrowse = pathname === '/phones'
  const isAssistantRoute = pathname.startsWith('/assistant')

  const [scrolled,      setScrolled]      = useState(false)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState<PhoneCard[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [userMenuOpen,  setUserMenuOpen]  = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(searchQuery, 400)

  useEffect(() => {
    const handleScroll = (): void => { setScrolled(window.scrollY > 8) }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    let cancelled = false
    const search = async (): Promise<void> => {
      setSearchLoading(true)
      try {
        const results = await phonesApi.search(debouncedQuery)
        if (!cancelled) {
          setSearchResults(results)
          setSearchOpen(results.length > 0)
        }
      } catch {
        if (!cancelled) setSearchResults([])
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }
    search()
    return () => { cancelled = true }
  }, [debouncedQuery])

  useEffect(() => {
    setSearchQuery('')
    setSearchResults([])
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    // Timeout ensures the button's own onClick fires first before the
    // document handler is attached — prevents immediate close on open
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

  const clearSearch = (): void => {
    setSearchQuery('')
    setSearchResults([])
    setSearchOpen(false)
  }

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header
      className={[
        'sticky top-0 z-sticky bg-surface',
        'transition-colors duration-normal',
        scrolled ? 'border-b border-border shadow-sm' : 'border-b border-transparent',
      ].join(' ')}
    >
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="shrink-0 font-ui font-black text-xl tracking-tight">
          <span className="text-text-primary">deci</span>
          <span className="text-accent-brand">de</span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'relative px-3 py-1.5 rounded-md text-sm transition-colors duration-fast',
                  isActive
                    ? 'text-text-primary font-semibold bg-tealTint'
                    : 'text-slate-500 font-medium hover:text-text-primary hover:bg-surfaceHigh',
                ].join(' ')}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Search */}
        {hideSearchOnPhonesBrowse ? (
          <div className="flex-1" />
        ) : (
          <div className="flex-1 relative max-w-sm ml-auto">
            <Input
              placeholder="Search phones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              leadingIcon={<SearchIcon />}
              trailing={
                searchQuery ? (
                  <button
                    onClick={clearSearch}
                    className="text-slate-400 hover:text-text-primary transition-colors duration-fast"
                    aria-label="Clear search"
                  >
                    <ClearIcon />
                  </button>
                ) : null
              }
              aria-label="Search phones"
              aria-expanded={searchOpen}
              aria-controls="search-dropdown"
              aria-autocomplete="list"
            />
            {searchOpen && (
              <div
                id="search-dropdown"
                role="listbox"
                className="absolute left-0 right-0 top-full z-dropdown mt-1 max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto rounded-md border border-border bg-surface shadow-md"
              >
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-slate-400">Searching...</div>
                ) : (
                  searchResults.map((phone) => (
                    <Link
                      key={phone.slug}
                      href={`/phones/${phone.slug}`}
                      role="option"
                      aria-selected="false"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-tealTint transition-colors duration-fast border-b border-border last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{phone.name}</p>
                        <p className="text-xs text-slate-400">{phone.brand_name}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Desktop auth (sm and above) ── */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {session ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-text-secondary hover:bg-surfaceHigh transition-colors duration-fast"
                aria-label="User menu"
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center bg-accent text-white text-xs font-bold shrink-0">
                  {initials}
                </span>
                <span className="max-w-[100px] truncate hidden md:block">
                  {session.user.name ?? session.user.email}
                </span>
                <ChevronIcon />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-dropdown mt-2 w-[min(16rem,calc(100vw-2rem))]">
                  <UserDropdown
                    session={session}
                    onClose={() => setUserMenuOpen(false)}
                    onSignOut={() => signOut({ callbackUrl: '/' })}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="h-9 px-4 rounded-md text-sm font-semibold text-text-secondary border border-border hover:border-borderHigh hover:text-text-primary transition-colors duration-fast flex items-center"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="h-9 px-4 rounded-md text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors duration-fast flex items-center"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile auth icon (visible only below sm) ── */}
        <div className="relative sm:hidden shrink-0" ref={userMenuRef}>
          {session ? (
            <>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-accent text-white text-xs font-bold"
                aria-label="User menu"
              >
                {initials}
              </button>
              {userMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-modal bg-black/30"
                    aria-label="Close account menu"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div
                    className="fixed inset-x-3 bottom-20 z-modal max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[28px] border border-border bg-surface shadow-2xl"
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
                    <UserDropdown
                      session={session}
                      onClose={() => setUserMenuOpen(false)}
                      onSignOut={() => signOut({ callbackUrl: '/' })}
                      compact
                      hideIdentity
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors duration-fast"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Get Advice CTA — desktop only */}
        {isAssistantRoute ? (
          <span
            className="hidden h-9 shrink-0 cursor-default items-center gap-1.5 rounded-md bg-surfaceHigh px-5 text-sm font-bold text-text-muted lg:inline-flex"
            aria-current="page"
            aria-disabled="true"
          >
            Get Advice
          </span>
        ) : (
          <Link
            href="/assistant"
            className="hidden h-9 shrink-0 items-center gap-1.5 rounded-md bg-accent px-5 text-sm font-bold text-white shadow-accent transition-colors duration-fast hover:bg-accent-hover lg:inline-flex"
          >
            Get Advice
          </Link>
        )}

      </nav>
    </header>
  )
}

// ── Shared dropdown ────────────────────────────────────────────────────────

const UserDropdown = ({
  session,
  onClose,
  onSignOut,
  compact = false,
  hideIdentity = false,
}: {
  session: any
  onClose?: () => void
  onSignOut: () => void
  compact?: boolean
  hideIdentity?: boolean
}) => (
  <div
    className={[
      'overflow-hidden bg-surface',
      compact ? 'w-full rounded-xl border-0 shadow-none' : 'w-full rounded-xl border border-border shadow-lg',
    ].join(' ')}
  >
    {!hideIdentity && (
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold text-text-primary truncate">
          {session.user.name ?? 'Account'}
        </p>
        <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
      </div>
    )}
    <Link href="/account" onClick={onClose} className="flex items-center gap-2 px-5 py-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:bg-tealTint sm:px-4 sm:py-3">
      My Account
    </Link>
    <Link href="/saved" onClick={onClose} className="flex items-center gap-2 px-5 py-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:bg-tealTint sm:px-4 sm:py-3">
      Watchlist
    </Link>
    <Link href="/alerts" onClick={onClose} className="flex items-center gap-2 px-5 py-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:bg-tealTint sm:px-4 sm:py-3">
      My Alerts
    </Link>
    {session.user.role === 'admin' && (
      <Link href="/admin" onClick={onClose} className="flex items-center gap-2 px-5 py-4 text-sm font-semibold text-accent transition-colors duration-fast hover:bg-tealTint sm:px-4 sm:py-3">
        Admin Dashboard
      </Link>
    )}
    <div className="border-t border-border">
      <button
        onClick={onSignOut}
        className="w-full px-5 py-4 text-left text-sm font-semibold text-slate-500 transition-colors duration-fast hover:bg-surfaceHigh hover:text-text-primary sm:px-4 sm:py-3"
      >
        Sign out
      </button>
    </div>
  </div>
)

// ── Icons ──────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PersonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

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

export const MOBILE_NAV_LINKS = [
  { href: '/assistant', label: 'Advisor', icon: <AdvisorIcon /> },
  { href: '/phones',    label: 'Browse',  icon: <BrowseIcon  /> },
  { href: '/analyze',   label: 'Analyze', icon: <AnalyzeIcon /> },
  { href: '/compare',   label: 'Compare', icon: <CompareIcon /> },
]
