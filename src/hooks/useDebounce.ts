// decide-web/src/hooks/useDebounce.ts
// Delays updating a value until the user has stopped typing.
// Used by the search bar to avoid firing an API call on every keystroke.

import { useState, useEffect } from 'react'

export const useDebounce = <T>(value: T, delayMs: number = 400): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    // Clear the timer if value changes before the delay completes.
    // This is what makes it a debounce — only the final value fires.
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}