'use client'

// decide-web/src/app/admin/reviews/page.tsx

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { StarRating } from '@/components/phone/StarRating'
import { requestAdminJson } from '@/lib/adminApi'

interface AdminReview {
  id:                string
  phone_id:          number
  phone_name:        string
  phone_slug:        string
  user_display_name: string | null
  rating:            number
  title:             string | null
  comment:           string
  pros:              string | null
  cons:              string | null
  status:            string
  is_flagged:        boolean
  created_at:        string
}

type Filter = 'all' | 'flagged' | 'pending' | 'rejected'

export default function AdminReviewsPage() {
  const searchParams             = useSearchParams()
  const [reviews,  setReviews]  = useState<AdminReview[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<Filter>(
    (searchParams.get('filter') as Filter) ?? 'all'
  )

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const query = filter === 'flagged' ? '/reviews?filter=flagged' : '/reviews'
      const json = await requestAdminJson<{ success: boolean; data: AdminReview[] }>(query)
      if (json.success) {
        let data: AdminReview[] = json.data
        if (filter === 'pending')  data = data.filter((r) => r.status === 'pending')
        if (filter === 'rejected') data = data.filter((r) => r.status === 'rejected')
        setReviews(data)
      }
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const setStatus = async (id: string, status: string) => {
    await requestAdminJson<{ success: boolean; message: string }>(`/reviews/${id}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
  }

  const unflag = async (id: string) => {
    await requestAdminJson<{ success: boolean; message: string }>(`/reviews/${id}/unflag`, {
      method: 'POST',
    })
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, is_flagged: false } : r))
  }

  const deleteReview = async (id: string) => {
    await requestAdminJson<{ success: boolean; message: string }>(`/reviews/${id}`, {
      method: 'DELETE',
    })
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',      label: 'All'      },
    { key: 'flagged',  label: 'Flagged'  },
    { key: 'pending',  label: 'Pending'  },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Reviews</h1>
        <p className="text-sm text-text-secondary mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={[
              'px-4 py-2 text-sm font-semibold transition-colors duration-fast relative',
              filter === key ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary',
            ].join(' ')}
          >
            {label}
            {filter === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-md p-4 animate-pulse h-28" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center text-text-muted text-sm">No reviews found.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className={[
              'bg-surface border rounded-md p-4 space-y-3',
              review.is_flagged ? 'border-amber-300' : 'border-border',
            ].join(' ')}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/phones/${review.phone_slug}`} className="text-sm font-bold text-accent hover:underline">
                      {review.phone_name}
                    </Link>
                    <span className="text-xs text-text-muted">by {review.user_display_name ?? 'Anonymous'}</span>
                    <span className="text-xs text-text-muted">
                      {new Date(review.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {review.is_flagged && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Flagged</span>
                    )}
                    <span className={[
                      'text-xs font-bold px-1.5 py-0.5 rounded capitalize',
                      review.status === 'approved'  ? 'text-green-700 bg-green-50'  : '',
                      review.status === 'pending'   ? 'text-amber-700 bg-amber-50'  : '',
                      review.status === 'rejected'  ? 'text-red-700 bg-red-50'      : '',
                    ].join(' ')}>
                      {review.status}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  {review.title && <p className="text-sm font-semibold text-text-primary">{review.title}</p>}
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{review.comment}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
                {review.status !== 'approved'  && <ActionBtn onClick={() => setStatus(review.id, 'approved')}  label="Approve"  color="green" />}
                {review.status !== 'pending'   && <ActionBtn onClick={() => setStatus(review.id, 'pending')}   label="Pending"  color="amber" />}
                {review.status !== 'rejected'  && <ActionBtn onClick={() => setStatus(review.id, 'rejected')}  label="Reject"   color="red"   />}
                {review.is_flagged             && <ActionBtn onClick={() => unflag(review.id)}                 label="Unflag"   color="slate" />}
                <ActionBtn onClick={() => deleteReview(review.id)} label="Delete" color="red" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const ActionBtn = ({
  onClick, label, color,
}: {
  onClick: () => void
  label:   string
  color:   'green' | 'amber' | 'red' | 'slate'
}) => {
  const colorMap = {
    green: 'text-green-700 hover:bg-green-50 border-green-200',
    amber: 'text-amber-700 hover:bg-amber-50 border-amber-200',
    red:   'text-red-700   hover:bg-red-50   border-red-200',
    slate: 'text-slate-600 hover:bg-slate-50 border-slate-200',
  }
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors duration-fast ${colorMap[color]}`}
    >
      {label}
    </button>
  )
}
