// decide-web/src/components/shared/PhoneSearch.tsx
// Standalone search component used on the browse and compare pages.
// Larger and more prominent than the navbar search — designed for
// focused search sessions rather than quick lookups.
// Debounces input, shows results in a dropdown, clears on selection.

'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Input, Spinner } from '@/components/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { phonesApi } from '@/lib/api'
import { formatNaira } from '@/lib/formatters'
import type { PhoneCard } from '@/types'

interface PhoneSearchProps {
  // Called when a result is selected — used by the compare page
  // to add the phone to the tray instead of navigating to the detail page
  onSelect?:    (phone: PhoneCard) => void
  placeholder?: string
  className?:   string
  // Renders as a full-width block with a larger input
  prominent?:   boolean
}

export const PhoneSearch = ({
  onSelect,
  placeholder = 'Search phones by name or brand...',
  className   = '',
  prominent   = false,
}: PhoneSearchProps) => {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<PhoneCard[]>([])
  const [loading,  setLoading]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [focused,  setFocused]  = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const listRef      = useRef<HTMLUListElement>(null)

  const debouncedQuery = useDebounce(query, 350)

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    let cancelled = false

    const search = async (): Promise<void> => {
      setLoading(true)

      try {
        const data = await phonesApi.search(debouncedQuery)
        if (!cancelled) {
          setResults(data)
          setOpen(data.length > 0 || debouncedQuery.length > 1)
        }
      } catch {
        if (!cancelled) {
          setResults([])
          setOpen(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    search()
    return () => { cancelled = true }
  }, [debouncedQuery])

  // Close dropdown when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation through results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!open) return

    const items = listRef.current?.querySelectorAll('[role="option"]')
    if (!items || items.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Move focus to the first result item
      ;(items[0] as HTMLElement).focus()
      return
    }

    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.focus()
    }
  }

  // Arrow key navigation within the results list
  const handleItemKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    index: number,
    phone: PhoneCard
  ): void => {
    const items = listRef.current?.querySelectorAll('[role="option"]')
    if (!items) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = items[index + 1] as HTMLElement | undefined
      next ? next.focus() : inputRef.current?.focus()
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = items[index - 1] as HTMLElement | undefined
      prev ? prev.focus() : inputRef.current?.focus()
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect(phone)
    }

    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.focus()
    }
  }

  const handleSelect = (phone: PhoneCard): void => {
    if (onSelect) {
      // Compare page mode — add to tray, clear search
      onSelect(phone)
      setQuery('')
      setResults([])
      setOpen(false)
      inputRef.current?.focus()
    } else {
      // Default mode — navigation handled by the Link wrapper
      setOpen(false)
    }
  }

  const clear = (): void => {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  // Lowest in-stock price for the result row
  const getLowestPrice = (phone: PhoneCard): string | null => {
    const inStock = phone.prices?.filter(
      (p) => p.in_stock && p.price_ngn > 0
    )
    if (!inStock || inStock.length === 0) return null

    const lowest = inStock.reduce((a, b) =>
      a.price_ngn < b.price_ngn ? a : b
    )
    return formatNaira(lowest.price_ngn)
  }

  const showDropdown = open && (loading || results.length > 0)

  return (
    <div
      ref={containerRef}
      className={[
        'relative',
        prominent ? 'w-full' : 'w-full max-w-md',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Search input */}
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        fullWidth
        leadingIcon={<SearchIcon />}
        trailing={
          loading ? (
            <Spinner size="sm" />
          ) : query ? (
            <button
              onClick={clear}
              className="text-text-muted hover:text-text-primary transition-colors duration-fast"
              aria-label="Clear search"
              tabIndex={-1}
            >
              <ClearIcon />
            </button>
          ) : null
        }
        aria-label="Search phones"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls={showDropdown ? 'phone-search-results' : undefined}
        aria-haspopup="listbox"
        role="combobox"
        className={prominent ? 'h-12 text-base' : ''}
      />

      {/* Results dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-dropdown mt-1 max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto rounded-md">
          <ul
            ref={listRef}
            id="phone-search-results"
            role="listbox"
            aria-label="Phone search results"
            className="overflow-hidden rounded-md border border-border bg-surface shadow-lg divide-y divide-border"
          >
            {loading && results.length === 0 ? (
              <li className="px-4 py-3 flex items-center gap-2 text-sm text-text-muted">
                <Spinner size="sm" />
                Searching...
              </li>
            ) : results.length === 0 && debouncedQuery.length > 1 ? (
              <li className="px-4 py-3 text-sm text-text-muted">
                No phones found for &ldquo;{debouncedQuery}&rdquo;
              </li>
            ) : (
              results.map((phone, index) => {
                const lowestPrice = getLowestPrice(phone)
                const isSelectMode = !!onSelect

                const inner = (
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surfaceHigh transition-colors duration-fast cursor-pointer"
                    role="option"
                    aria-selected="false"
                    tabIndex={0}
                    onKeyDown={(e) => handleItemKeyDown(e, index, phone)}
                    onClick={() => handleSelect(phone)}
                  >
                    {/* Phone image */}
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-surfaceHigh rounded-sm">
                      {phone.image_url ? (
                        <Image
                          src={phone.image_url}
                          alt={phone.name}
                          width={32}
                          height={32}
                          className="object-contain w-8 h-8"
                        />
                      ) : (
                        <PhoneIcon />
                      )}
                    </div>

                    {/* Phone info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {phone.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {phone.brand_name}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="shrink-0 text-right">
                      {lowestPrice ? (
                        <p className="text-sm font-bold text-text-primary tabular-nums">
                          {lowestPrice}
                        </p>
                      ) : (
                        <p className="text-xs text-text-muted">
                          No price
                        </p>
                      )}

                      {/* Mode hint */}
                      <p className="text-xs text-text-muted">
                        {isSelectMode ? 'Add to compare' : 'View details'}
                      </p>
                    </div>
                  </div>
                )

                // In select mode the row is a div — clicking calls onSelect.
                // In default mode the row is wrapped in a Link for navigation.
                return isSelectMode ? (
                  <li key={phone.slug}>
                    {inner}
                  </li>
                ) : (
                  <li key={phone.slug}>
                    <Link
                      href={`/phones/${phone.slug}`}
                      onClick={() => handleSelect(phone)}
                      className="block"
                    >
                      {inner}
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="6.5"
      cy="6.5"
      r="4.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M10.5 10.5L14 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const ClearIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const PhoneIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-text-muted"
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
