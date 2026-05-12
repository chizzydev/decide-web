'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { ApiResponse } from '@/types'
import { API_BASE_URL } from '@/lib/apiBaseUrl'

const FEEDBACK_CATEGORIES = [
  { value: 'general', label: 'General feedback' },
  { value: 'wrong_price', label: 'Wrong price' },
  { value: 'bad_recommendation', label: 'Bad recommendation' },
  { value: 'missing_phone', label: 'Missing phone' },
  { value: 'app_issue', label: 'App issue' },
  { value: 'payment_alert_pro', label: 'Payment / Alert Pro' },
  { value: 'other', label: 'Other' },
] as const

type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]['value']

export const FeedbackWidget = () => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>('general')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    if (submitting) return
    setOpen(false)
    setError(null)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setStatus(null)

    if (message.trim().length < 10) {
      setError('Please write at least 10 characters.')
      return
    }

    setSubmitting(true)
    try {
      const pageUrl =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : pathname

      const response = await fetch(`${API_BASE_URL}/api/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          contact: contact.trim() || null,
          user_email: session?.user?.email ?? null,
          page_url: pageUrl,
          source: 'web',
          metadata: {
            viewport:
              typeof window !== 'undefined'
                ? `${window.innerWidth}x${window.innerHeight}`
                : null,
          },
        }),
      })

      const json = (await response.json()) as ApiResponse<{ id: string }>

      if (!response.ok || !json.success) {
        throw new Error(json.message ?? 'Could not send feedback.')
      }

      setStatus('Thank you. Your feedback has been sent.')
      setMessage('')
      setContact('')
      setCategory('general')
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not send feedback.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          fixed bottom-24 right-3 z-50 inline-flex h-10 items-center justify-center
          rounded-md border border-accent/30 bg-text-primary px-3 text-xs font-black
          text-white shadow-lg shadow-slate-900/15 transition-all duration-fast
          hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-accent focus-visible:ring-offset-2 md:bottom-auto md:right-2
          md:top-1/2 md:h-auto md:-translate-y-1/2 md:rounded-l-md md:rounded-r-none
          md:px-2.5 md:py-4 md:text-[11px] md:[writing-mode:vertical-rl]
        "
      >
        Feedback
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Send Decide feedback"
          className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={close}
            aria-label="Close feedback form"
          />

          <form
            onSubmit={(event) => void submit(event)}
            className="
              relative z-10 w-full max-w-lg rounded-t-3xl border border-borderHigh
              bg-bg p-5 shadow-2xl sm:rounded-3xl sm:p-6
            "
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">
                  Decide feedback
                </p>
                <h2 className="text-2xl font-black tracking-tight text-text-primary">
                  Tell us what to improve
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  You can send this anonymously. Leave contact only if you want a reply.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-lg font-bold text-text-secondary hover:border-borderHigh hover:text-text-primary"
                aria-label="Close"
              >
                x
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-text-primary">Category</span>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as FeedbackCategory)
                  }
                  className="h-12 w-full rounded-md border border-border bg-white px-3 text-sm font-medium text-text-primary focus:border-accent focus:outline-none"
                >
                  {FEEDBACK_CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-text-primary">
                  What should we improve?
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  maxLength={3000}
                  placeholder="Tell us what felt wrong, confusing, missing, or useful."
                  className="w-full resize-none rounded-md border border-border bg-white px-3 py-3 text-sm leading-relaxed text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-text-primary">
                  Contact <span className="font-medium text-text-muted">(optional)</span>
                </span>
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  maxLength={200}
                  placeholder="Email, WhatsApp, or leave blank"
                  className="h-12 w-full rounded-md border border-border bg-white px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </label>

              {error ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                  {error}
                </p>
              ) : null}

              {status ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                  {status}
                </p>
              ) : null}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={close}
                className="h-12 flex-1 rounded-md border border-border px-4 text-sm font-bold text-text-secondary hover:border-borderHigh hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-12 flex-1 rounded-md bg-accent px-4 text-sm font-black text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Send feedback'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
