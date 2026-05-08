export interface CompareSnapshotData {
  leftBrand: string
  leftName: string
  leftVariant: string
  leftPrice: string
  rightBrand: string
  rightName: string
  rightVariant: string
  rightPrice: string
  headline: string
  winnerLabel: string
}

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const clampText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`
}

const wrapText = (value: string, maxLineLength: number, maxLines: number) => {
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length <= maxLineLength) {
      currentLine = nextLine
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    currentLine = word

    if (lines.length === maxLines - 1) {
      break
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine)
  }

  if (lines.length === 0) {
    return [clampText(value, maxLineLength)]
  }

  const consumedWordCount = lines.join(' ').split(/\s+/).filter(Boolean).length

  if (consumedWordCount < words.length) {
    const lastLineIndex = lines.length - 1
    lines[lastLineIndex] = clampText(lines[lastLineIndex], maxLineLength - 3)
    lines[lastLineIndex] = `${lines[lastLineIndex].replace(/\.*$/, '')}...`
  }

  return lines
}

const renderTextLines = (
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  className: string,
  textAnchor: 'start' | 'end' = 'start'
) =>
  lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${textAnchor}" class="${className}">${escapeXml(line)}</text>`
    )
    .join('')

export const sanitizeCompareSnapshotFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'decide-compare'

export const buildCompareSnapshotSvg = (snapshot: CompareSnapshotData) => {
  const leftNameLines = wrapText(snapshot.leftName, 20, 2)
  const rightNameLines = wrapText(snapshot.rightName, 20, 2)
  const leftVariantLines = wrapText(snapshot.leftVariant, 26, 2)
  const rightVariantLines = wrapText(snapshot.rightVariant, 26, 2)
  const headlineLines = wrapText(snapshot.headline, 82, 2)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="80" y1="48" x2="1120" y2="582" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F0FDFA"/>
      <stop offset="0.48" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#E6F0FF"/>
    </linearGradient>
  </defs>
  <style>
    .eyebrow { font: 700 18px 'Segoe UI', Arial, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; fill: #0F766E; }
    .meta { font: 700 16px 'Segoe UI', Arial, sans-serif; letter-spacing: 0.14em; text-transform: uppercase; fill: #6B7F90; }
    .brand { font: 700 19px 'Segoe UI', Arial, sans-serif; letter-spacing: 0.12em; text-transform: uppercase; fill: #0B5C61; }
    .name { font: 800 39px 'Segoe UI', Arial, sans-serif; fill: #081320; }
    .variant { font: 600 22px 'Segoe UI', Arial, sans-serif; fill: #456173; }
    .price { font: 800 28px 'Segoe UI', Arial, sans-serif; fill: #0F172A; }
    .vs { font: 900 38px 'Segoe UI', Arial, sans-serif; letter-spacing: 0.08em; text-transform: uppercase; fill: #FFFFFF; }
    .headline { font: 700 27px 'Segoe UI', Arial, sans-serif; fill: #FFFFFF; }
    .foot { font: 600 18px 'Segoe UI', Arial, sans-serif; fill: #D7F6F2; }
  </style>
  <rect width="1200" height="630" rx="0" fill="url(#bg)"/>
  <rect x="46" y="42" width="1108" height="546" rx="34" fill="rgba(255,255,255,0.82)"/>
  <text x="76" y="90" class="eyebrow">Decide compare snapshot</text>
  <text x="1124" y="90" text-anchor="end" class="meta">${escapeXml(snapshot.winnerLabel)}</text>
  <rect x="70" y="122" width="450" height="308" rx="28" fill="#FFFFFF" stroke="#9FE8DD" stroke-width="2"/>
  <rect x="680" y="122" width="450" height="308" rx="28" fill="#FFFFFF" stroke="#C9DEFF" stroke-width="2"/>
  <rect x="540" y="208" width="120" height="120" rx="60" fill="#081320"/>
  <text x="600" y="281" text-anchor="middle" class="vs">VS</text>
  <rect x="94" y="148" width="126" height="38" rx="19" fill="#CCFBF1"/>
  <text x="157" y="173" text-anchor="middle" class="brand">${escapeXml(clampText(snapshot.leftBrand, 12))}</text>
  <rect x="980" y="148" width="126" height="38" rx="19" fill="#DBEAFE"/>
  <text x="1043" y="173" text-anchor="middle" class="brand">${escapeXml(clampText(snapshot.rightBrand, 12))}</text>
  ${renderTextLines(leftNameLines, 96, 236, 46, 'name')}
  ${renderTextLines(rightNameLines, 1102, 236, 46, 'name', 'end')}
  ${renderTextLines(leftVariantLines, 96, 332, 28, 'variant')}
  ${renderTextLines(rightVariantLines, 1102, 332, 28, 'variant', 'end')}
  <text x="96" y="394" class="meta">Best current price</text>
  <text x="1102" y="394" text-anchor="end" class="meta">Best current price</text>
  <text x="96" y="426" class="price">${escapeXml(snapshot.leftPrice)}</text>
  <text x="1102" y="426" text-anchor="end" class="price">${escapeXml(snapshot.rightPrice)}</text>
  <rect x="70" y="458" width="1060" height="108" rx="28" fill="#081320"/>
  <text x="98" y="497" class="eyebrow" fill="#7FE4D3">Head-to-head verdict</text>
  ${renderTextLines(headlineLines, 98, 535, 34, 'headline')}
  <text x="1104" y="540" text-anchor="end" class="foot">www.decide.com.ng</text>
</svg>`
}
