import type { PhoneDetail } from '@/types'

export type UsedPhoneRiskTone = 'danger' | 'caution' | 'watch' | 'safer'

export interface UsedPhoneRiskIndicator {
  title: string
  tone: UsedPhoneRiskTone
  summary: string
  checks: string[]
}

const CURRENT_YEAR = new Date().getFullYear()

const getYearsSinceRelease = (phone: PhoneDetail) =>
  phone.released_year ? Math.max(CURRENT_YEAR - phone.released_year, 0) : null

const brandKey = (value: string) => value.toLowerCase().trim()

const getIphoneModelNumber = (phoneName: string) => {
  const match = phoneName.match(/\b(\d{2})\b/)
  return match ? Number(match[1]) : 0
}

const getModelAgeIndicator = (phone: PhoneDetail): UsedPhoneRiskIndicator | null => {
  const yearsSinceRelease = getYearsSinceRelease(phone)

  if (yearsSinceRelease == null || yearsSinceRelease < 3) {
    return null
  }

  return {
    title: 'Old-stock or disguised-used claim',
    tone: yearsSinceRelease >= 5 ? 'danger' : 'caution',
    summary:
      `${phone.name} is about ${yearsSinceRelease} years old. Be careful with any seller calling it brand new without clean activation or warranty proof.`,
    checks: [
      'Ask whether it is sealed, activated, refurbished, or foreign used.',
      'Check activation, warranty, battery, and repair history before paying.',
      'Do not pay a fresh-launch price for old stock unless the proof is unusually clean.',
    ],
  }
}

const getSupportIndicator = (phone: PhoneDetail): UsedPhoneRiskIndicator | null => {
  if (phone.local_support_quality !== 'poor') {
    return null
  }

  return {
    title: 'Repair support risk',
    tone: 'caution',
    summary:
      'The scam risk is not only whether the phone is real. It is also whether you can afford the repair path if a hidden fault appears after payment.',
    checks: [
      'Price the screen, battery, charging port, and board repair before you agree.',
      'Prefer a seller with a return window or after-sale support.',
      'Compare against a better-supported alternative if the price gap is small.',
    ],
  }
}

const getGrayMarketIndicator = (phone: PhoneDetail): UsedPhoneRiskIndicator | null => {
  if (phone.gray_market_risk === 'low') {
    return null
  }

  return {
    title: phone.gray_market_risk === 'high' ? 'High gray-market risk' : 'Variant verification needed',
    tone: phone.gray_market_risk === 'high' ? 'danger' : 'caution',
    summary:
      phone.gray_market_note ||
      'The exact variant, source market, warranty path, and seller story matter here. Do not judge the offer by model name alone.',
    checks: [
      'Match IMEI, model number, storage, SIM behavior, and region with the seller claim.',
      'Ask what country the unit came from and whether anything was converted.',
      'Walk away if the seller cannot explain the variant clearly.',
    ],
  }
}

const getIphoneIndicators = (phone: PhoneDetail): UsedPhoneRiskIndicator[] => {
  const modelNumber = getIphoneModelNumber(phone.name)
  const indicators: UsedPhoneRiskIndicator[] = [
    {
      title: 'iCloud or Activation Lock trap',
      tone: 'danger',
      summary:
        'The biggest iPhone scam risk is paying before the phone is fully erased and activated under your control.',
      checks: [
        'Ask the seller to erase the phone in front of you.',
        'Reach the Hello screen and complete activation before money changes hands.',
        'Do not accept “the owner will remove iCloud later.”',
      ],
    },
    {
      title: 'Face ID, True Tone, and parts history',
      tone: 'caution',
      summary:
        'A cheap iPhone with broken Face ID, missing True Tone, weak battery, or undisclosed screen work is usually not a bargain.',
      checks: [
        'Test Face ID, True Tone, cameras, speaker, microphone, charging, and buttons.',
        'Check Battery Health and price in a replacement if it is below 80%.',
        'Ask directly whether the screen, battery, back glass, or board has been changed.',
      ],
    },
  ]

  if (modelNumber >= 14) {
    indicators.push({
      title: 'US eSIM conversion warning',
      tone: 'danger',
      summary:
        'US iPhone 14 and newer models should be eSIM-only. A physical SIM tray on an LL/A unit is a serious modification signal.',
      checks: [
        'Check model number and region code in Settings.',
        'Confirm SIM/eSIM behavior with your own line.',
        'Avoid converted units unless you intentionally accept the repair and resale risk.',
      ],
    })
  } else {
    indicators.push({
      title: 'Region, lock, and SIM mismatch',
      tone: 'caution',
      summary:
        'Region codes can affect SIM behavior, warranty expectations, resale confidence, and whether the seller story makes sense.',
      checks: [
        'Check model number and region code in Settings.',
        'Insert your SIM and test calls, data, hotspot, and network behavior.',
        'Be extra careful with locked, bypassed, converted, or vague import stories.',
      ],
    })
  }

  return indicators
}

