import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === '' || route.startsWith('/deals') ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route.startsWith('/deals') ? 0.9 : 0.7,
  }))
}
