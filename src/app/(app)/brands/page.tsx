// decide-web/src/app/(app)/brands/page.tsx
// Lists all active brands with their logo, phone count,
// and a link to browse phones filtered by that brand.

import type { Metadata } from 'next'
import type { Brand } from '@/types'
import Link from 'next/link'
import { brandsApi } from '@/lib/api'
import { filterUserFacingBrands, sortAndroidBrandsForUi } from '@/lib/brandCatalog'
import { BrandLogo } from '@/components/shared'

export const metadata: Metadata = {
  title: 'Brands — Decide',
  description:
    'Browse phones by brand. Samsung, Tecno, Infinix, Apple, Xiaomi and more — with real Nigerian prices.',
}

export default async function BrandsPage() {
  let brands: Brand[] = []
  let error: string | null = null

  try {
    brands = filterUserFacingBrands(await brandsApi.getAll())
  } catch {
    error = 'Could not load brands. Please try again.'
  }

  const androidBrands = sortAndroidBrandsForUi(
    brands.filter((b) => b.os_type === 'android')
  )
  const iosBrands     = brands.filter((b) => b.os_type === 'ios')

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          Brands
        </h1>
        <p className="text-base text-text-secondary">
          Browse phones by brand
        </p>
      </div>

      {error ? (
        <div className="py-24 text-center">
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* Android brands */}
          {androidBrands.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">
                Android
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {androidBrands.map((brand) => (
                  <BrandCard key={brand.slug} brand={brand} />
                ))}
              </div>
            </section>
          )}

          {/* iOS brands */}
          {iosBrands.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">
                iPhone
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {iosBrands.map((brand) => (
                  <BrandCard key={brand.slug} brand={brand} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}

// ── BrandCard ──────────────────────────────────────────────────

interface BrandCardProps {
  brand: Brand
}

const BrandCard = ({ brand }: BrandCardProps) => (
  <Link
    href={`/brands/${brand.slug}`}
    className={[
      'group flex flex-col items-center gap-3',
      'p-5 bg-surface border border-border rounded-md',
      'hover:border-borderHigh hover:bg-surfaceHigh',
      'transition-all duration-fast',
    ].join(' ')}
  >
    <div className="w-12 h-12 flex items-center justify-center">
      <BrandLogo brandSlug={brand.slug} brandName={brand.name} size="lg" />
    </div>
    <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors duration-fast">
      {brand.name}
    </span>
  </Link>
)
