'use client'

import { useEffect } from 'react'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const ResetTokenRedirectContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) return

    router.replace(`/reset-password?token=${encodeURIComponent(token)}`)
  }, [router, token])

  return null
}

export const ResetTokenRedirect = () => (
  <Suspense fallback={null}>
    <ResetTokenRedirectContent />
  </Suspense>
)
