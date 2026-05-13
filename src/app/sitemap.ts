import type { MetadataRoute } from 'next'
import { phonesApi, brandsApi } from '@/lib/api'
import { BUDGET_GUIDES } from '@/lib/budgetGuides'
import { getPrimaryPhoneCardCompareAction } from '@/lib/relatedCompare'
import { SITE_URL } from '@/lib/seo'
import type { PhoneCard } from '@/types'

const routes = [
  '',
  '/assistant',
  '/phones',
  '/brands',
  '/compare',
  '/analyze',
  '/deals',
  '/deals/today',
  '/used/checker',
  '/alerts',
  '/how-it-works',
  '/about',
  '/privacy',
  '/terms',
] as const

const PHONE_SITEMAP_LIMIT = 500
const COMPARE_SITEMAP_SOURCE_LIMIT = 80
const COMPARE_SITEMAP_LIMIT = 120

const buildEntry = (
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number
): MetadataRoute.Sitemap[number] => ({
  url: `${SITE_URL}${path}`,
  lastModified,
  changeFrequency,
  priority,
})

const getPhoneLastModified = (phone: PhoneCard, fallback: Date) => {
  const updatedAt = new Date(phone.updated_at)
  return Number.isNaN(updatedAt.getTime()) ? fallback : updatedAt
}

const getDynamicSitemapEntries = async (now: Date): Promise<MetadataRoute.Sitemap> => {
  try {
    const [phones, brands] = await Promise.all([
      phonesApi.getAll({ limit: PHONE_SITEMAP_LIMIT }),
      brandsApi.getAll(),
    ])

    const phoneEntries = phones.flatMap((phone) => {
      const lastModified = getPhoneLastModified(phone, now)

      return [
        buildEntry(`/phones/${phone.slug}`, lastModified, 'daily', 0.85),
        buildEntry(`/buy-now-or-wait/${phone.slug}`, lastModified, 'daily', 0.8),
        buildEntry(`/worth-it/${phone.slug}`, lastModified, 'weekly', 0.78),
        buildEntry(`/used/${phone.slug}`, lastModified, 'weekly', 0.76),
      ]
    })

    const brandEntries = brands
      .filter((brand) => brand.is_active)
      .map((brand) => buildEntry(`/brands/${brand.slug}`, now, 'weekly', 0.74))

    const seenComparePaths = new Set<string>()
    const compareEntries = phones
      .slice(0, COMPARE_SITEMAP_SOURCE_LIMIT)
      .flatMap((phone) => {
        const action = getPrimaryPhoneCardCompareAction(phone, phones)
        if (!action) return []

        const path = action.href.split('?')[0]
        const key = [phone.slug, action.counterpart.slug].sort().join('::')
        if (seenComparePaths.has(key)) return []

        seenComparePaths.add(key)
        return [buildEntry(path, now, 'weekly', 0.72)]
      })
      .slice(0, COMPARE_SITEMAP_LIMIT)

    return [...phoneEntries, ...brandEntries, ...compareEntries]
  } catch (error) {
    console.error('Failed to build dynamic sitemap entries', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries = routes.map((route) =>
    buildEntry(
      route,
      now,
      route === '' || route.startsWith('/deals') ? 'daily' : 'weekly',
      route === '' ? 1 : route.startsWith('/deals') ? 0.9 : 0.7
    )
  )

  const budgetEntries = BUDGET_GUIDES.map((guide) =>
    buildEntry(`/deals/under/${guide.slug}`, now, 'daily', 0.86)
  )

  const dynamicEntries = await getDynamicSitemapEntries(now)

  return [...staticEntries, ...budgetEntries, ...dynamicEntries]
}
