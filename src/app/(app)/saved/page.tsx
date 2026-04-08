'use client'

// decide-web/src/app/(app)/saved/page.tsx

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui'
import { requestWithBackendAuth } from '@/lib/backendAuth'
import { formatNaira } from '@/lib/formatters'

interface SavedPhone {
  id:         string
  phone_id:   number
  name:       string
  slug:       string
  brand_name: string
  image_url:  string | null
  price_ngn:  number | null
}

export default function SavedPage() {
  const { data: session, status } = useSession()
  const router                    = useRouter()
  const [phones,  setPhones]  = useState<SavedPhone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (!session?.user?.id) return

    requestWithBackendAuth<SavedPhone[]>('/saved/me')
      .then((data) => setPhones(data))
      .finally(() => setLoading(false))
  }, [session?.user?.id, status, router])

  const handleUnsave = async (phone_id: number) => {
    if (!session?.user?.id) return
    setPhones((prev) => prev.filter((p) => p.phone_id !== phone_id))
    await requestWithBackendAuth<null>('/saved/me/' + phone_id, {
      method: 'DELETE',
    }).catch(() => {})
  }

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-96"><Spinner centered /></div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Saved Phones</h1>
        <p className="text-sm text-text-secondary">
          {phones.length > 0
            ? `${phones.length} phone${phones.length !== 1 ? 's' : ''} saved`
            : 'Your saved phones will appear here'}
        </p>
      </div>

      {phones.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="text-4xl">🤍</div>
          <p className="text-base font-semibold text-text-primary">No saved phones yet</p>
          <p className="text-sm text-text-secondary">
            Tap the heart icon on any phone to save it here for later.
          </p>
          <Link
            href="/phones"
            className="inline-block mt-2 h-9 px-5 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast"
          >
            Browse phones
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {phones.map((phone) => (
            <div
              key={phone.id}
              className="bg-surface border border-border rounded-md overflow-hidden hover:border-borderHigh hover:shadow-md transition-all duration-normal group"
            >
              <Link href={`/phones/${phone.slug}`} className="block">
                {/* Image */}
                <div className="flex items-center justify-center h-40 bg-surfaceHigh">
                  {phone.image_url && !phone.image_url.includes('placeholder') ? (
                    <Image
                      src={phone.image_url}
                      alt={phone.name}
                      width={120}
                      height={120}
                      className="object-contain w-28 h-28 group-hover:scale-105 transition-transform duration-slow"
                    />
                  ) : (
                    <PhonePlaceholder />
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-1">
                  <p className="text-xs text-text-muted font-medium">{phone.brand_name}</p>
                  <p className="text-sm font-bold text-text-primary leading-snug line-clamp-2">
                    {phone.name}
                  </p>
                  {phone.price_ngn && (
                    <p className="text-sm font-black text-accent">
                      {formatNaira(phone.price_ngn)}
                    </p>
                  )}
                </div>
              </Link>

              {/* Remove button */}
              <div className="px-3 pb-3">
                <button
                  onClick={() => handleUnsave(phone.phone_id)}
                  className="w-full h-8 rounded-sm border border-border text-xs font-semibold text-text-muted hover:border-error hover:text-error transition-colors duration-fast"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PhonePlaceholder = () => (
  <div className="flex flex-col items-center gap-2 text-slate-300">
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="10" y="4" width="28" height="40" rx="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="24" cy="38" r="2" fill="currentColor"/>
    </svg>
  </div>
)
