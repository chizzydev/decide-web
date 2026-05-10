type ImageVersion = string | number | boolean | Date | null | undefined

const normalizeImageVersion = (version: unknown): string | null => {
  if (version == null) return null

  if (version instanceof Date) {
    const time = version.getTime()
    return Number.isNaN(time) ? null : version.toISOString()
  }

  if (typeof version === 'string') {
    const trimmed = version.trim()
    return trimmed || null
  }

  if (typeof version === 'number') {
    return Number.isFinite(version) ? String(version) : null
  }

  if (typeof version === 'boolean') {
    return String(version)
  }

  return null
}

export const buildVersionedImageUrl = (
  src: string | null | undefined,
  version: ImageVersion | unknown
): string | null => {
  if (!src) return null

  const trimmedSrc = src.trim()
  if (!trimmedSrc) return null

  const normalizedVersion = normalizeImageVersion(version)
  if (!normalizedVersion) return trimmedSrc

  try {
    const isRelative = trimmedSrc.startsWith('/')
    const url = new URL(trimmedSrc, isRelative ? 'https://decide.local' : undefined)
    url.searchParams.set('v', normalizedVersion)
    return isRelative ? `${url.pathname}${url.search}${url.hash}` : url.toString()
  } catch {
    const separator = trimmedSrc.includes('?') ? '&' : '?'
    return `${trimmedSrc}${separator}v=${encodeURIComponent(normalizedVersion)}`
  }
}
