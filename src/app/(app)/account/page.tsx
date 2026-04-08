'use client'

// decide-web/src/app/(app)/account/page.tsx

import React, { useState, useEffect, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatNaira } from '@/lib/formatters'
import { STORE_LABELS } from '@/lib/constants'
import { requestWithBackendAuth } from '@/lib/backendAuth'
import { Divider, Spinner } from '@/components/ui'
import { StarRating } from '@/components/phone/StarRating'
import type { PriceAlert } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────

interface UserReview {
  id:         string
  phone_id:   number
  rating:     number
  title:      string | null
  comment:    string
  pros:        string | null
  cons:        string | null
  status:     string
  created_at: string
  phone_name?: string
  phone_slug?: string
}

interface MobileSessionSummary {
  id: string
  created_at: string
  updated_at: string
  expires_at: string
  last_used_at: string | null
  current: boolean
}

interface RevokeSessionResult {
  revoked_current_session: boolean
}

interface RevokeOtherSessionsResult {
  revoked_count: number
}

const formatSessionDateTime = (value: string | null) => {
  if (!value) return 'Not recorded yet'

  return new Date(value).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ── Tab type ───────────────────────────────────────────────────────────────

type Tab = 'profile' | 'reviews' | 'alerts' | 'sessions'

// ── Main page ──────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { data: session, status, update } = useSession()
  const router                            = useRouter()
  const [activeTab, setActiveTab]         = useState<Tab>('profile')

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-96"><Spinner centered /></div>
  }

  if (!session) return null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile'     },
    { key: 'reviews', label: 'My Reviews'  },
    { key: 'alerts',  label: 'My Alerts'   },
    { key: 'sessions', label: 'Sessions'   },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-black shrink-0">
          {session.user.name
            ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            : (session.user.email ?? '?')[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            {session.user.name ?? 'My Account'}
          </h1>
          <p className="text-sm text-text-secondary">{session.user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={[
              'px-4 py-2.5 text-sm font-semibold transition-colors duration-fast relative',
              activeTab === key
                ? 'text-text-primary'
                : 'text-text-muted hover:text-text-secondary',
            ].join(' ')}
          >
            {label}
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileTab session={session} onSessionUpdate={update} />}
      {activeTab === 'reviews' && <ReviewsTab />}
      {activeTab === 'alerts'  && <AlertsTab />}
      {activeTab === 'sessions' && <SessionsTab />}

    </div>
  )
}

// ── Profile Tab ────────────────────────────────────────────────────────────

