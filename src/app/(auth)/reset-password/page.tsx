'use client'

// decide-web/src/app/(auth)/reset-password/page.tsx

import React, { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'https://decide-api-production-8aa7.up.railway.app'
).replace(/\/+$/, '')

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShellFallback
          title="Set a new password"
          subtitle="Choose a strong password for your account"
        />
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  )
}

function ResetPasswordPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token')

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  useEffect(() => {
    if (!token) setError('This reset link is invalid or has expired.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const res  = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const contentType = res.headers.get('content-type') ?? ''
      const json = contentType.includes('application/json')
        ? await res.json()
        : null

      if (!res.ok || !json?.success) {
        setError(
          json?.message ??
            'We could not reset your password from this link. Request a fresh reset email and try again.'
        )
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Decide could not reach the reset service. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md space-y-8">

        <div className="text-center space-y-2">
          <Link href="/" className="inline-block font-ui font-black text-2xl tracking-tight">
            <span className="text-text-primary">deci</span>
            <span className="text-accent-brand">de</span>
          </Link>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Set a new password
          </h1>
          <p className="text-sm text-text-secondary">
            Choose a strong password for your account
          </p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-8">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-accent-subtle flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-primary">Password updated</p>
              <p className="text-sm text-text-secondary">
                Your password has been reset successfully. Redirecting you to sign in...
              </p>
              <Link
                href="/login"
                className="inline-block text-sm text-accent font-semibold hover:text-accent-hover transition-colors duration-fast"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-text-primary">
                  New password
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  disabled={!token}
                  className="disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm" className="block text-sm font-semibold text-text-primary">
                  Confirm password
                </label>
                <PasswordInput
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  disabled={!token}
                  className="disabled:opacity-50"
                />
              </div>

              {error && (
                <p className="text-sm text-error" role="alert">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-2.5 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-secondary">
          <Link href="/login" className="text-accent font-semibold hover:text-accent-hover transition-colors duration-fast">
            Back to sign in
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

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

const PasswordInput = ({ className = '', disabled, ...props }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        className={`w-full rounded-sm border border-border bg-surface px-3 py-2.5 pr-11 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-fast focus:border-accent focus:outline-none disabled:cursor-not-allowed ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-text-muted transition-colors duration-fast hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
