'use client'

// decide-web/src/components/phone/ReviewForm.tsx
// Auth-gated review form. Shows sign-in prompt if not logged in.
// Submits to decide-api POST /api/v1/reviews.

import React, { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { requestWithBackendAuth } from '@/lib/backendAuth'
import { StarRating } from './StarRating'

interface ReviewFormProps {
  phoneId:     number
  phoneName:   string
  onSubmitted: () => void  // parent calls this to refresh the review list
}

export const ReviewForm = ({ phoneId, phoneName, onSubmitted }: ReviewFormProps) => {
  const { data: session } = useSession()

  const [rating,  setRating]  = useState(0)
  const [title,   setTitle]   = useState('')
  const [comment, setComment] = useState('')
  const [pros,    setPros]    = useState('')
  const [cons,    setCons]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!session) {
    return (
      <div className="bg-tealTint border border-accent/20 rounded-md px-5 py-6 text-center space-y-3">
        <p className="text-sm font-semibold text-text-primary">
          Share your experience with the {phoneName}
        </p>
        <p className="text-sm text-text-secondary">
          Sign in to write a review and help other Nigerians make the right choice.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="h-9 px-5 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast inline-flex items-center"
          >
            Sign in to review
          </Link>
          <Link
            href="/register"
            className="h-9 px-4 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast inline-flex items-center"
          >
            Create account
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-tealTint border border-accent/20 rounded-md px-5 py-6 text-center space-y-2">
        <p className="text-sm font-bold text-text-primary">Thanks for your review!</p>
        <p className="text-sm text-text-secondary">
          Your review is now live and helping other buyers decide.
        </p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }

    if (comment.trim().length < 20) {
      setError('Comment must be at least 20 characters.')
      return
    }

    setLoading(true)

    try {
      await requestWithBackendAuth('/reviews/me', {
        method: 'POST',
        body: JSON.stringify({
          phone_id: phoneId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          pros: pros.trim() || undefined,
          cons: cons.trim() || undefined,
        }),
      })

      setSuccess(true)
      onSubmitted()
    } catch (error) {
      setError((error as Error).message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm font-semibold text-text-primary">
        Write a review for {phoneName}
      </p>

      {/* Star rating */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-text-primary">
          Your rating <span className="text-error">*</span>
        </label>
        <StarRating
          rating={rating}
          interactive
          size="lg"
          onChange={setRating}
        />
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="review-title" className="block text-sm font-semibold text-text-primary">
          Title <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="e.g. Great battery life but camera could be better"
          className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
        />
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <label htmlFor="review-comment" className="block text-sm font-semibold text-text-primary">
          Review <span className="text-error">*</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          placeholder="Share your experience — how has this phone performed for you? Would you recommend it?"
          className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast resize-none"
        />
        <p className="text-xs text-text-muted text-right">{comment.length}/2000</p>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="review-pros" className="block text-sm font-semibold text-text-primary">
            Pros <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="review-pros"
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What do you love about it?"
            className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="review-cons" className="block text-sm font-semibold text-text-primary">
            Cons <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="review-cons"
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What could be improved?"
            className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast resize-none"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-error" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-10 px-6 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  )
}
