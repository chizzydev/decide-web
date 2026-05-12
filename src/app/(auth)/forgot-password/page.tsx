'use client'

// decide-web/src/app/(auth)/forgot-password/page.tsx

import React, { useState } from 'react'
import Link from 'next/link'
import { API_BASE_URL } from '@/lib/apiBaseUrl'

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res  = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const json = await res.json()

      if (!json.success) {
        setError(json.message ?? 'Something went wrong. Please try again.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
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
            Forgot your password?
          </h1>
          <p className="text-sm text-text-secondary">
            Use the email for your Decide password account. If you normally sign in with Google, use Google sign-in instead.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-8">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-accent-subtle flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-primary">Check your email</p>
              <p className="text-sm text-text-secondary">
                If a Decide password account exists for <span className="font-medium text-text-primary">{email}</span>,
                we've sent a password reset link. If you usually sign in with Google, go back and use Google sign-in instead.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm text-accent font-semibold hover:text-accent-hover transition-colors duration-fast"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-text-primary">
                  Email address
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

              <p className="text-sm text-text-secondary">
                Reset email is only for Decide password accounts. Google sign-in accounts will not receive a password reset email.
              </p>

              {error && (
                <p className="text-sm text-error" role="alert">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-secondary">
          Remembered it?{' '}
          <Link href="/login" className="text-accent font-semibold hover:text-accent-hover transition-colors duration-fast">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
