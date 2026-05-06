'use client'

import { useCompareStore } from '@/store/compareStore'
import { mapToComparePhone } from '@/lib/compareContext'

interface CompareTrayButtonProps {
  phone: {
    id: number
    slug: string
    name: string
    image_url: string | null
    brand_name: string
    os_type: 'android' | 'ios'
    prices: Array<{
      price_ngn: number
      in_stock: boolean
      scraped_at: string
      variant_id?: number | null
      variant_label?: string | null
      variant_ram_gb?: number | null
      variant_storage_gb?: number | null
    }>
  }
  variantId?: number | null
  variantLabel?: string | null
}

export const CompareTrayButton = ({
  phone,
  variantId,
  variantLabel,
}: CompareTrayButtonProps) => {
  const addPhone = useCompareStore((s) => s.addPhone)
  const removePhone = useCompareStore((s) => s.removePhone)
  const phones = useCompareStore((s) => s.phones)
  const isTrayFull = useCompareStore((s) => s.isTrayFull())

  const existingPhone = phones.find((entry) => entry?.slug === phone.slug) ?? null
  const isInTray = !!existingPhone
  const hasDifferentTrackedVariant =
    !!existingPhone &&
    !!variantId &&
    existingPhone.variant_id !== variantId

  const handleClick = () => {
    if (hasDifferentTrackedVariant || !isInTray) {
      addPhone(
        mapToComparePhone(phone, {
          variantId,
          variantLabel,
        })
      )
      return
    }

    removePhone(phone.slug)
  }

  const disabled = !hasDifferentTrackedVariant && !isInTray && isTrayFull
  const label = hasDifferentTrackedVariant
    ? 'Update compare config'
    : isInTray
      ? 'In comparison'
      : 'Compare this config'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={[
        'inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
        'disabled:cursor-not-allowed disabled:opacity-40',
        hasDifferentTrackedVariant || isInTray
          ? 'border-accent text-accent bg-accent-subtle hover:bg-accent hover:text-navy-800'
          : 'border-border text-text-secondary hover:border-borderHigh hover:text-text-primary',
      ].join(' ')}
      aria-label={
        hasDifferentTrackedVariant
          ? `Update ${phone.name} to the ${variantLabel ?? 'selected'} compare configuration`
          : isInTray
            ? `Remove ${phone.name} from comparison`
            : `Add ${phone.name} to comparison`
      }
      aria-pressed={isInTray}
    >
      {label}
    </button>
  )
}
