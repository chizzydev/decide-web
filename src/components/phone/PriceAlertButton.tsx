'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { requestWithBackendAuth } from '@/lib/backendAuth'
import { formatNaira } from '@/lib/formatters'
import type { CreateAlertBody, StoreType } from '@/types'

interface PriceAlertButtonProps {
  phoneId: number
  phoneName: string
  lowestPrice?: number
}

interface FormState {
  target_price: string
  store: StoreType | ''
}

const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-accent shrink-0 mt-0.5"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}

export const PriceAlertButton = ({
  phoneId,
  phoneName,
  lowestPrice,
}: PriceAlertButtonProps) => {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const id = Number(phoneId)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>({ target_price: '', store: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const callbackUrl = useMemo(() => {
    const query = searchParams?.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const closeModal = useCallback(() => {
    setOpen(false)
    setError(null)
  }, [])

  useEffect(() => {
    if (!open) return

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeModal, open])

  const openModal = () => {
    setForm({ target_price: '', store: '' })
    setError(null)
    setSuccess(false)
    setOpen(true)
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleSignIn = async () => {
    await signIn(undefined, { callbackUrl })
  }

  const handleSubmit = async () => {
    setError(null)

    const targetPrice = parseInt(form.target_price, 10)

    if (!form.target_price || Number.isNaN(targetPrice) || targetPrice < 10000) {
      setError('Enter a target price of at least ₦10,000.')
      return
    }

    if (!session?.user?.email) {
      setError('Sign in to create a Decide price alert.')
      return
    }

    setLoading(true)
    try {
      await requestWithBackendAuth('/alerts/me', {
        method: 'POST',
        body: JSON.stringify({
          phone_id: id,
          target_price: targetPrice,
          store: (form.store as StoreType) || undefined,
        } satisfies CreateAlertBody),
      })
      setSuccess(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  const isSignedIn = !!session?.user?.email

  return (
    <>
      <button
        onClick={openModal}
        className="
          flex items-center justify-center gap-2
          w-full px-4 py-2.5 rounded-sm
          border border-border bg-surface
          text-sm font-semibold text-text-primary
          hover:border-borderHigh hover:bg-surface-hover
          transition-colors duration-fast
        "
      >
        <BellIcon />
        Set price alert
      </button>

      {open && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Set price alert"
            className="
              fixed inset-0 z-[9999]
              flex items-end sm:items-center justify-center
            "
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
              aria-hidden="true"
            />

            <div
              className="
                relative z-10 w-full sm:max-w-lg
                bg-background border border-border
                rounded-t-2xl sm:rounded-xl
                shadow-2xl
                max-h-[92dvh] overflow-y-auto
                animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200
              "
            >
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border sm:hidden" />

                <div>
                  <h2 className="text-base font-bold text-text-primary leading-snug">
                    Set price alert
                  </h2>
                  <p className="text-sm text-text-secondary mt-0.5 leading-snug">
                    {phoneName}
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="
                    flex items-center justify-center
                    w-8 h-8 rounded-sm shrink-0
                    text-text-muted hover:text-text-primary
                    hover:bg-surface transition-colors duration-fast
                  "
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="px-6 py-6">
                {success ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 bg-accent-subtle border border-accent/20 rounded-sm px-4 py-4">
                      <CheckIcon />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-accent">Alert set successfully</p>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          Decide will email{' '}
                          <span className="font-medium text-text-primary">
                            {session?.user?.email}
                          </span>{' '}
                          when {phoneName} drops to{' '}
                          <span className="font-medium text-text-primary">
                            {formatNaira(parseInt(form.target_price, 10))}
                          </span>
                          {form.store
                            ? ` on ${form.store.charAt(0).toUpperCase() + form.store.slice(1)}`
                            : ' on any store'}
                          .
                        </p>
                      </div>
                    </div>

                    <div className="rounded-sm border border-border bg-surface px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Free plan
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        Free Decide accounts can keep up to{' '}
                        <span className="font-semibold text-text-primary">3 active alerts</span>.
                      </p>
                    </div>

                    <button
                      onClick={closeModal}
                      className="
                        w-full px-4 py-3 rounded-sm
                        bg-accent text-white text-sm font-bold
                        hover:bg-accent-hover transition-colors duration-fast
                      "
                    >
                      Done
                    </button>
                  </div>
                ) : !isSignedIn || session?.backendAuthError ? (
                  <div className="space-y-5">
                    <div className="rounded-sm border border-accent/20 bg-tealTint px-4 py-4">
                      <p className="text-sm font-bold text-text-primary">
                        Alerts now belong to your Decide account
                      </p>
                      <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                        Sign in before setting alerts so Decide can protect inboxes, prevent abuse,
                        and keep your alert history tied to your account.
                      </p>
                    </div>

                    <div className="rounded-sm border border-border bg-surface px-4 py-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Free plan
                      </p>
                      <ul className="space-y-1 text-sm text-text-secondary">
                        <li>Up to 3 active alerts</li>
                        <li>Up to 5 alert creations per 24 hours</li>
                        <li>1 minute cooldown between alert creations</li>
                      </ul>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={closeModal}
                        className="
                          flex-1 px-4 py-3 rounded-sm
                          border border-border
                          text-sm font-semibold text-text-primary
                          hover:border-borderHigh hover:bg-surface
                          transition-colors duration-fast
                        "
                      >
                        Not now
                      </button>
                      <button
                        onClick={() => void handleSignIn()}
                        className="
                          flex-1 px-4 py-3 rounded-sm
                          bg-accent text-white text-sm font-bold
                          hover:bg-accent-hover transition-colors duration-fast
                        "
                      >
                        Sign in to continue
                      </button>
                    </div>

                    <p className="text-center text-sm text-text-secondary">
                      Need an account?{' '}
                      <Link
                        href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                        className="font-semibold text-accent hover:text-accent-hover transition-colors duration-fast"
                      >
                        Create one
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {lowestPrice && (
                      <div className="flex items-center justify-between px-4 py-3 bg-surface border border-border rounded-sm">
                        <span className="text-xs font-medium text-text-secondary">
                          Current lowest price
                        </span>
                        <span className="text-sm font-bold text-text-primary">
                          {formatNaira(lowestPrice)}
                        </span>
                      </div>
                    )}

                    <div className="rounded-sm border border-border bg-surface px-4 py-4 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Alert destination
                      </p>
                      <p className="text-sm text-text-primary font-medium">
                        {session.user.email}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Decide ties alerts to your account email for better security and alert history.
                      </p>
                    </div>

                    <div className="rounded-sm border border-border bg-surface px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Free plan
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        You can keep up to{' '}
                        <span className="font-semibold text-text-primary">3 active alerts</span>.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="alert-price"
                        className="block text-sm font-semibold text-text-primary"
                      >
                        Alert me when price drops below
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-muted pointer-events-none select-none">
                          ₦
                        </span>
                        <input
                          id="alert-price"
                          name="target_price"
                          type="number"
                          value={form.target_price}
                          onChange={handleChange}
                          placeholder={
                            lowestPrice ? String(Math.floor(lowestPrice * 0.95)) : '400000'
                          }
                          min={10000}
                          className="
                            w-full pl-7 pr-3 py-3 rounded-sm text-sm
                            bg-surface border border-border
                            text-text-primary placeholder:text-text-muted
                            focus:outline-none focus:border-accent
                            transition-colors duration-fast
                          "
                        />
                      </div>
                      {lowestPrice && (
                        <p className="text-xs text-text-secondary">
                          Tip: set below{' '}
                          <span className="font-semibold text-text-primary">
                            {formatNaira(lowestPrice)}
                          </span>{' '}
                          to get notified when it actually drops.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="alert-store"
                        className="block text-sm font-semibold text-text-primary"
                      >
                        Store <span className="font-normal text-text-muted text-xs">(optional)</span>
                      </label>
                      <select
                        id="alert-store"
                        name="store"
                        value={form.store}
                        onChange={handleChange}
                        className="
                          w-full px-3 py-3 rounded-sm text-sm
                          bg-surface border border-border
                          text-text-primary
                          focus:outline-none focus:border-accent
                          transition-colors duration-fast
                        "
                      >
                        <option value="">Any store</option>
                        <option value="jumia">Jumia</option>
                        <option value="slot">Slot</option>
                      </select>
                    </div>

                    {error && (
                      <p className="text-sm text-error" role="alert">
                        {error}
                      </p>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={closeModal}
                        className="
                          flex-1 px-4 py-3 rounded-sm
                          border border-border
                          text-sm font-semibold text-text-primary
                          hover:border-borderHigh hover:bg-surface
                          transition-colors duration-fast
                        "
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void handleSubmit()}
                        disabled={loading || status === 'loading'}
                        className="
                          flex-1 px-4 py-3 rounded-sm
                          bg-accent text-white text-sm font-bold
                          hover:bg-accent-hover transition-colors duration-fast
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        {loading ? 'Saving...' : 'Set alert'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  )
}
