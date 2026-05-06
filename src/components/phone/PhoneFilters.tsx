// decide-web/src/components/phone/PhoneFilters.tsx
// Filter bar for the phones browse page.
// Keeps URL state clean and avoids refetching on every keystroke.

'use client'

import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { BUDGET_TIERS } from '@/lib/constants'
import {
  normalizePhoneBrowseSearch,
  normalizePhoneBrowseSearchForBrandChange,
} from '@/lib/phoneBrowseFilters'
import type { Brand } from '@/types'

interface PhoneFiltersProps {
  currentBrand?: string
  currentOs?: string
  currentMaxPrice?: number
  currentSearch?: string
  androidBrands: Brand[]
}

export const PhoneFilters = ({
  currentBrand,
  currentOs,
  currentMaxPrice,
  currentSearch,
  androidBrands,
}: PhoneFiltersProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const lastRequestedQueryRef = useRef(searchParams.toString())
  const pendingExternalSearchRef = useRef<string | null>(null)
  const currentQueryString = searchParams.toString()
  const urlSearch = currentSearch ?? ''
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const effectiveCurrentSearch = normalizePhoneBrowseSearch(
    currentSearch,
    currentBrand,
    androidBrands
  )

  const [searchInput, setSearchInput] = useState(urlSearch)
  const debouncedSearchInput = useDebounce(searchInput, 350)

  useEffect(() => {
    const urlChangedExternally = currentQueryString !== lastRequestedQueryRef.current

    if (urlChangedExternally) {
      pendingExternalSearchRef.current = urlSearch
    }

    if (!isSearchFocused && pendingExternalSearchRef.current !== null) {
      setSearchInput(pendingExternalSearchRef.current)
      pendingExternalSearchRef.current = null
    }

    lastRequestedQueryRef.current = currentQueryString
  }, [currentQueryString, isSearchFocused, urlSearch])

  const commitParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(currentQueryString)

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }

      // Reset to first page when filters change.
      params.delete('offset')
      params.delete('limit')

      const nextQuery = params.toString()

      if (
        nextQuery === currentQueryString ||
        nextQuery === lastRequestedQueryRef.current
      ) {
        return
      }

      lastRequestedQueryRef.current = nextQuery
      pendingExternalSearchRef.current = null

      startTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
          scroll: false,
        })
      })
    },
    [currentQueryString, pathname, router]
  )

  useEffect(() => {
    const normalizedDebouncedSearch = normalizePhoneBrowseSearch(
      debouncedSearchInput,
      currentBrand,
      androidBrands
    )

    if ((normalizedDebouncedSearch ?? '') === (effectiveCurrentSearch ?? '')) {
      return
    }

    commitParams({ q: normalizedDebouncedSearch })
  }, [
    androidBrands,
    commitParams,
    currentBrand,
    debouncedSearchInput,
    effectiveCurrentSearch,
  ])

  const handleBrandChange = (nextBrandValue: string) => {
    const nextBrand = nextBrandValue || undefined
    const nextSearch = normalizePhoneBrowseSearchForBrandChange(
      searchInput,
      currentBrand,
      nextBrand,
      androidBrands
    )

    setSearchInput(nextSearch ?? '')
    commitParams({
      brand: nextBrand,
      q: nextSearch,
    })
  }

  const handleOsChange = (nextOsValue: string) => {
    const nextOs = nextOsValue || undefined
    const nextBrand = nextOs === 'ios' ? undefined : currentBrand
    const nextSearch = normalizePhoneBrowseSearchForBrandChange(
      searchInput,
      currentBrand,
      nextBrand,
      androidBrands
    )

    setSearchInput(nextSearch ?? '')
    commitParams({
      os_type: nextOs,
      brand: nextBrand,
      q: nextSearch,
    })
  }

  const clearAll = () => {
    if (!hasActiveFilters) {
      return
    }

    setSearchInput('')
    pendingExternalSearchRef.current = null
    lastRequestedQueryRef.current = ''

    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }

  const hasActiveFilters = !!(
    currentBrand ||
    currentOs ||
    currentMaxPrice ||
    urlSearch.trim()
  )

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search phones..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md
                   text-text-primary placeholder:text-text-muted
                   focus:outline-none focus:ring-1 focus:ring-accent"
      />

      <div className="flex flex-wrap gap-2">
        <select
          value={currentOs ?? ''}
          onChange={(e) => handleOsChange(e.target.value)}
          className="px-3 py-1.5 text-xs bg-surface border border-border rounded-md
                     text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All OS</option>
          <option value="android">Android</option>
          <option value="ios">iPhone</option>
        </select>

        {currentOs !== 'ios' && (
          <select
            value={currentBrand ?? ''}
            onChange={(e) => handleBrandChange(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface border border-border rounded-md
                       text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Brands</option>
            {androidBrands.map((brand) => (
              <option key={brand.slug} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={currentMaxPrice ?? ''}
          onChange={(e) =>
            commitParams({ max_price: e.target.value || undefined })
          }
          className="px-3 py-1.5 text-xs bg-surface border border-border rounded-md
                     text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Budgets</option>
          {BUDGET_TIERS.map((tier) => (
            <option key={tier.max} value={tier.max}>
              {tier.label} ({tier.range})
            </option>
          ))}
        </select>

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
