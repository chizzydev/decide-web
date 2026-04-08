// decide-web/src/components/layout/CompareTray.tsx
// Persistent bottom bar that appears when the user adds a phone
// to the comparison tray from anywhere in the app.
// Supports up to 2 phones. Navigates to /compare when both slots are filled.

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCompareStore } from '@/store/compareStore'
import { Button } from '@/components/ui'

export const CompareTray = () => {
  const router = useRouter()
  const phones = useCompareStore((s) => s.phones)
  const isVisible = useCompareStore((s) => s.isVisible)
  const isTrayFull = useCompareStore((s) => s.isTrayFull)
  const removePhone = useCompareStore((s) => s.removePhone)
  const clearAll = useCompareStore((s) => s.clearAll)
  const getFilledSlots = useCompareStore((s) => s.getFilledSlots)

  const handleCompare = (): void => {
    if (!isTrayFull()) return

    const [phoneA, phoneB] = phones
    if (!phoneA || !phoneB) return

    router.push(`/compare?slug_a=${phoneA.slug}&slug_b=${phoneB.slug}`)
  }

  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-sticky border-t border-border bg-surface shadow-lg"
      role="region"
      aria-label="Phone comparison tray"
      aria-live="polite"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Label — hidden on very small screens */}
        <p className="hidden sm:block text-xs font-semibold text-text-muted uppercase tracking-wider shrink-0">
          Compare
        </p>

        {/* Phone slots */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {[0, 1].map((index) => {
            const phone = phones[index]

            return (
              <div
                key={index}
                className={[
                  'flex items-center gap-2 flex-1 min-w-0',
                  'h-10 px-3 rounded-sm border',
                  phone
                    ? 'bg-surfaceHigh border-borderHigh'
                    : 'border-dashed border-border',
                ].join(' ')}
              >
                {phone ? (
                  <>
                    {/* Phone image */}
                    {phone.image_url ? (
                      <Image
                        src={phone.image_url}
                        alt={phone.name}
                        width={24}
                        height={24}
                        className="w-6 h-6 object-contain shrink-0"
                      />
                    ) : (
                      <PhonePlaceholderIcon />
                    )}

                    {/* Phone name */}
                    <span className="text-sm font-medium text-text-primary truncate flex-1 min-w-0">
                      {phone.name}
                    </span>

                    {/* Remove button */}
                    <button
                      onClick={() => removePhone(phone.slug)}
                      className="shrink-0 text-text-muted hover:text-error transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
                      aria-label={`Remove ${phone.name} from comparison`}
                    >
                      <RemoveIcon />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-text-muted">
                    Add a phone
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Clear all */}
          <button
            onClick={clearAll}
            className="hidden sm:block text-xs text-text-muted hover:text-text-secondary transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm px-1"
            aria-label="Clear comparison tray"
          >
            Clear
          </button>

          {/* Compare button — disabled until both slots are filled */}
          <Button
            size="sm"
            onClick={handleCompare}
            disabled={!isTrayFull()}
            aria-label={
              isTrayFull()
                ? 'Compare selected phones'
                : 'Add another phone to compare'
            }
          >
            {isTrayFull() ? 'Compare' : `${getFilledSlots().length} / 2`}
          </Button>
        </div>
      </div>
    </div>
  )
}

const RemoveIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M9 3L3 9M3 3L9 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const PhonePlaceholderIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-text-muted shrink-0"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="1"
      width="10"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle cx="8" cy="12" r="0.75" fill="currentColor" />
  </svg>
)