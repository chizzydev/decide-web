'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { API_BASE_URL } from '@/lib/apiBaseUrl'

type VerifyState = 'checking' | 'success' | 'error'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailShell state="checking" />}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}

function VerifyEmailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [state, setState] = useState<VerifyState>('checking')
  const [message, setMessage] = useState('Verifying your Decide account...')

  useEffect(() => {
    let cancelled = false

    const verifyEmail = async () => {
      if (!token) {
        setState('error')
        setMessage('This verification link is missing its token.')
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const json = await response.json()

        if (cancelled) return

        if (!json.success) {
          setState('error')
          setMessage(json.message ?? 'This verification link is invalid or has expired.')
          return
        }

        setState('success')
        setMessage('Email verified. Redirecting you to sign in...')
        setTimeout(() => router.push('/login?verified=1'), 1600)
      } catch {
        if (cancelled) return
        setState('error')
        setMessage('We could not verify this email right now. Please try again.')
      }
    }

    verifyEmail()

    return () => {
      cancelled = true
    }
  }, [router, token])

  return <VerifyEmailShell state={state} message={message} />
}

const VerifyEmailShell = ({
  state,
  message = 'Verifying your Decide account...',
}: {
  state: VerifyState
  message?: string
}) => (
  <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block font-ui font-black text-2xl tracking-tight">
          <span className="text-text-primary">deci</span>
          <span className="text-accent-brand">de</span>
        </Link>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">
          Verify your email
        </h1>
        <p className="text-sm text-text-secondary">
          Finish securing your Decide account before signing in.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-black ${
            state === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : state === 'error'
                ? 'bg-rose-50 text-rose-800'
                : 'bg-accent-subtle text-teal-700'
          }`}
        >
          {state === 'success' ? 'OK' : state === 'error' ? '!' : '...'}
        </div>
        <p className="text-sm text-text-secondary">{message}</p>

        {state === 'error' ? (
          <div className="mt-6 space-y-3">
            <Link
              href="/login"
              className="block rounded-sm bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
            >
              Back to sign in
            </Link>
            <p className="text-xs text-text-muted">
              Enter your email on the sign-in page to request a fresh verification link.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  </div>
)
