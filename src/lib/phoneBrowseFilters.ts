import type { Brand } from '@/types'

const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')

const getBrandTerms = (brandSlug: string | undefined, brands: Brand[] = []) => {
  if (!brandSlug) {
    return []
  }

  const terms = new Set<string>([normalizeToken(brandSlug)])
  const matchingBrand = brands.find((brand) => brand.slug === brandSlug)

  if (matchingBrand) {
    terms.add(normalizeToken(matchingBrand.name))
  }

  return [...terms].filter(Boolean)
}

const matchesBrandExactly = (
  rawSearch: string,
  brandSlug: string | undefined,
  brands: Brand[] = []
) => {
  const normalizedSearch = normalizeToken(rawSearch)

  return getBrandTerms(brandSlug, brands).some(
    (brandTerm) => normalizedSearch === brandTerm
  )
}

const isAnchoredToBrand = (
  rawSearch: string,
  brandSlug: string | undefined,
  brands: Brand[] = []
) => {
  const normalizedSearch = normalizeToken(rawSearch)

  return getBrandTerms(brandSlug, brands).some(
    (brandTerm) =>
      normalizedSearch === brandTerm ||
      normalizedSearch.startsWith(`${brandTerm} `)
  )
}

export const normalizePhoneBrowseSearch = (
  rawSearch: string | undefined,
  brandSlug: string | undefined,
  brands: Brand[] = []
) => {
  const trimmed = rawSearch?.trim()

  if (!trimmed) {
    return undefined
  }

  if (matchesBrandExactly(trimmed, brandSlug, brands)) {
    return undefined
  }

  return trimmed
}

export const normalizePhoneBrowseSearchForBrandChange = (
  rawSearch: string | undefined,
  currentBrandSlug: string | undefined,
  nextBrandSlug: string | undefined,
  brands: Brand[] = []
) => {
  const trimmed = rawSearch?.trim()

  if (!trimmed) {
    return undefined
  }

  if (matchesBrandExactly(trimmed, nextBrandSlug, brands)) {
    return undefined
  }

  if (
    currentBrandSlug &&
    currentBrandSlug !== nextBrandSlug &&
    isAnchoredToBrand(trimmed, currentBrandSlug, brands)
  ) {
    return undefined
  }

  return trimmed
}
