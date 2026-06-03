export interface VariantHrefOptions {
  variantId?: number | null
  anchor?: string | null
}

const normalizeAnchor = (anchor?: string | null): string => {
  if (!anchor) {
    return ''
  }

  const clean = anchor.startsWith('#') ? anchor.slice(1) : anchor

  return clean ? `#${clean}` : ''
}

const buildVariantSuffix = ({
  variantId,
  anchor,
}: VariantHrefOptions = {}): string => {
  const params = new URLSearchParams()

  if (variantId) {
    params.set('variant_id', String(variantId))
  }

  const query = params.toString()
  const hash = normalizeAnchor(anchor)

  return `${query ? `?${query}` : ''}${hash}`
}

export const parseVariantIdFromSearchParam = (
  value: string | string[] | undefined
): number | null => {
  const raw = Array.isArray(value) ? value[0] : value

  if (!raw) {
    return null
  }

  const parsed = Number(raw)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export const buildPhoneDetailHref = (
  slug: string,
  options: VariantHrefOptions = {}
): string => `/phones/${slug}${buildVariantSuffix(options)}`

export const buildBuyNowWaitHref = (
  slug: string,
  options: VariantHrefOptions = {}
): string => `/buy-now-or-wait/${slug}${buildVariantSuffix(options)}`

export const buildWorthItHref = (
  slug: string,
  options: VariantHrefOptions = {}
): string => `/worth-it/${slug}${buildVariantSuffix(options)}`

export const buildUsedGuideHref = (
  slug: string,
  options: VariantHrefOptions = {}
): string => `/used/${slug}${buildVariantSuffix(options)}`

export const buildPhonePriceHistoryHref = (
  slug: string,
  options: VariantHrefOptions = {}
): string => `/phones/${slug}/price-history${buildVariantSuffix(options)}`

export const buildPhoneCheapestPriceHref = (
  slug: string,
  options: VariantHrefOptions = {}
): string => `/phones/${slug}/cheapest-price${buildVariantSuffix(options)}`

export const buildPhonePriceTodayHref = (
  slug: string,
  options: VariantHrefOptions = {}
): string => `/phones/${slug}/price-in-nigeria-today${buildVariantSuffix(options)}`

export const buildPhonePriceDropHref = (
  slug: string,
  options: VariantHrefOptions = {}
): string => `/phones/${slug}/price-drop${buildVariantSuffix(options)}`

export const buildPhoneStorePriceHref = (
  slug: string,
  store: 'jumia' | 'slot',
  options: VariantHrefOptions = {}
): string => `/phones/${slug}/price-in-${store}${buildVariantSuffix(options)}`
