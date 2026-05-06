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
