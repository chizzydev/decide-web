import { unstable_cache } from 'next/cache'
import type { Brand } from '@/types'
import { brandsApi } from '@/lib/api'

export const getCachedAndroidBrands = unstable_cache(
  async (): Promise<Brand[]> => brandsApi.getAll('android'),
  ['catalog-android-brands'],
  {
    revalidate: 300,
  }
)

export const getCachedBrandBySlug = async (brandSlug: string): Promise<Brand> =>
  unstable_cache(
    async () => brandsApi.getBySlug(brandSlug),
    ['brand-by-slug', brandSlug],
    {
      revalidate: 300,
    }
  )()
