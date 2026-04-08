// decide-web/src/components/phone/PhoneFilters.tsx
// Filter bar for the phones browse page.
// Updates URL search params on change — the page re-fetches server-side.

'use client'

import React, { useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ANDROID_BRANDS, BUDGET_TIERS } from '@/lib/constants'

interface PhoneFiltersProps {
  currentBrand?:    string
  currentOs?:       string
  currentMaxPrice?: number
  currentSearch?:   string
}

export const PhoneFilters = ({
  currentBrand,
  currentOs,
  currentMaxPrice,
  currentSearch,
}: PhoneFiltersProps) => {
  const router     = useRouter()
  const pathname   = usePathname()
  const [, startTransition] = useTransition()

  const updateParams = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(window.location.search)

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    // Reset to first page when filters change
    params.delete('offset')

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasActiveFilters = !!(currentBrand || currentOs || currentMaxPrice || currentSearch)

  return (
    <div className="space-y-3">

      {/* Search */}
      <input
        type="search"
        placeholder="Search phones..."
        defaultValue={currentSearch ?? ''}
        onChange={(e) => {
          const val = e.target.value.trim()
          updateParams('q', val || undefined)
        }}
        className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md
                   text-text-primary placeholder:text-text-muted
                   focus:outline-none focus:ring-1 focus:ring-accent"
      />

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">

        {/* OS filter */}
        <select
          value={currentOs ?? ''}
          onChange={(e) => updateParams('os_type', e.target.value || undefined)}
          className="px-3 py-1.5 text-xs bg-surface border border-border rounded-md
                     text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All OS</option>
          <option value="android">Android</option>
          <option value="ios">iPhone</option>
        </select>

        {/* Brand filter — only shown for Android or no OS filter */}
        {currentOs !== 'ios' && (
          <select
            value={currentBrand ?? ''}
            onChange={(e) => updateParams('brand', e.target.value || undefined)}
            className="px-3 py-1.5 text-xs bg-surface border border-border rounded-md
                       text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Brands</option>
            {ANDROID_BRANDS.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.label}
              </option>
            ))}
          </select>
        )}

        {/* Budget filter */}
        <select
          value={currentMaxPrice ?? ''}
          onChange={(e) => updateParams('max_price', e.target.value || undefined)}
          className="px-3 py-1.5 text-xs bg-surface border border-border rounded-md
                     text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Budgets</option>
          {BUDGET_TIERS.map((t) => (
            <option key={t.max} value={t.max}>
              {t.label} ({t.range})
            </option>
          ))}
        </select>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary
                       border border-border rounded-md bg-surface transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

    </div>
  )
}