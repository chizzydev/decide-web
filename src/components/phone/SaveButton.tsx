'use client'

// decide-web/src/components/phone/SaveButton.tsx

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSavedPhones } from '@/components/providers/SavedPhonesProvider'
import { requestWithBackendAuth } from '@/lib/backendAuth'

interface SaveButtonProps {
  phoneId: number
  phoneName: string
  className?: string
  variant?: 'icon' | 'inline'
  label?: string
  savedLabel?: string
}

export const SaveButton = ({
  phoneId,
  phoneName,
  className = '',
  variant = 'icon',
  label = 'Save to watchlist',
  savedLabel = 'Saved to watchlist',
}: SaveButtonProps) => {
  const router = useRouter()
  const { isAuthenticated, isLoading: savedPhonesLoading, isSaved, markSaved, markUnsaved } =
    useSavedPhones()
  const [loading, setLoading] = useState(false)
  const [flyout, setFlyout] = useState<'guest' | 'saved' | null>(null)
  const nudgeRef = useRef<HTMLDivElement>(null)
  const saved = isSaved(phoneId)

  const getAuthHref = (path: '/login' | '/register') => {
    const callbackUrl =
      typeof window === 'undefined'
        ? '/'
        : `${window.location.pathname}${window.location.search}`

    return `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}`
  }

  useEffect(() => {
    if (!flyout) return

    const handleClick = (e: MouseEvent) => {
      if (nudgeRef.current && !nudgeRef.current.contains(e.target as Node)) {
        setFlyout(null)
      }
    }

    const timer = setTimeout(
      () => document.addEventListener('click', handleClick),
      0
    )

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClick)
    }
  }, [flyout])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      if (flyout === 'guest') {
        router.push(getAuthHref('/login'))
      } else {
        setFlyout('guest')
      }

      return
    }

    const prev = saved
    const nextSaved = !saved

    if (nextSaved) {
      markSaved(phoneId)
    } else {
      markUnsaved(phoneId)
    }

    setLoading(true)

    try {
      if (saved) {
        await requestWithBackendAuth<null>(`/saved/me/${phoneId}`, {
          method: 'DELETE',
        })
        setFlyout(null)
      } else {
        await requestWithBackendAuth<null>('/saved/me', {
          method: 'POST',
          body: JSON.stringify({ phone_id: phoneId }),
        })
        setFlyout('saved')
      }
    } catch {
      if (prev) {
        markSaved(phoneId)
      } else {
        markUnsaved(phoneId)
      }
      setFlyout(null)
    } finally {
      setLoading(false)
    }
  }

  const isInline = variant === 'inline'
  const buttonLabel = loading
    ? 'Updating...'
    : saved
      ? savedLabel
      : label

  return (
    <div className="relative" ref={nudgeRef}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || savedPhonesLoading}
        aria-label={saved ? `Remove ${phoneName} from saved` : `Save ${phoneName}`}
        className={[
          isInline
            ? 'inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold'
            : 'flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm',
          'transition-all duration-fast',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          isInline
            ? saved
              ? 'border-accent/20 bg-tealTint text-accent hover:bg-tealTint'
              : 'border-borderHigh bg-white text-text-primary hover:border-accent/30 hover:text-accent'
            : saved
              ? 'text-red-500 hover:text-red-600'
              : 'text-slate-400 hover:text-red-400',
          loading || savedPhonesLoading ? 'cursor-not-allowed opacity-50' : '',
          className,
        ].join(' ')}
      >
        <HeartIcon filled={saved} />
        {isInline ? <span>{buttonLabel}</span> : null}
      </button>

      {flyout === 'guest' && !isAuthenticated && (
        <div className="absolute right-0 top-10 z-50 w-52 space-y-2 rounded-md border border-border bg-surface p-3 shadow-lg">
          <p className="text-xs font-semibold text-text-primary">Sign in to save phones</p>
          <p className="text-xs leading-relaxed text-text-secondary">
            Save this phone to a free Decide account so your watchlist and alerts follow you.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push(getAuthHref('/login'))
              }}
              className="flex-1 rounded-sm bg-accent py-1.5 text-center text-xs font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
            >
              Sign in
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push(getAuthHref('/register'))
              }}
              className="flex-1 rounded-sm border border-border py-1.5 text-center text-xs font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
            >
              Register
            </button>
          </div>
        </div>
      )}

      {flyout === 'saved' && isAuthenticated && (
        <div className="absolute right-0 top-10 z-50 w-56 space-y-2 rounded-md border border-border bg-surface p-3 shadow-lg">
          <p className="text-xs font-semibold text-text-primary">Saved to watchlist</p>
          <p className="text-xs leading-relaxed text-text-secondary">
            Tap your initials beside Find My Phone, then open Watchlist to see this phone, set
            alerts, or compare later.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push('/saved')
              }}
              className="flex-1 rounded-sm bg-accent py-1.5 text-center text-xs font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
            >
              Open watchlist
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setFlyout(null)
              }}
              className="flex-1 rounded-sm border border-border py-1.5 text-center text-xs font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
            >
              Keep browsing
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? '#ef4444' : 'none'}
    stroke={filled ? '#ef4444' : 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)
