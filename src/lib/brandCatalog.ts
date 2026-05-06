import type { Brand, BrandPreference, PhoneCard } from '@/types'

type AndroidBrandSlug = Exclude<BrandPreference, 'apple' | 'any'>

export const CATALOG_BROWSE_PAGE_SIZE = 48
export const CATALOG_BROWSE_MAX_VISIBLE = 192

export const ANDROID_BRAND_PRIORITY_ORDER: AndroidBrandSlug[] = [
  'samsung',
  'tecno',
  'infinix',
  'xiaomi',
  'vivo',
  'google',
  'oneplus',
  'oppo',
  'itel',
  'realme',
  'nokia',
]

const ANDROID_BRAND_PRIORITY_INDEX = new Map(
  ANDROID_BRAND_PRIORITY_ORDER.map((slug, index) => [slug, index])
)

// Backend brand activation is now the single source of truth for user-facing visibility.
export const filterUserFacingBrands = <T extends Brand>(brands: T[]): T[] => brands

export const filterUserFacingPhones = <T extends Pick<PhoneCard, 'brand_name'>>(
  phones: T[]
): T[] => phones

export const sortAndroidBrandsForUi = (brands: Brand[]): Brand[] => {
  return [...brands].sort((left, right) => {
    const leftPriority =
      ANDROID_BRAND_PRIORITY_INDEX.get(left.slug as AndroidBrandSlug) ??
      Number.MAX_SAFE_INTEGER
    const rightPriority =
      ANDROID_BRAND_PRIORITY_INDEX.get(right.slug as AndroidBrandSlug) ??
      Number.MAX_SAFE_INTEGER

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return left.name.localeCompare(right.name)
  })
}
