import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SeoLandingPage } from '@/components/seo/SeoLandingPage'
import { getSeoLandingPageData } from '@/lib/seoLandingPageData'
import {
  getSeoLandingHref,
  getSeoLandingPage,
  SEO_LANDING_PAGES,
} from '@/lib/seoLandingPages'
import { absoluteUrl, buildPageMetadata } from '@/lib/seo'
import {
  buildBreadcrumbStructuredData,
  buildFaqStructuredData,
  buildItemListStructuredData,
  buildWebPageStructuredData,
} from '@/lib/structuredData'

interface SeoPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export function generateStaticParams() {
  return SEO_LANDING_PAGES.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({
  params,
}: SeoPageProps): Promise<Metadata> {
  const { slug } = await params
  const config = getSeoLandingPage(slug)

  if (!config) {
    return buildPageMetadata({
      title: 'Phone buying guide - Decide',
      description:
        'Compare Nigerian phone prices, live drops, buy-or-wait verdicts, and safer buying guidance before you pay.',
      path: '/',
    })
  }

  return buildPageMetadata({
    title: config.title,
    description: config.description,
    path: getSeoLandingHref(config.slug),
    keywords: config.searchVariants,
  })
}

export default async function SeoPage({ params }: SeoPageProps) {
  const { slug } = await params
  const config = getSeoLandingPage(slug)

  if (!config) {
    notFound()
  }

  const data = await getSeoLandingPageData(config)
  const pageUrl = absoluteUrl(getSeoLandingHref(config.slug))

  const structuredData = [
    buildWebPageStructuredData({
      name: config.h1,
      description: config.description,
      url: pageUrl,
    }),
    buildBreadcrumbStructuredData([
      { name: 'Decide', url: absoluteUrl('/') },
      { name: config.h1, url: pageUrl },
    ]),
    buildItemListStructuredData({
      name: config.h1,
      description: config.description,
      url: pageUrl,
      items: data.phones.map((item) => ({
        name: item.phone.name,
        url: absoluteUrl(`/phones/${item.phone.slug}`),
        image: item.phone.image_url ? absoluteUrl(item.phone.image_url) : undefined,
        brandName: item.phone.brand_name,
        description: `${item.phone.name} buying context from Decide, including live Nigerian price signals, phone scores, and safer next steps before paying an external seller.`,
      })),
    }),
    buildFaqStructuredData(config.faq),
  ]

  return (
    <SeoLandingPage
      config={config}
      data={data}
      structuredData={structuredData}
    />
  )
}
