// decide-web/src/lib/formatters.ts
// Pure formatting utility functions.
// No side effects, no imports from other project files.
// Every function takes a value and returns a formatted string.

// ── Currency ────────────────────────────────────────────────────

// Formats a number as Nigerian Naira.
// e.g. 120000 → "₦120,000"
export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG')}`
}

// Formats a price range between two amounts.
// e.g. 80000, 150000 → "₦80,000 – ₦150,000"
export const formatPriceRange = (min: number, max: number): string => {
  return `${formatNaira(min)} – ${formatNaira(max)}`
}

// Abbreviates large Naira amounts for compact display.
// e.g. 120000 → "₦120k" | 1500000 → "₦1.5M"
export const formatNairaCompact = (amount: number): string => {
  if (amount >= 1000000) {
    const millions = amount / 1000000
    return `₦${millions % 1 === 0 ? millions : millions.toFixed(1)}M`
  }
  if (amount >= 1000) {
    const thousands = amount / 1000
    return `₦${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`
  }
  return formatNaira(amount)
}

// ── Specs ────────────────────────────────────────────────────────

// Formats a storage or RAM value.
// e.g. 128 → "128GB" | null → "Unknown"
export const formatGb = (value: number | null): string => {
  if (value === null) return 'Unknown'
  return `${value}GB`
}

// Formats a camera megapixel value.
// e.g. 50 → "50MP" | null → "Unknown"
export const formatMp = (value: number | null): string => {
  if (value === null) return 'Unknown'
  return `${value}MP`
}

// Formats a battery capacity value.
// e.g. 5000 → "5,000mAh" | null → "Unknown"
export const formatMah = (value: number | null): string => {
  if (value === null) return 'Unknown'
  return `${value.toLocaleString()}mAh`
}

// Formats a charging speed value.
// e.g. 45 → "45W" | null → "Unknown"
export const formatWatts = (value: number | null): string => {
  if (value === null) return 'Unknown'
  return `${value}W`
}

// Formats a display size value.
// e.g. 6.6 → "6.6"" | null → "Unknown"
export const formatInches = (value: number | null): string => {
  if (value === null) return 'Unknown'
  return `${value}"`
}

// Formats a refresh rate value.
// e.g. 120 → "120Hz" | null → "Unknown"
export const formatHz = (value: number | null): string => {
  if (value === null) return 'Unknown'
  return `${value}Hz`
}

// Formats a weight value.
// e.g. 195 → "195g" | null → "Unknown"
export const formatGrams = (value: number | null): string => {
  if (value === null) return 'Unknown'
  return `${value}g`
}

// Formats a boolean spec as a readable string.
// e.g. true → "Yes" | false → "No"
export const formatBoolean = (value: boolean): string => {
  return value ? 'Yes' : 'No'
}

// ── Dates ─────────────────────────────────────────────────────

// Formats an ISO date string as a human-readable relative time.
// e.g. "2025-01-15T10:00:00Z" → "2 hours ago" | "3 days ago"
export const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1)    return 'Just now'
  if (diffMins < 60)   return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24)  return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7)    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

  return date.toLocaleDateString('en-NG', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })
}

// Formats a scraped_at timestamp as a price freshness label.
// e.g. "Updated 3 hours ago" — shown under store prices
export const formatPriceFreshness = (isoString: string): string => {
  return `Updated ${formatRelativeTime(isoString)}`
}

// ── Strings ────────────────────────────────────────────────────

// Capitalises the first letter of a string.
// e.g. "jumia" → "Jumia"
export const capitalise = (text: string): string => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Converts a match percentage to a descriptive label.
// Used on result cards alongside the percentage number.
export const formatMatchLabel = (percentage: number): string => {
  if (percentage >= 90) return 'Excellent Match'
  if (percentage >= 75) return 'Great Match'
  if (percentage >= 60) return 'Good Match'
  return 'Possible Match'
}