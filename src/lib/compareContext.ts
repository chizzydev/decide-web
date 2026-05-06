import type { ComparePhone, CurrentPrice, OsType } from '@/types'

interface ComparePhoneSource {
  id: number
  slug: string
  name: string
  image_url: string | null
  brand_name: string
  os_type: OsType
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

export interface CompareVariantContext {
  variantId: number | null
  variantLabel: string | null
}

const buildVariantLabel = (
  label?: string | null,
  storageGb?: number | null,
  ramGb?: number | null
): string | null => {
  if (label?.trim()) {
    return label.trim()
  }

  if (storageGb && ramGb) {
    return `${storageGb}GB / ${ramGb}GB RAM`
  }

  if (storageGb) return `${storageGb}GB`
  if (ramGb) return `${ramGb}GB RAM`

  return null
}

export const getTrackedCompareVariantFromPrices = (
  prices: ComparePhoneSource['prices']
): CompareVariantContext | null => {
  const candidate = [...prices]
    .filter((price) => price.price_ngn > 0 && !!price.variant_id)
    .sort((left, right) => {
      if (left.in_stock !== right.in_stock) {
        return left.in_stock ? -1 : 1
      }

      if (left.price_ngn !== right.price_ngn) {
        return left.price_ngn - right.price_ngn
      }

      return new Date(right.scraped_at).getTime() - new Date(left.scraped_at).getTime()
    })[0]

  if (!candidate?.variant_id) {
    return null
  }

  return {
    variantId: candidate.variant_id,
    variantLabel: buildVariantLabel(
      candidate.variant_label,
      candidate.variant_storage_gb,
      candidate.variant_ram_gb
    ),
  }
}

export const buildVariantAwareCompareHref = ({
  leftSlug,
  rightSlug,
  leftVariantId,
  rightVariantId,
}: {
  leftSlug: string
  rightSlug: string
  leftVariantId?: number | null
  rightVariantId?: number | null
}): string => {
  const params = new URLSearchParams()

  if (leftVariantId) {
    params.set('left_variant_id', String(leftVariantId))
  }

  if (rightVariantId) {
    params.set('right_variant_id', String(rightVariantId))
  }

  const suffix = params.toString()

  return `/compare/${leftSlug}/vs/${rightSlug}${suffix ? `?${suffix}` : ''}`
}

export const mapToComparePhone = (
  phone: ComparePhoneSource,
  options: {
    variantId?: number | null
    variantLabel?: string | null
  } = {}
): ComparePhone => {
  const inferredVariant =
    options.variantId || options.variantLabel
      ? {
          variantId: options.variantId ?? null,
          variantLabel: options.variantLabel ?? null,
        }
      : getTrackedCompareVariantFromPrices(phone.prices)

  return {
    id: phone.id,
    slug: phone.slug,
    name: phone.name,
    image_url: phone.image_url,
    brand_name: phone.brand_name,
    os_type: phone.os_type,
    variant_id: inferredVariant?.variantId ?? null,
    variant_label: inferredVariant?.variantLabel ?? null,
  }
}
