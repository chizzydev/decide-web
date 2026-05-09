'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { requestWithBackendAuth } from '@/lib/backendAuth'
import { formatNaira } from '@/lib/formatters'
import type { AlertEntitlement, CreateAlertBody, PriceAlert } from '@/types'

interface PriceAlertButtonProps {
  phoneId: number
  phoneName: string
  variantId?: number | null
  variantLabel?: string | null
  lowestPrice?: number
  buttonLabel?: string
  triggerClassName?: string
  triggerVariant?: 'default' | 'inlinePrimary' | 'inlineSecondary'
  onSuccess?: (alert: PriceAlert) => void
}

interface FormState {
  target_price: string
  store: CreateAlertBody['store'] | ''
  nearby_deals_enabled: boolean
  marketplace_alerts_enabled: boolean
}

const pendingAlertProReferenceKey = 'decide.alertPro.pendingReference'
const ALERT_PRO_PRICE_LABEL = 'N500 / 30 days'
const ALERT_PRO_BUTTON_LABEL = 'N500'

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
    className="mt-0.5 shrink-0 text-accent"
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
  variantId,
  variantLabel,
  lowestPrice,
  buttonLabel,
  triggerClassName,
  triggerVariant,
  onSuccess,
}: PriceAlertButtonProps) => {
  return (
    <Suspense
      fallback={
        <PriceAlertButtonFallback
          buttonLabel={buttonLabel}
          triggerClassName={triggerClassName}
          triggerVariant={triggerVariant}
        />
      }
    >
      <PriceAlertButtonContent
        phoneId={phoneId}
        phoneName={phoneName}
        variantId={variantId}
        variantLabel={variantLabel}
        lowestPrice={lowestPrice}
        buttonLabel={buttonLabel}
        triggerClassName={triggerClassName}
        triggerVariant={triggerVariant}
        onSuccess={onSuccess}
      />
    </Suspense>
  )
}

