const CRAWLER_USER_AGENT_PATTERN =
  /\b(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|screaming frog)\b/i

export const isKnownCrawlerUserAgent = (userAgent: string | null | undefined) => {
  if (!userAgent) return false
  return CRAWLER_USER_AGENT_PATTERN.test(userAgent)
}

export const isKnownCrawlerBrowser = () => {
  if (typeof navigator === 'undefined') return false
  return isKnownCrawlerUserAgent(navigator.userAgent)
}
