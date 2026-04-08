'use client'

// decide-web/src/app/(auth)/reset-password/page.tsx

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function ResetPasswordPage() {
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
      const json = await res.json()

      if (!json.success) {
        setError(json.message ?? 'This reset link is invalid or has expired.')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
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
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  disabled={!token}
                  className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm" className="block text-sm font-semibold text-text-primary">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  disabled={!token}
                  className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast disabled:opacity-50"
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