const ProfileTab = ({ session, onSessionUpdate }: { session: any; onSessionUpdate: (data?: any) => Promise<any> }) => {
  const [displayName,    setDisplayName]    = useState(session.user.name ?? '')
  const [currentPw,      setCurrentPw]      = useState('')
  const [newPw,          setNewPw]          = useState('')
  const [confirmPw,      setConfirmPw]      = useState('')
  const [deleteCurrentPw, setDeleteCurrentPw] = useState('')
  const [saving,         setSaving]         = useState(false)
  const [pwSaving,       setPwSaving]       = useState(false)
  const [profileMsg,     setProfileMsg]     = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwMsg,          setPwMsg]          = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteMsg,      setDeleteMsg]      = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading,  setDeleteLoading]  = useState(false)
  const router = useRouter()

  const isGoogleUser = session.user.provider === 'google'

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setProfileMsg(null)
    try {
      await requestWithBackendAuth('/auth/me/profile', {
        method:  'PATCH',
        body:    JSON.stringify({ display_name: displayName }),
      })
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' })
      await onSessionUpdate({ name: displayName })
    } catch (error) {
      setProfileMsg({
        type: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)

    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPw.length < 8) {
      setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }

    setPwSaving(true)
    try {
      await requestWithBackendAuth('/auth/me/change-password', {
        method:  'POST',
        body:    JSON.stringify({ current_password: currentPw, new_password: newPw }),
      })
      setPwMsg({ type: 'success', text: 'Password changed successfully.' })
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (error) {
      setPwMsg({
        type: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setPwSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteMsg(null)

    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteMsg({ type: 'error', text: 'Type DELETE to confirm account deletion.' })
      return
    }

    if (!isGoogleUser && !deleteCurrentPw.trim()) {
      setDeleteMsg({ type: 'error', text: 'Current password is required to delete this account.' })
      return
    }

    if (isGoogleUser && !session.googleIdToken) {
      setDeleteMsg({ type: 'error', text: 'Re-authenticate with Google before deleting this account.' })
      return
    }

    setDeleteLoading(true)
    try {
      await requestWithBackendAuth<null>('/auth/me/account', {
        method:  'DELETE',
        body:    JSON.stringify({
          confirmation_text: deleteConfirmText.trim(),
          current_password: isGoogleUser ? undefined : deleteCurrentPw,
          google_id_token: isGoogleUser ? session.googleIdToken : undefined,
        }),
      })
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      setDeleteMsg({
        type: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      })
      setDeleteLoading(false)
    }
  }

  const handleGoogleReauth = async () => {
    await signIn('google', { callbackUrl: '/account' }, { prompt: 'select_account' })
  }

  return (
    <div className="space-y-8">

      {/* Display name */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <h2 className="text-base font-bold text-text-primary">Profile</h2>
        <div className="space-y-1.5">
          <label htmlFor="display-name" className="block text-sm font-semibold text-text-primary">
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full max-w-sm px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">Email: </span>
            {session.user.email}
          </p>
          {isGoogleUser && (
            <p className="text-xs text-text-muted">Signed in with Google — password changes are not available.</p>
          )}
        </div>
        {profileMsg && (
          <p className={`text-sm ${profileMsg.type === 'success' ? 'text-green-600' : 'text-error'}`}>
            {profileMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="h-9 px-5 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <Divider />

      {/* Change password — only for credentials users */}
      {!isGoogleUser && (
        <>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h2 className="text-base font-bold text-text-primary">Change Password</h2>
            {(['Current password', 'New password', 'Confirm new password'] as const).map((label, i) => {
              const value    = [currentPw, newPw, confirmPw][i]
              const setValue = [setCurrentPw, setNewPw, setConfirmPw][i]
              const id       = ['current-pw', 'new-pw', 'confirm-pw'][i]
              return (
                <div key={id} className="space-y-1.5">
                  <label htmlFor={id} className="block text-sm font-semibold text-text-primary">
                    {label}
                  </label>
                  <input
                    id={id}
                    type="password"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="••••••••"
                    className="w-full max-w-sm px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
                  />
                </div>
              )
            })}
            {pwMsg && (
              <p className={`text-sm ${pwMsg.type === 'success' ? 'text-green-600' : 'text-error'}`}>
                {pwMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwSaving}
              className="h-9 px-5 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
            >
              {pwSaving ? 'Updating...' : 'Update password'}
            </button>
          </form>
          <Divider />
        </>
      )}

      {/* Danger zone */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-error">Danger Zone</h2>
        <p className="text-sm text-text-secondary">
          Permanently delete your account and all your data — reviews, alerts, and preferences.
          This cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="h-9 px-5 rounded-sm border border-error text-error text-sm font-bold hover:bg-error hover:text-white transition-colors duration-fast"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-surface border border-error/30 rounded-md">
            <p className="text-sm font-semibold text-text-primary">
              Are you sure? This will permanently delete everything.
            </p>
            <div className="space-y-1.5">
              <label htmlFor="delete-confirmation" className="block text-sm font-semibold text-text-primary">
                Type DELETE to confirm
              </label>
              <input
                id="delete-confirmation"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full max-w-sm px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-error transition-colors duration-fast"
              />
            </div>
            {!isGoogleUser && (
              <div className="space-y-1.5">
                <label htmlFor="delete-current-password" className="block text-sm font-semibold text-text-primary">
                  Current password
                </label>
                <input
                  id="delete-current-password"
                  type="password"
                  value={deleteCurrentPw}
                  onChange={(e) => setDeleteCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  className="w-full max-w-sm px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-error transition-colors duration-fast"
                />
              </div>
            )}
            {isGoogleUser && (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  Before deleting a Google-linked Decide account, confirm again with Google so the backend can verify a fresh provider token.
                </p>
                <button
                  onClick={handleGoogleReauth}
                  className="h-9 px-5 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast"
                >
                  Continue with Google
                </button>
              </div>
            )}
            {deleteMsg && (
              <p className={`text-sm ${deleteMsg.type === 'success' ? 'text-green-600' : 'text-error'}`}>
                {deleteMsg.text}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="h-9 px-5 rounded-sm bg-error text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="h-9 px-4 rounded-sm text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors duration-fast"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

// ── Reviews Tab ────────────────────────────────────────────────────────────

const ReviewsTab = () => {
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    try {
      const data = await requestWithBackendAuth<UserReview[]>('/reviews/me')
      setReviews(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleDelete = async (review_id: string) => {
    setDeleting(review_id)
    try {
      await requestWithBackendAuth<null>(`/reviews/me/${review_id}`, {
        method:  'DELETE',
      })
      setReviews((prev) => prev.filter((r) => r.id !== review_id))
    } catch {
      // silently fail
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <Spinner centered />

  if (reviews.length === 0) {
    return (
      <div className="py-16 text-center space-y-2">
        <p className="text-2xl" aria-hidden="true">✍️</p>
        <p className="text-base font-semibold text-text-primary">No reviews yet</p>
        <p className="text-sm text-text-secondary">
          Browse phones and share your experience to help other Nigerians decide.
        </p>
        <Link href="/phones" className="inline-block mt-2 text-sm text-accent font-semibold hover:text-accent-hover transition-colors duration-fast">
          Browse phones →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
      {reviews.map((review) => (
        <div key={review.id} className="bg-surface border border-border rounded-md p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              {review.phone_slug ? (
                <Link
                  href={`/phones/${review.phone_slug}`}
                  className="text-sm font-bold text-text-primary hover:text-accent transition-colors duration-fast"
                >
                  {review.phone_name ?? review.phone_slug}
                </Link>
              ) : (
                <p className="text-sm font-bold text-text-primary">Unknown phone</p>
              )}
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-xs text-text-muted">
                  {new Date(review.created_at).toLocaleDateString('en-NG', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </span>
                {review.status !== 'approved' && (
                  <span className="text-xs font-semibold text-amber-600 capitalize">
                    {review.status}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDelete(review.id)}
              disabled={deleting === review.id}
              className="text-xs text-text-muted hover:text-error transition-colors duration-fast shrink-0 disabled:opacity-50"
            >
              {deleting === review.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
          {review.title && (
            <p className="text-sm font-semibold text-text-primary">{review.title}</p>
          )}
          <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>
          {(review.pros || review.cons) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {review.pros && (
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">Pros</p>
                  <p className="text-xs text-text-secondary">{review.pros}</p>
                </div>
              )}
              {review.cons && (
                <div>
                  <p className="text-xs font-bold text-error uppercase tracking-wide mb-1">Cons</p>
                  <p className="text-xs text-text-secondary">{review.cons}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Alerts Tab ─────────────────────────────────────────────────────────────

const AlertsTab = () => {
  const [alerts,  setAlerts]  = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await requestWithBackendAuth<PriceAlert[]>('/alerts/me')
        setAlerts(data)
      } catch (fetchError) {
        setError(
          fetchError instanceof Error ? fetchError.message : 'Could not load alerts.'
        )
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [])

  const handleDelete = async (alertId: number) => {
    try {
      await requestWithBackendAuth<null>(`/alerts/me/${alertId}`, {
        method: 'DELETE',
      })
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete alert. Please try again.'
      )
    }
  }

  if (loading) return <Spinner centered />

  if (error) return <p className="text-sm text-error">{error}</p>

  if (alerts.length === 0) {
    return (
      <div className="py-16 text-center space-y-2">
        <p className="text-2xl" aria-hidden="true">🔔</p>
        <p className="text-base font-semibold text-text-primary">No alerts yet</p>
        <p className="text-sm text-text-secondary">
          Browse phones and set a target price to get notified when it drops.
        </p>
        <Link href="/phones" className="inline-block mt-2 text-sm text-accent font-semibold hover:text-accent-hover transition-colors duration-fast">
          Browse phones →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
      </p>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between gap-4 px-4 py-3 bg-surface border border-border rounded-md"
        >
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">{alert.phone_name}</p>
            <p className="text-xs text-text-secondary">
              Alert when price drops below{' '}
              <span className="font-semibold text-accent">{formatNaira(alert.target_price)}</span>
              {alert.store && <> on {STORE_LABELS[alert.store]}</>}
            </p>
          </div>
          <button
            onClick={() => handleDelete(alert.id)}
            className="text-xs font-semibold text-text-muted hover:text-error transition-colors duration-fast shrink-0"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}

const SessionsTab = () => {
  const [sessions, setSessions] = useState<MobileSessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionMessage, setSessionMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)
  const [revokingOthers, setRevokingOthers] = useState(false)

  const fetchSessions = useCallback(async () => {
    try {
      const data = await requestWithBackendAuth<MobileSessionSummary[]>('/mobile-auth/sessions')
      setSessions(data)
      setError(null)
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Could not load active sessions.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSessions()
  }, [fetchSessions])

  const handleRevokeSession = async (sessionId: string) => {
    setSessionMessage(null)
    setRevokingSessionId(sessionId)

    try {
      const result = await requestWithBackendAuth<RevokeSessionResult>(
        `/mobile-auth/sessions/${sessionId}`,
        { method: 'DELETE' }
      )

      if (result.revoked_current_session) {
        await signOut({ callbackUrl: '/login' })
        return
      }

      setSessions((prev) => prev.filter((session) => session.id !== sessionId))
      setSessionMessage({
        type: 'success',
        text: 'That device session has been revoked.',
      })
    } catch (revokeError) {
      setSessionMessage({
        type: 'error',
        text:
          revokeError instanceof Error
            ? revokeError.message
            : 'Could not revoke that session.',
      })
    } finally {
      setRevokingSessionId(null)
    }
  }

  const handleRevokeOthers = async () => {
    setSessionMessage(null)
    setRevokingOthers(true)

    try {
      const result = await requestWithBackendAuth<RevokeOtherSessionsResult>(
        '/mobile-auth/sessions/revoke-others',
        { method: 'POST' }
      )

      setSessions((prev) => prev.filter((session) => session.current))
      setSessionMessage({
        type: 'success',
        text:
          result.revoked_count > 0
            ? `Revoked ${result.revoked_count} other session${result.revoked_count === 1 ? '' : 's'}.`
            : 'No other active sessions were found.',
      })
    } catch (revokeError) {
      setSessionMessage({
        type: 'error',
        text:
          revokeError instanceof Error
            ? revokeError.message
            : 'Could not revoke other sessions.',
      })
    } finally {
      setRevokingOthers(false)
    }
  }

  const currentSession = sessions.find((session) => session.current) ?? null
  const otherSessions = sessions.filter((session) => !session.current)

  if (loading) return <Spinner centered />
  if (error) return <p className="text-sm text-error">{error}</p>

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-text-primary">Session Security</h2>
        <p className="text-sm text-text-secondary">
          Review where your Decide account is still signed in and revoke access you no longer trust.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <p className="text-base font-semibold text-text-primary">No active sessions found</p>
          <p className="text-sm text-text-secondary">
            If this browser signed in before the latest security upgrade, sign out and sign in again to refresh session tracking.
          </p>
        </div>
      ) : (
        <>
          {currentSession ? (
            <div className="bg-surface border border-border rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-text-primary">This browser</p>
                  <p className="text-xs text-text-secondary">
                    Last used {formatSessionDateTime(currentSession.last_used_at)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Signed in {formatSessionDateTime(currentSession.created_at)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Refresh valid until {formatSessionDateTime(currentSession.expires_at)}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-tealTint px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
                  Current
                </span>
              </div>
              <button
                onClick={() => void handleRevokeSession(currentSession.id)}
                disabled={revokingSessionId === currentSession.id}
                className="h-9 px-4 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast disabled:opacity-50"
              >
                {revokingSessionId === currentSession.id
                  ? 'Signing out...'
                  : 'Sign out this browser'}
              </button>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-md p-4 space-y-2">
              <p className="text-sm font-bold text-text-primary">Current browser not identified yet</p>
              <p className="text-sm text-text-secondary">
                This usually means this browser session predates the latest session-security upgrade. Sign out and sign in again to attach full session controls to this device.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text-primary">Other active sessions</p>
                <p className="text-xs text-text-muted">
                  {otherSessions.length} other session{otherSessions.length === 1 ? '' : 's'}
                </p>
              </div>
              {otherSessions.length > 0 && (
                <button
                  onClick={() => void handleRevokeOthers()}
                  disabled={revokingOthers}
                  className="h-9 px-4 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
                >
                  {revokingOthers ? 'Revoking...' : 'Revoke other sessions'}
                </button>
              )}
            </div>

            {otherSessions.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No other active Decide sessions are attached to this account right now.
              </p>
            ) : (
              otherSessions.map((session) => (
                <div key={session.id} className="bg-surface border border-border rounded-md p-4 space-y-2">
                  <p className="text-sm font-bold text-text-primary">Signed-in device</p>
                  <p className="text-xs text-text-secondary">
                    Last used {formatSessionDateTime(session.last_used_at)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Signed in {formatSessionDateTime(session.created_at)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Refresh valid until {formatSessionDateTime(session.expires_at)}
                  </p>
                  <button
                    onClick={() => void handleRevokeSession(session.id)}
                    disabled={revokingSessionId === session.id}
                    className="h-9 px-4 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast disabled:opacity-50"
                  >
                    {revokingSessionId === session.id ? 'Revoking...' : 'Revoke access'}
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {sessionMessage && (
        <p className={`text-sm ${sessionMessage.type === 'success' ? 'text-green-600' : 'text-error'}`}>
          {sessionMessage.text}
        </p>
      )}
    </div>
  )
}
