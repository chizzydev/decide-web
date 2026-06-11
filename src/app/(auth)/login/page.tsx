'use client'

// decide-web/src/app/(auth)/login/page.tsx

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

const normalizeCallbackUrl = (value: string | null) => {
  if (!value) return '/'
  if (!value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

const formatRetryMessage = (retryAfterSeconds: number | null) => {
  if (!retryAfterSeconds || Number.isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) {
    return 'Too many sign-in attempts were entered. Please wait a few minutes before trying again.'
  }

  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60))
  return `Too many sign-in attempts were entered. Please wait about ${retryAfterMinutes} minute${retryAfterMinutes === 1 ? '' : 's'} before trying again, or reset your password if you’ve forgotten it.`
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShellFallback title="Welcome back" subtitle="Sign in to your account to continue" />}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = normalizeCallbackUrl(searchParams.get('callbackUrl'))
  const sessionExpired = searchParams.get('reason') === 'session-expired'
  const registered = searchParams.get('registered') === '1'
  const initialEmail = searchParams.get('email') || ''
  const rateLimited = searchParams.get('error') === 'TooManyLoginAttempts'
  const retryAfterSeconds = Number.parseInt(searchParams.get('retryAfter') || '', 10)

  const [email,    setEmail]    = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(
    rateLimited ? formatRetryMessage(retryAfterSeconds) : null
  )
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let result: Awaited<ReturnType<typeof signIn>> | undefined
    try {
      result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })
    } catch {
      setLoading(false)
      setError('We could not complete sign-in just now. Please try again in a moment.')
      return
    }

    setLoading(false)

    if (result?.error === 'TooManyLoginAttempts') {
      let nextRetryAfterSeconds: number | null = null

      if (result.url) {
        try {
          const url = new URL(result.url, window.location.origin)
          nextRetryAfterSeconds = Number.parseInt(url.searchParams.get('retryAfter') || '', 10)
        } catch {
          nextRetryAfterSeconds = null
        }
      }

      setError(formatRetryMessage(nextRetryAfterSeconds))
      return
    }

    if (result?.error) {
      setError('Invalid email or password.')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  const handleGoogle = () =>
    signIn('google', { callbackUrl }, { prompt: 'select_account' })

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block font-ui font-black text-2xl tracking-tight">
            <span className="text-text-primary">deci</span>
            <span className="text-accent-brand">de</span>
          </Link>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-text-secondary">
            Sign in to your account to continue
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-lg p-8 space-y-6">
          {sessionExpired ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your Decide session expired. Sign in again to continue.
            </p>
          ) : null}

          {registered ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Account created. Sign in to continue.
            </p>
          ) : null}

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-md border border-border text-sm font-semibold text-text-primary hover:bg-surfaceHigh transition-colors duration-fast"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-text-primary">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-text-primary">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-accent hover:text-accent-hover transition-colors duration-fast">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <div
                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800"
                role="alert"
              >
                <p>{error}</p>
                {(rateLimited || error.includes('Too many sign-in attempts')) ? (
                  <p className="mt-2">
                    <Link
                      href="/forgot-password"
                      className="font-semibold text-rose-900 underline underline-offset-2"
                    >
                      Reset your password
                    </Link>{' '}
                    if you no longer remember it.
                  </p>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-accent font-semibold hover:text-accent-hover transition-colors duration-fast"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

interface AuthShellFallbackProps {
  title: string
  subtitle: string
}

const AuthShellFallback = ({ title, subtitle }: AuthShellFallbackProps) => (
  <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block font-ui font-black text-2xl tracking-tight">
          <span className="text-text-primary">deci</span>
          <span className="text-accent-brand">de</span>
        </Link>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-text-secondary">{subtitle}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-8">
        <p className="text-center text-sm text-text-secondary">
          Loading...
        </p>
      </div>
    </div>
  </div>
)

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

const PasswordInput = ({ className = '', ...props }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`w-full rounded-sm border border-border bg-surface px-3 py-2.5 pr-11 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-fast focus:border-accent focus:outline-none ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-text-muted transition-colors duration-fast hover:text-text-primary"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m3 3 18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6M7 6.8C4.1 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1.7 0 3.2-.5 4.5-1.2M12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.8 3.4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
