import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const size = {
  width: 1200,
  height: 630,
}

const clampText = (value: string | null, fallback: string, maxLength: number) => {
  const source = value?.trim() || fallback

  if (source.length <= maxLength) {
    return source
  }

  return `${source.slice(0, maxLength - 1).trimEnd()}…`
}

const formatPrice = (value: string | null) => {
  if (!value) {
    return 'Current price pending'
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 'Current price pending'
  }

  return `Best current ₦${parsed.toLocaleString('en-NG')}`
}

const buildPhonePanel = ({
  brand,
  name,
  variant,
  price,
  accent,
  align,
}: {
  brand: string
  name: string
  variant: string | null
  price: string
  accent: string
  align: 'left' | 'right'
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: 452,
      minHeight: 300,
      padding: '30px 32px',
      borderRadius: 32,
      border: `2px solid ${accent}`,
      background: 'rgba(255,255,255,0.9)',
      boxShadow: '0 18px 40px rgba(8, 19, 32, 0.08)',
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        alignItems: align === 'left' ? 'flex-start' : 'flex-end',
        textAlign: align,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: 999,
          padding: '8px 14px',
          background: accent,
          color: '#052b2f',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {brand}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          color: '#081320',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 42,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            lineHeight: 1.25,
            color: '#466173',
          }}
        >
          {variant || 'Tracked compare configuration'}
        </div>
      </div>
    </div>

    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: align === 'left' ? 'flex-start' : 'flex-end',
        textAlign: align,
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#6f8796',
        }}
      >
        Nigerian compare view
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 30,
          fontWeight: 800,
          lineHeight: 1.1,
          color: '#0f172a',
        }}
      >
        {price}
      </div>
    </div>
  </div>
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const leftName = clampText(searchParams.get('left'), 'Left phone', 42)
  const rightName = clampText(searchParams.get('right'), 'Right phone', 42)
  const leftBrand = clampText(searchParams.get('left_brand'), 'Phone A', 18)
  const rightBrand = clampText(searchParams.get('right_brand'), 'Phone B', 18)
  const leftVariant = clampText(
    searchParams.get('left_variant'),
    'Tracked compare configuration',
    34
  )
  const rightVariant = clampText(
    searchParams.get('right_variant'),
    'Tracked compare configuration',
    34
  )
  const headline = clampText(
    searchParams.get('headline'),
    'Compare Nigerian prices, Decide scores, and the differences that matter.',
    118
  )
  const leftPrice = formatPrice(searchParams.get('left_price'))
  const rightPrice = formatPrice(searchParams.get('right_price'))

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '42px 46px',
          background:
            'linear-gradient(140deg, #effcf7 0%, #ffffff 46%, #e7f2ff 100%)',
          color: '#081320',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 18,
                height: 18,
                borderRadius: 999,
                background: '#14b8a6',
              }}
            />
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#0b5c61',
              }}
            >
              Decide Compare
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              borderRadius: 999,
              padding: '10px 16px',
              border: '1px solid rgba(11, 92, 97, 0.14)',
              background: 'rgba(255,255,255,0.72)',
              fontSize: 18,
              color: '#4b6474',
            }}
          >
            Shareable head-to-head card
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 26,
            flex: 1,
          }}
        >
          {buildPhonePanel({
            brand: leftBrand,
            name: leftName,
            variant: leftVariant,
            price: leftPrice,
            accent: 'rgba(20, 184, 166, 0.20)',
            align: 'left',
          })}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 22,
              width: 140,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: 999,
                background: '#081320',
                color: '#ffffff',
                fontSize: 40,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              VS
            </div>
            <div
              style={{
                display: 'flex',
                textAlign: 'center',
                fontSize: 18,
                lineHeight: 1.35,
                color: '#5a7180',
              }}
            >
              Prices, scores, and ownership signals
            </div>
          </div>

          {buildPhonePanel({
            brand: rightBrand,
            name: rightName,
            variant: rightVariant,
            price: rightPrice,
            accent: 'rgba(59, 130, 246, 0.18)',
            align: 'right',
          })}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: 30,
            padding: '24px 28px',
            borderRadius: 28,
            background: '#081320',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#86efdc',
            }}
          >
            Decide verdict context
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              lineHeight: 1.25,
            }}
          >
            {headline}
          </div>
        </div>
      </div>
    ),
    size
  )
}
