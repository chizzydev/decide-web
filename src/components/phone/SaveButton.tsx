'use client'

// decide-web/src/components/phone/SaveButton.tsx

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { requestWithBackendAuth } from '@/lib/backendAuth'

interface SaveButtonProps {
  phoneId:    number
  phoneName:  string
  className?: string
}

export const SaveButton = ({ phoneId, phoneName, className = '' }: SaveButtonProps) => {
  const { data: session }     = useSession()
  const router                = useRouter()
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [nudge,   setNudge]   = useState(false)
  const nudgeRef              = useRef<HTMLDivElement>(null)

  // Fetch initial saved state for logged-in users
  useEffect(() => {
    if (!session?.user?.id) return
    requestWithBackendAuth<Array<{ phone_id: number }>>('/saved/me')
      .then((data) => {
        setSaved(data.some((s) => s.phone_id === phoneId))
      })
      .catch(() => {})
  }, [session?.user?.id, phoneId])

  // Close nudge on outside click
  useEffect(() => {
    if (!nudge) return
    const handleClick = (e: MouseEvent) => {
      if (nudgeRef.current && !nudgeRef.current.contains(e.target as Node)) {
        setNudge(false)
      }
    }
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => { clearTimeout(timer); document.removeEventListener('click', handleClick) }
  }, [nudge])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Guest — redirect to login directly (no nested link issue)
    if (!session?.user?.id) {
      if (nudge) {
        router.push('/login')
      } else {
        setNudge(true)
      }
      return
    }

    const prev = saved
    setSaved(!saved)
    setLoading(true)

    try {
      if (saved) {
        await requestWithBackendAuth<null>(`/saved/me/${phoneId}`, {
          method: 'DELETE',
        })
      } else {
        await requestWithBackendAuth<null>('/saved/me', {
          method: 'POST',
          body: JSON.stringify({ phone_id: phoneId }),
        })
      }
    } catch {
      setSaved(prev)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={nudgeRef}>
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={saved ? `Remove ${phoneName} from saved` : `Save ${phoneName}`}
        className={[
          'flex items-center justify-center w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm',
          'transition-all duration-fast',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          saved  ? 'text-red-500 hover:text-red-600' : 'text-slate-400 hover:text-red-400',
          loading ? 'opacity-50 cursor-not-allowed' : '',
          className,
        ].join(' ')}
      >
        <HeartIcon filled={saved} />
      </button>

      {/* Guest nudge — no nested links, uses router.push instead */}
      {nudge && !session && (
        <div className="absolute right-0 top-10 z-50 w-52 bg-surface border border-border rounded-md shadow-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-text-primary">Sign in to save phones</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Tap again to go to sign in, or create a free account.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push('/login') }}
              className="flex-1 text-center text-xs font-bold py-1.5 rounded-sm bg-accent text-white hover:bg-accent-hover transition-colors duration-fast"
            >
              Sign in
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push('/register') }}
              className="flex-1 text-center text-xs font-semibold py-1.5 rounded-sm border border-border text-text-secondary hover:text-text-primary transition-colors duration-fast"
            >
              Register
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