const getAndroidIndicators = (phone: PhoneDetail): UsedPhoneRiskIndicator[] => {
  const key = brandKey(phone.brand_name)
  const indicators: UsedPhoneRiskIndicator[] = [
    {
      title: 'Google account / FRP lock',
      tone: 'danger',
      summary:
        'A used Android can look normal until reset, then demand the previous owner’s Google account.',
      checks: [
        'Factory reset before paying and complete setup with your own account.',
        'Reject “I will send the password later” or “my brother owns the account.”',
        'Check that Find My Device or brand account locks are removed.',
      ],
    },
    {
      title: 'IMEI, network, and SIM story',
      tone: 'caution',
      summary:
        'Wrong variants, network issues, or blocked devices often hide behind a cheap asking price.',
      checks: [
        'Dial *#06# and match IMEI with the seller story, box, or receipt.',
        'Insert your SIM and test calls, data, hotspot, and both SIM slots where available.',
        'Walk away from a seller who avoids live network testing.',
      ],
    },
  ]

  if (key === 'samsung') {
    indicators.push({
      title: 'Screen burn, green line, and Knox risk',
      tone: 'caution',
      summary:
        'Samsung used deals can be spoiled by expensive display faults or a tripped Knox/security history.',
      checks: [
        'Run Samsung Members diagnostics and inspect white, grey, and black screens.',
        'Check for green lines, burn-in, dead zones, fingerprint issues, and charging heat.',
        'Check Knox Warranty Void where available before treating it as clean stock.',
      ],
    })
  } else if (key === 'xiaomi' || key === 'redmi' || key === 'poco') {
    indicators.push({
      title: 'ROM, bootloader, and Play Protect risk',
      tone: 'caution',
      summary:
        'Some Xiaomi/Redmi/Poco units are sold with unclear software history, region ROMs, or certification issues.',
      checks: [
        'Confirm Global ROM or the exact region ROM before paying.',
        'Check Play Protect certification in Play Store settings.',
        'Ask why the bootloader is unlocked if you find signs of custom software.',
      ],
    })
  } else if (key === 'google' || key === 'pixel') {
    indicators.push({
      title: 'Pixel repair and network caution',
      tone: 'caution',
      summary:
        'Pixels can be excellent used phones, but Nigeria repair support and imported-unit network behavior deserve extra checks.',
      checks: [
        'Test calls, 4G/5G behavior, hotspot, camera heat, charging, and fingerprint/Face Unlock.',
        'Prefer sellers who can handle after-sale issues.',
        'Compare repair risk against Samsung, Tecno, Infinix, or Redmi alternatives.',
      ],
    })
  } else {
    indicators.push({
      title: 'Hidden repair or parts swap',
      tone: 'caution',
      summary:
        'The phone may be genuine but still expensive to own if the screen, battery, charging port, or board was poorly repaired.',
      checks: [
        'Test screen, touch, cameras, speakers, microphones, charging, fingerprint, and buttons.',
        'Ask which parts have been replaced and whether original parts were used.',
        'Use the price gap to decide whether the risk is actually worth it.',
      ],
    })
  }

  return indicators
}

export const buildUsedPhoneRiskIndicators = (
  phone: PhoneDetail
): UsedPhoneRiskIndicator[] => {
  const baseIndicators = [
    getGrayMarketIndicator(phone),
    getModelAgeIndicator(phone),
    getSupportIndicator(phone),
  ].filter((indicator): indicator is UsedPhoneRiskIndicator => Boolean(indicator))

  const platformIndicators =
    phone.os_type === 'ios' || brandKey(phone.brand_name) === 'apple'
      ? getIphoneIndicators(phone)
      : getAndroidIndicators(phone)

  return [...baseIndicators, ...platformIndicators].slice(0, 6)
}

export const GENERIC_USED_SCAM_INDICATORS: UsedPhoneRiskIndicator[] = [
  {
    title: 'Payment pressure before inspection',
    tone: 'danger',
    summary:
      'A seller rushing deposit, delivery fee, or full payment before inspection is the fastest path to buyer regret.',
    checks: [
      'Inspect the exact phone before paying.',
      'Use safe public handoff or a trusted person near the seller.',
      'Keep chat, receipt, IMEI, and payment evidence.',
    ],
  },
  {
    title: 'Too-cheap listing with a vague story',
    tone: 'danger',
    summary:
      'A very low price needs a reason. If the reason is unclear, assume hidden fault, wrong variant, stolen-device risk, or bait-and-switch.',
    checks: [
      'Ask why it is cheaper than nearby listings.',
      'Verify model, storage, condition, and repair history.',
      'Walk away if the seller keeps changing the story.',
    ],
  },
  {
    title: 'Account lock or reset avoidance',
    tone: 'danger',
    summary:
      'If the seller avoids reset and activation checks, the phone may be locked, bypassed, stolen, or not fully theirs to sell.',
    checks: [
      'Factory reset before payment.',
      'Activate with your own account or SIM where relevant.',
      'Reject “I will unlock it later.”',
    ],
  },
  {
    title: 'Hidden repair history',
    tone: 'caution',
    summary:
      'Many used phones are still usable after repair, but undisclosed parts swaps should change the price and your risk tolerance.',
    checks: [
      'Ask what has been changed.',
      'Test the expensive parts slowly.',
      'Price future screen, battery, and board repairs before paying.',
    ],
  },
]
