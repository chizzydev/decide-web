'use client'

// decide-web/src/components/phone/ReviewList.tsx
// Fetches and displays reviews for a phone.
// Also handles the ReviewForm and refreshes on new submission.

import React, { useState, useEffect, useCallback } from 'react'
import { StarRating }  from './StarRating'
import { ReviewForm }  from './ReviewForm'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Review {
  id:                string
  user_id:           string
  rating:            number
  title:             string | null
  comment:           string
  pros:              string | null
  cons:              string | null
  created_at:        string
  user_display_name: string | null
}

interface ReviewListProps {
  phoneId:   number
  phoneName: string
}

export const ReviewList = ({ phoneId, phoneName }: ReviewListProps) => {
  const [reviews,  setReviews]  = useState<Review[]>([])
  const [average,  setAverage]  = useState(0)
  const [count,    setCount]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [flagged,  setFlagged]  = useState<Set<string>>(new Set())

  const fetchReviews = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/v1/reviews?phone_id=${phoneId}`)
      const json = await res.json()
      if (json.success) {
        setReviews(json.data.reviews)
        setAverage(json.data.average)
        setCount(json.data.count)
      }
    } catch {
      // silently fail — reviews are non-critical
    } finally {
      setLoading(false)
    }
  }, [phoneId])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleFlag = async (review_id: string) => {
    try {
      await fetch(`${API_URL}/api/v1/reviews/${review_id}/flag`, { method: 'POST' })
      setFlagged((prev) => new Set(prev).add(review_id))
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-8">

      {/* Section header + average */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-text-primary">User Reviews</h2>
          {count > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={average} size="sm" />
              <span className="text-sm font-semibold text-text-primary">{average.toFixed(1)}</span>
              <span className="text-sm text-text-muted">({count} {count === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}
        </div>
      </div>

      {/* Review form */}
      <div className="bg-surface border border-border rounded-md p-5">
        <ReviewForm
          phoneId={phoneId}
          phoneName={phoneName}
          onSubmitted={fetchReviews}
        />
      </div>

      {/* Review list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-md p-5 space-y-3 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-1/4" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-text-muted">
          <p className="text-sm">No reviews yet — be the first to review this phone.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-surface border border-border rounded-md p-5 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                      {review.user_display_name ?? 'Anonymous'}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(review.created_at).toLocaleDateString('en-NG', {
                        year:  'numeric',
                        month: 'short',
                        day:   'numeric',
                      })}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                {/* Flag button */}
                {!flagged.has(review.id) ? (
                  <button
                    onClick={() => handleFlag(review.id)}
                    className="text-xs text-text-muted hover:text-error transition-colors duration-fast shrink-0"
                    title="Report this review"
                  >
                    Report
                  </button>
                ) : (
                  <span className="text-xs text-text-muted shrink-0">Reported</span>
                )}
              </div>

              {/* Title */}
              {review.title && (
                <p className="text-sm font-semibold text-text-primary">{review.title}</p>
              )}

              {/* Comment */}
              <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>

              {/* Pros & Cons */}
              {(review.pros || review.cons) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {review.pros && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Pros</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{review.pros}</p>
                    </div>
                  )}
                  {review.cons && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-error uppercase tracking-wide">Cons</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{review.cons}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}