const PriceAlertButtonContent = ({
  phoneId,
  phoneName,
  variantId,
  variantLabel,
  lowestPrice,
  buttonLabel = 'Set price alert',
  triggerClassName,
  triggerVariant = 'default',
  onSuccess,
}: PriceAlertButtonProps) => {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const id = Number(phoneId)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>({
    target_price: '',
    store: '',
    nearby_deals_enabled: false,
    marketplace_alerts_enabled: false,
  })
  const [entitlement, setEntitlement] = useState<AlertEntitlement | null>(null)
  const [loading, setLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [pendingReference, setPendingReference] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const callbackUrl = useMemo(() => {
    const query = searchParams?.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  const trackedName = variantLabel ? `${phoneName} (${variantLabel})` : phoneName

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
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

  const openModal = async () => {
    setForm({
      target_price: '',
      store: '',
      nearby_deals_enabled: false,
      marketplace_alerts_enabled: false,
    })
    setError(null)
    setUpgradeMessage(null)
    setSuccess(false)
    setOpen(true)

    if (session?.user?.email) {
      try {
        const loadedEntitlement =
          await requestWithBackendAuth<AlertEntitlement>(
            '/billing/alerts/me/entitlement'
          )
        setEntitlement(loadedEntitlement)
        setForm((prev) => ({
          ...prev,
          nearby_deals_enabled:
            loadedEntitlement.smart_nearby_alerts_enabled,
          marketplace_alerts_enabled: false,
        }))
      } catch {
        setEntitlement(null)
      }
    }
  }

  useEffect(() => {
    if (!open || !session?.user?.email) return

    try {
      setPendingReference(window.localStorage.getItem(pendingAlertProReferenceKey))
    } catch {
      setPendingReference(null)
    }
  }, [open, session?.user?.email])

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = event.target
    const value =
      target instanceof HTMLInputElement && target.type === 'checkbox'
        ? target.checked
        : target.value

    setForm((prev) => ({ ...prev, [target.name]: value }))
  }

  const handleSignIn = async () => {
    await signIn(undefined, { callbackUrl })
  }

  const handleUpgrade = async () => {
    setError(null)

    if (!session?.user?.email) {
      await handleSignIn()
      return
    }

    setUpgradeLoading(true)
    try {
      const checkout = await requestWithBackendAuth<{
        checkout_url: string
        reference: string
      }>('/billing/alerts/premium/checkout', { method: 'POST' })
      try {
        window.localStorage.setItem(
          pendingAlertProReferenceKey,
          checkout.reference
        )
        setPendingReference(checkout.reference)
      } catch {
        setPendingReference(checkout.reference)
      }
      window.location.assign(checkout.checkout_url)
    } catch (upgradeError) {
      setError(
        upgradeError instanceof Error
          ? upgradeError.message
          : 'Could not start Alert Pro checkout.'
      )
    } finally {
      setUpgradeLoading(false)
    }
  }

  const handleRefreshProStatus = async () => {
    const reference = pendingReference?.trim()

    if (!reference) {
      setError('No pending Alert Pro payment reference found.')
      return
    }

    setUpgradeLoading(true)
    setError(null)

    try {
      const result = await requestWithBackendAuth<{
        status: string
        entitlement: AlertEntitlement
        expires_at?: string
      }>(`/billing/alerts/premium/verify/${encodeURIComponent(reference)}`)
      setEntitlement(result.entitlement)

      if (result.entitlement.plan === 'premium') {
        try {
          window.localStorage.removeItem(pendingAlertProReferenceKey)
        } catch {
          // Ignore blocked storage; the server entitlement is the source of truth.
        }
        setPendingReference(null)
        setUpgradeMessage(
          'Alert Pro is active. Smart Nearby Alerts and Jiji leads are unlocked.'
        )
      } else {
        setError('Payment is not confirmed yet. Give it a moment, then refresh again.')
      }
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Could not refresh Alert Pro status.'
      )
    } finally {
      setUpgradeLoading(false)
    }
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
      const createdAlert = await requestWithBackendAuth<PriceAlert>('/alerts/me', {
        method: 'POST',
        body: JSON.stringify({
          phone_id: id,
          variant_id: variantId ?? undefined,
          target_price: targetPrice,
          store: form.store || undefined,
          nearby_deals_enabled: form.nearby_deals_enabled,
          marketplace_alerts_enabled:
            form.marketplace_alerts_enabled || form.store === 'jiji',
          max_above_target_percent: form.nearby_deals_enabled ? 15 : 0,
        } satisfies CreateAlertBody),
      })
      setSuccess(true)
      onSuccess?.(createdAlert)
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
  const isPro = entitlement?.plan === 'premium'
  const shouldShowUpgrade =
    !!error && /alert pro|upgrade|free launch|jiji marketplace/i.test(error)

  const triggerStyles =
    triggerVariant === 'inlinePrimary'
      ? `
          inline-flex w-auto shrink-0
          rounded-md border border-accent bg-accent
          px-4 py-0 h-10
          text-sm font-bold text-white
          hover:border-accent-hover hover:bg-accent-hover hover:text-white
        `
      : triggerVariant === 'inlineSecondary'
        ? `
          inline-flex w-auto shrink-0
          rounded-md border border-border bg-white
          px-4 py-0 h-10
          text-sm font-semibold text-text-secondary
          hover:border-borderHigh hover:text-text-primary
        `
        : `
          flex w-full
          rounded-sm border border-border bg-surface
          px-4 py-2.5
          text-sm font-semibold text-text-primary
          hover:border-borderHigh hover:bg-surface-hover
        `

  return (
    <>
      <button
        onClick={() => void openModal()}
        className={[
          `
          items-center justify-center gap-2
          transition-colors duration-fast
        `,
          triggerStyles,
          triggerClassName ?? '',
        ].join(' ')}
      >
        <BellIcon />
        {buttonLabel}
      </button>

      {open ? (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Set price alert"
            className="
              fixed inset-0 z-[9999]
              flex items-end justify-center sm:items-center
            "
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
              aria-hidden="true"
            />

            <div
              className="
                relative z-10 w-full sm:max-w-xl
                max-h-[92dvh] overflow-y-auto
                rounded-t-[28px] border border-borderHigh bg-bg shadow-2xl
                animate-in slide-in-from-bottom-4 duration-200 sm:rounded-[28px] sm:zoom-in-95
              "
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-bg/95 px-6 pb-4 pt-6 backdrop-blur">
                <div className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-borderHigh" />

                <div className="space-y-1">
                  <h2 className="text-xl font-black leading-snug tracking-tight text-text-primary">
                    Set price alert
                  </h2>
                  <p className="text-sm leading-snug text-text-secondary">{phoneName}</p>
                  {variantLabel ? (
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                      Tracking variant: {variantLabel}
                    </p>
                  ) : null}
                </div>

                <button
                  onClick={closeModal}
                  className="
                    flex h-8 w-8 shrink-0 items-center justify-center rounded-sm
                    text-text-muted transition-colors duration-fast hover:bg-surface hover:text-text-primary
                  "
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="space-y-5 px-6 py-6">
                {success ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent-subtle px-4 py-4">
                      <CheckIcon />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-accent">Alert set successfully</p>
                        <p className="text-sm leading-relaxed text-text-secondary">
                          Decide will email{' '}
                          <span className="font-medium text-text-primary">
                            {session?.user?.email}
                          </span>{' '}
                          when {trackedName} drops to{' '}
                          <span className="font-medium text-text-primary">
                            {formatNaira(parseInt(form.target_price, 10))}
                          </span>
                          {form.store
                            ? ` on ${form.store.charAt(0).toUpperCase() + form.store.slice(1)}`
                            : ' on any trusted store'}
                          .
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Free Launch
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        Free Launch keeps one trusted-store alert. Alert Pro is{' '}
                        <span className="font-semibold text-text-primary">
                          {ALERT_PRO_PRICE_LABEL}
                        </span>{' '}
                        and unlocks Jiji marketplace alerts and more active phone
                        watches.
                      </p>
                    </div>

                    <button
                      onClick={closeModal}
                      className="
                        w-full rounded-xl bg-accent px-4 py-3
                        text-sm font-bold text-white
                        transition-colors duration-fast hover:bg-accent-hover
                      "
                    >
                      Done
                    </button>
                  </div>
                ) : !isSignedIn || session?.backendAuthError ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-accent/20 bg-tealTint px-4 py-4">
                      <p className="text-sm font-bold text-text-primary">
                        Alerts now belong to your Decide account
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                        Sign in before setting alerts so Decide can protect inboxes, prevent abuse,
                        and keep your alert history tied to your account.
                      </p>
                      {variantLabel ? (
                        <p className="mt-2 text-xs font-medium text-text-secondary">
                          This alert will watch the tracked {variantLabel} configuration.
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2 rounded-2xl border border-border bg-surface px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Free Launch
                      </p>
                      <ul className="space-y-1 text-sm text-text-secondary">
                        <li>1 active trusted-store alert</li>
                        <li>2 alert creations per 24 hours</li>
                        <li>15 minute cooldown between alert creations</li>
                        <li>Alert Pro costs {ALERT_PRO_PRICE_LABEL}</li>
                        <li>Jiji marketplace alerts require Alert Pro</li>
                      </ul>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={closeModal}
                        className="
                          flex-1 rounded-xl border border-border px-4 py-3
                          text-sm font-semibold text-text-primary
                          transition-colors duration-fast hover:border-borderHigh hover:bg-surface
                        "
                      >
                        Not now
                      </button>
                      <button
                        onClick={() => void handleSignIn()}
                        className="
                          flex-1 rounded-xl bg-accent px-4 py-3
                          text-sm font-bold text-white
                          transition-colors duration-fast hover:bg-accent-hover
                        "
                      >
                        Sign in to continue
                      </button>
                    </div>

                    <p className="text-center text-sm text-text-secondary">
                      Need an account?{' '}
                      <Link
                        href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                        className="font-semibold text-accent transition-colors duration-fast hover:text-accent-hover"
                      >
                        Create one
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {lowestPrice ? (
                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-4 py-3">
                        <span className="text-xs font-semibold text-text-secondary">
                          {variantLabel ? `Current tracked price for ${variantLabel}` : 'Current lowest price'}
                        </span>
                        <span className="text-sm font-black text-text-primary">
                          {formatNaira(lowestPrice)}
                        </span>
                      </div>
                    ) : null}

                    <div className="space-y-1 rounded-2xl border border-border bg-surface px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Alert destination
                      </p>
                      <p className="text-sm font-medium text-text-primary">
                        {session.user.email}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Decide ties alerts to your account email for better security and alert history.
                      </p>
                    </div>

                    {variantLabel ? (
                      <div className="space-y-1 rounded-2xl border border-accent/20 bg-tealTint px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                          Alert scope
                        </p>
                        <p className="text-sm font-semibold text-text-primary">
                          {variantLabel}
                        </p>
                        <p className="text-xs text-text-secondary">
                          This alert will watch the tracked {variantLabel} configuration instead of the phone model in general.
                        </p>
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-border bg-surface px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        {isPro ? 'Alert Pro' : 'Free Launch'}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {isPro ? (
                          <>
                            You can keep{' '}
                            <span className="font-semibold text-text-primary">
                              10 active alerts
                            </span>
                            , add Smart Nearby matches, and opt into Jiji
                            marketplace leads.
                          </>
                        ) : (
                          <>
                            You can keep{' '}
                            <span className="font-semibold text-text-primary">
                              1 active trusted-store alert
                            </span>
                            . Alert Pro costs{' '}
                            <span className="font-semibold text-text-primary">
                              {ALERT_PRO_PRICE_LABEL}
                            </span>{' '}
                            and unlocks 10 active alerts, Smart Nearby matches,
                            and Jiji marketplace leads.
                          </>
                        )}
                      </p>
                      {!isPro ? (
                        <div className="mt-3 rounded-xl border border-accent/20 bg-tealTint px-3 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                            Alert Pro price
                          </p>
                          <p className="mt-1 text-2xl font-black leading-none text-text-primary">
                            {ALERT_PRO_BUTTON_LABEL}{' '}
                            <span className="text-sm font-bold text-text-secondary">
                              / 30 days
                            </span>
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                            One payment unlocks the extra alert features for the
                            full 30-day period.
                          </p>
                        </div>
                      ) : null}
                      {!isPro ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleUpgrade()}
                            disabled={upgradeLoading}
                            className="mt-3 rounded-lg border border-accent/25 px-3 py-2 text-xs font-bold text-accent transition-colors duration-fast hover:border-accent hover:bg-accent-subtle disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {upgradeLoading
                              ? 'Opening checkout...'
                              : `Upgrade for ${ALERT_PRO_BUTTON_LABEL}`}
                          </button>
                        {pendingReference ? (
                          <button
                            type="button"
                            onClick={() => void handleRefreshProStatus()}
                            disabled={upgradeLoading}
                            className="ml-2 mt-3 rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Refresh Pro status
                          </button>
                        ) : null}
                        </>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="alert-price"
                        className="block text-sm font-semibold text-text-primary"
                      >
                        Alert me when price drops below
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-text-muted">
                          {'\u20A6'}
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
                            w-full rounded-xl border border-border bg-surface
                            py-3 pl-7 pr-3 text-sm text-text-primary
                            placeholder:text-text-muted
                            transition-colors duration-fast focus:border-accent focus:outline-none
                          "
                        />
                      </div>
                      {lowestPrice ? (
                        <p className="text-xs text-text-secondary">
                          Tip: set below{' '}
                          <span className="font-semibold text-text-primary">
                            {formatNaira(lowestPrice)}
                          </span>{' '}
                          to get notified when the tracked price actually drops.
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="alert-store"
                        className="block text-sm font-semibold text-text-primary"
                      >
                        Store <span className="text-xs font-normal text-text-muted">(optional)</span>
                      </label>
                      <select
                        id="alert-store"
                        name="store"
                        value={form.store}
                        onChange={handleChange}
                        className="
                          w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary
                          transition-colors duration-fast focus:border-accent focus:outline-none
                        "
                      >
                        <option value="">Any trusted store</option>
                        <option value="jumia">Jumia</option>
                        <option value="slot">Slot</option>
                        <option value="jiji" disabled={!isPro}>
                          Jiji marketplace (Alert Pro)
                        </option>
                      </select>
                      <p className="text-xs leading-relaxed text-text-muted">
                        Jiji alerts are paid opt-in marketplace leads. They do not change Decide's
                        trusted Jumia/Slot price truth.
                      </p>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-border bg-surface px-4 py-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                          Alert Pro intelligence
                        </p>
                        <p className="mt-1 text-sm text-text-secondary">
                          Smart Nearby Alerts tell you when this phone or a
                          better nearby alternative becomes worth checking.
                        </p>
                      </div>

                      <label
                        className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
                          isPro
                            ? 'border-accent/20 bg-tealTint'
                            : 'border-border bg-bg opacity-75'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="nearby_deals_enabled"
                          checked={form.nearby_deals_enabled}
                          disabled={!isPro}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 accent-accent"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-text-primary">
                            Smart Nearby Alerts
                          </span>
                          <span className="block text-xs leading-relaxed text-text-secondary">
                            Include better nearby options up to 15% above your
                            target, capped at 3 smart notifications per week.
                          </span>
                        </span>
                      </label>

                      <label
                        className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
                          isPro
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-border bg-bg opacity-75'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="marketplace_alerts_enabled"
                          checked={form.marketplace_alerts_enabled}
                          disabled={!isPro}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 accent-accent"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-text-primary">
                            Jiji marketplace leads
                          </span>
                          <span className="block text-xs leading-relaxed text-text-secondary">
                            Opt into cheaper marketplace opportunities with
                            Decide risk wording and inspection-first guidance.
                          </span>
                        </span>
                      </label>

                      {!isPro ? (
                        <p className="text-xs text-text-muted">
                          Locked for Free Launch. Upgrade to Alert Pro for{' '}
                          {ALERT_PRO_PRICE_LABEL} to unlock Smart Nearby Alerts
                          and Jiji leads.
                        </p>
                      ) : null}
                    </div>

                    {error ? (
                      <div
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                        role="alert"
                      >
                        <p className="text-sm font-semibold text-amber-950">{error}</p>
                        {shouldShowUpgrade ? (
                          <button
                            type="button"
                            onClick={() => void handleUpgrade()}
                            disabled={upgradeLoading}
                            className="mt-3 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white transition-colors duration-fast hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {upgradeLoading
                              ? 'Opening checkout...'
                              : `Upgrade for ${ALERT_PRO_BUTTON_LABEL}`}
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {upgradeMessage ? (
                      <div className="rounded-2xl border border-accent/20 bg-tealTint px-4 py-3">
                        <p className="text-sm font-semibold text-accent">
                          {upgradeMessage}
                        </p>
                      </div>
                    ) : null}

                    <div className="sticky bottom-0 -mx-6 -mb-6 flex gap-3 border-t border-border bg-bg/95 px-6 py-4 backdrop-blur">
                      <button
                        onClick={closeModal}
                        className="
                          flex-1 rounded-xl border border-border px-4 py-3
                          text-sm font-semibold text-text-primary
                          transition-colors duration-fast hover:border-borderHigh hover:bg-surface
                        "
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void handleSubmit()}
                        disabled={loading || upgradeLoading || status === 'loading'}
                        className="
                          flex-1 rounded-xl bg-accent px-4 py-3
                          text-sm font-bold text-white
                          transition-colors duration-fast hover:bg-accent-hover
                          disabled:cursor-not-allowed disabled:opacity-50
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
      ) : null}
    </>
  )
}

const PriceAlertButtonFallback = ({
  buttonLabel = 'Set price alert',
  triggerClassName,
  triggerVariant = 'default',
}: {
  buttonLabel?: string
  triggerClassName?: string
  triggerVariant?: 'default' | 'inlinePrimary' | 'inlineSecondary'
}) => (
  <button
    type="button"
    disabled
    className={[
      `
      items-center justify-center gap-2 opacity-70
    `,
      triggerVariant === 'inlinePrimary'
        ? `
          inline-flex w-auto shrink-0
          rounded-md border border-accent bg-accent
          px-4 py-0 h-10
          text-sm font-bold text-white
        `
        : triggerVariant === 'inlineSecondary'
          ? `
          inline-flex w-auto shrink-0
          rounded-md border border-border bg-white
          px-4 py-0 h-10
          text-sm font-semibold text-text-secondary
        `
          : `
          flex w-full
          rounded-sm border border-border bg-surface
          px-4 py-2.5
          text-sm font-semibold text-text-primary
        `,
      triggerClassName ?? '',
    ].join(' ')}
  >
    <BellIcon />
    {buttonLabel}
  </button>
)
