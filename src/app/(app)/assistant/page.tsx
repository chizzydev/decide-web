import type { Metadata } from 'next'
import { AssistantShell } from '@/components/assistant'
import { brandsApi } from '@/lib/api'
import { filterUserFacingBrands, sortAndroidBrandsForUi } from '@/lib/brandCatalog'

export const metadata: Metadata = {
  title: 'Find My Phone - Decide',
  description:
    'Answer five quick questions and get a personalised phone recommendation with real Nigerian prices.',
}

export default async function AssistantPage() {
  const androidBrands = await brandsApi
    .getAll('android')
    .then(filterUserFacingBrands)
    .then(sortAndroidBrandsForUi)
    .catch(() => [])

  return <AssistantShell androidBrands={androidBrands} />
}
