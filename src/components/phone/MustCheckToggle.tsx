// decide-web/src/components/phone/MustCheckToggle.tsx
//
// Shared used-phone inspection guide. This component appears on phone detail,
// used guide, analyzer, and recommendation result surfaces.

'use client'

import React, { useState } from 'react'

interface MustCheckToggleProps {
  os_type: 'ios' | 'android'
  brand_name: string
  phone_name?: string
}

type SafetyTone = 'safe' | 'caution' | 'danger'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h4 className="text-xs font-bold uppercase tracking-wide text-text-primary">
      {title}
    </h4>
    {children}
  </div>
)

const CheckItem = ({
  step,
  text,
  warning,
}: {
  step?: string | number
  text: string
  warning?: boolean
}) => (
  <div
    className={[
      'flex items-start gap-2 text-xs',
      warning ? 'text-amber-700' : 'text-text-secondary',
    ].join(' ')}
  >
    <span
      className={[
        'mt-0.5 shrink-0 font-bold',
        warning ? 'text-amber-500' : 'text-text-muted',
      ].join(' ')}
    >
      {step ? `${step}.` : '-'}
    </span>
    <span className="leading-snug">{text}</span>
  </div>
)

const TermRow = ({
  term,
  verdict,
  safe,
}: {
  term: string
  verdict: string
  safe: SafetyTone
}) => {
  const colour: Record<SafetyTone, string> = {
    safe: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    caution: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-red-200 bg-red-50 text-red-700',
  }

  const dot: Record<SafetyTone, string> = {
    safe: 'bg-emerald-500',
    caution: 'bg-amber-500',
    danger: 'bg-red-500',
  }

  return (
    <div className="flex items-start gap-2 border-b border-surface py-1.5 last:border-0">
      <div className={['mt-1 h-2 w-2 shrink-0 rounded-full', dot[safe]].join(' ')} />
      <div className="min-w-0 flex-1">
        <span className="text-xs font-semibold text-text-primary">{term}</span>
        <span className="text-xs text-text-muted"> - </span>
        <span
          className={[
            'inline-block rounded border px-1.5 py-0.5 text-xs font-medium',
            colour[safe],
          ].join(' ')}
        >
          {verdict}
        </span>
      </div>
    </div>
  )
}

const getModelNumber = (phoneName?: string): number => {
  if (!phoneName) return 0
  const match = phoneName.match(/\b(\d{2})\b/)
  return match ? Number(match[1]) : 0
}

const brandKey = (value: string): string => value.toLowerCase().trim()

const IphoneContent = ({ phone_name }: { phone_name?: string }) => {
  const modelNumber = getModelNumber(phone_name)
  const isMagSafeEra = modelNumber >= 12
  const isUsEsimEra = modelNumber >= 14
  const isOlderIphone = modelNumber > 0 && modelNumber <= 13

  return (
    <div className="space-y-4">
      <Section title="Why iPhone prices can look uneven">
        <div className="space-y-2 rounded-lg border border-accent/15 bg-tealTint px-3 py-3">
          <p className="text-xs leading-relaxed text-text-secondary">
            Do not judge an iPhone by the model name alone. An older Pro can cost more
            than a newer base model when the exact unit has better storage, cleaner
            condition, stronger battery health, or a safer region and SIM setup.
          </p>
          <div className="space-y-1.5">
            <CheckItem text="Compare the exact unit: storage size, region code, battery health, SIM or eSIM support, Face ID, True Tone, and repair history." />
            <CheckItem
              warning
              text="Two iPhone 12 units can have different prices. One may be clean stock; another may be converted, repaired, locked, or from a region that is harder to use or resell in Nigeria."
            />
          </div>
        </div>
      </Section>

      <Section title="What sellers say - what it means">
        <div className="overflow-hidden rounded-lg border border-surface">
          <TermRow
            term="Brand new, not activated"
            verdict="Best case, but verify serial and activation yourself"
            safe="safe"
          />
          <TermRow
            term="Brand new, activated"
            verdict="Can be fine, but warranty clock may already be running"
            safe="caution"
          />
          <TermRow
            term="UK used / US used"
            verdict="Condition matters more than the country label"
            safe="caution"
          />
          <TermRow
            term="LL/A or US model"
            verdict={isUsEsimEra ? 'US iPhone 14+ is eSIM-only; SIM tray is a red flag' : 'Check lock status and SIM behavior'}
            safe={isUsEsimEra ? 'danger' : 'caution'}
          />
          <TermRow
            term="ZP/A or Hong Kong stock"
            verdict="Often dual physical SIM; still verify IMEI and condition"
            safe="safe"
          />
          <TermRow
            term="CH/A or China stock"
            verdict="Usually dual SIM and no eSIM; resale can be lower"
            safe="caution"
          />
          <TermRow
            term="ZA/A or Africa stock"
            verdict="Usually easier for Nigerian SIM use"
            safe="safe"
          />
          <TermRow
            term="Refurbished"
            verdict="Only acceptable if the seller says exactly what changed"
            safe="caution"
          />
          <TermRow
            term="Converted / panel changed / Face ID not working"
            verdict="Walk away unless you truly know what you are buying"
            safe="danger"
          />
          <TermRow
            term="Locked / bypassed / owner will remove iCloud later"
            verdict="Do not pay"
            safe="danger"
          />
        </div>
      </Section>

      <Section title="Before you pay">
        <div className="space-y-2">
          <CheckItem
            step={1}
            text="Open Settings > General > About. Match model number, serial, IMEI, storage, and SIM status with what the seller advertised."
          />
          <CheckItem
            step={2}
            text="Check coverage.apple.com with the serial number. Treat older 'brand new' claims as old stock unless activation and warranty details make sense."
          />
          <CheckItem
            step={3}
            text="Check Battery Health. Below 80% is not automatic rejection, but the price should clearly reflect a battery replacement soon."
          />
          <CheckItem
            step={4}
            text="Test Face ID, True Tone, cameras, flash, speakers, microphone, earpiece, charging port, Wi-Fi, Bluetooth, hotspot, and both volume buttons."
          />
          <CheckItem
            step={5}
            text="Ask for a full erase in front of you and reach the Hello screen. If Activation Lock appears, do not buy."
          />
        </div>
      </Section>

      {(isUsEsimEra || isMagSafeEra || isOlderIphone) && (
        <Section title="Model-specific checks">
          {isUsEsimEra ? (
            <CheckItem
              warning
              text="For US iPhone 14 and newer models, there should be no physical SIM tray. A tray on an LL/A unit usually means the body was modified."
            />
          ) : null}
          {isMagSafeEra ? (
            <CheckItem
              warning
              text="Test MagSafe with a real MagSafe charger or accessory. Weak alignment can point to back-glass or internal repair issues."
            />
          ) : null}
          {isOlderIphone ? (
            <CheckItem
              warning
              text="For iPhone 11, 12, or 13, condition is the deal. A clean unit is fine; a cheap one with weak battery, broken Face ID, or display history is not a bargain."
            />
          ) : null}
        </Section>
      )}

      <Section title="Useful tools">
        <CheckItem text="Apple Coverage is the official warranty and activation check." />
        <CheckItem text="3uTools can reveal battery cycles and some replaced parts, but use it as a helpful signal, not the only proof." />
        <CheckItem text="IMEI/history sites can help, but they are third-party tools. Still insist on physical checks before paying." />
      </Section>
    </div>
  )
}

const SamsungContent = ({ phone_name }: { phone_name?: string }) => {
  const nameUpper = phone_name?.toUpperCase() ?? ''
  const isOlderS = /S(10|20|21|22)\b/.test(nameUpper)

  return (
    <div className="space-y-4">
      <Section title="Samsung checks">
        <div className="space-y-2">
          <CheckItem
            step={1}
            text="Run Samsung Members diagnostics for screen, touch, camera, speaker, microphone, sensors, charging, and battery."
          />
          <CheckItem
            step={2}
            text="Dial *#0#* if available. Some carrier or region builds may block it, so use Samsung Members as the backup check."
          />
          <CheckItem
            step={3}
            text="Check Settings > About phone > Software information. Knox Warranty Void 0x1 means the security fuse has been tripped."
          />
          <CheckItem
            step={4}
            text="Inspect the display on white, grey, and black screens for green lines, burn-in, dead pixels, and touch dead zones."
          />
          <CheckItem
            step={5}
            text="Check IMEI, region, and network behavior with your SIM. Do not rely on the box alone."
            warning
          />
        </div>
      </Section>

      {isOlderS ? (
        <Section title="Older S-series warning">
          <CheckItem
            warning
            text={`${phone_name ?? 'This S-series model'} should be treated as used or old stock. Be suspicious of a casual 'brand new' claim unless warranty and activation proof are clean.`}
          />
        </Section>
      ) : null}

      <Section title="Samsung Nigeria reality">
        <CheckItem text="Samsung parts and technicians are easier to find than most Android brands, but warranty depends on region, seller, and invoice." />
        <CheckItem text="For A-series and older flagships, display quality is the big money risk. Price a possible screen repair before you pay." />
      </Section>
    </div>
  )
}

const TranssionContent = ({ brand_name }: { brand_name: string }) => (
  <div className="space-y-4">
    <AndroidCoreChecks />
    <Section title={`${brand_name}-specific`}>
      <CheckItem text="Tecno, Infinix, and Itel usually have better local repair reach through the Transsion/Carlcare ecosystem." />
      <CheckItem text="Check charging speed, speaker loudness, touch response, camera focus, and battery drain. These matter more than benchmark talk in this price range." />
      <CheckItem text="For Phantom, GT, Note, and higher-end models, confirm exact variant, RAM/storage, and region before comparing prices." warning />
    </Section>
  </div>
)

const XiaomiContent = () => (
  <div className="space-y-4">
    <AndroidCoreChecks />
    <Section title="Redmi / Xiaomi / Poco checks">
      <CheckItem
        warning
        text="Confirm Global ROM or the exact region ROM. China ROM can affect Google services, notifications, and resale."
      />
      <CheckItem text="Check Play Protect certification in the Play Store settings. If it is not certified, ask why before paying." />
      <CheckItem text="Check bootloader status in developer settings if available. An unlocked bootloader can mean custom software history." />
      <CheckItem text="For Poco and performance models, test heat, charging, cameras, fingerprint, and screen refresh rate before paying." />
    </Section>
  </div>
)

const PixelContent = () => (
  <div className="space-y-4">
    <AndroidCoreChecks />
    <Section title="Google Pixel checks">
      <CheckItem
        warning
        text="Pixels are usually grey-market buys in Nigeria. Software is excellent, but local repair support is the weak point."
      />
      <CheckItem text="Test your SIM, mobile data, hotspot, calls, and 4G/5G behavior before paying. Do not assume every imported unit behaves the same." />
      <CheckItem text="Check screen, camera focus, fingerprint/Face Unlock where available, charging, and overheating during camera/video use." />
      <CheckItem text="Buy Pixels from sellers who can handle after-sale issues, because parts and specialist repair are not as straightforward as Samsung or Transsion." />
    </Section>
  </div>
)

const OnePlusContent = () => (
  <div className="space-y-4">
    <AndroidCoreChecks />
    <Section title="OnePlus checks">
      <CheckItem warning text="OnePlus is mostly an enthusiast/grey-market buy in Nigeria. Repairs depend heavily on specialist shops." />
      <CheckItem text="Confirm OxygenOS/global software, SIM behavior, fast charging, fingerprint, camera focus, and screen condition." />
      <CheckItem text="Avoid units with unclear software conversions or missing fast-charge accessories unless the price reflects it." />
    </Section>
  </div>
)

const BbkContent = ({ brand_name }: { brand_name: string }) => (
  <div className="space-y-4">
    <AndroidCoreChecks />
    <Section title={`${brand_name}-specific`}>
      <CheckItem text="For Oppo, Vivo, and Realme, confirm warranty path with the seller because after-sales support varies by model and source." />
      <CheckItem text="Test camera focus, charging speed, fingerprint, face unlock, speaker, and network behavior. These are common daily-use pain points." />
      <CheckItem warning text="If the price is close to a newer Samsung, Redmi, Tecno, or Infinix with easier parts, compare repair risk before paying." />
    </Section>
  </div>
)

const AndroidCoreChecks = () => (
  <Section title="Before you pay">
    <div className="space-y-2">
      <CheckItem step={1} text="Dial *#06#, write down the IMEI, and match it with the box or receipt if available." />
      <CheckItem step={2} text="Factory reset protection matters. After reset, the phone must not ask for the previous owner's Google account." />
      <CheckItem step={3} text="Insert your SIM and test calls, data, hotspot, network mode, and both SIM slots where available." />
      <CheckItem step={4} text="Test screen brightness, touch, fingerprint, face unlock, cameras, flash, speaker, microphone, earpiece, vibration, and buttons." />
      <CheckItem step={5} text="Plug it in and confirm fast charging starts. Check the port for looseness, heat, and cable sensitivity." />
      <CheckItem step={6} warning text="A very large discount is not free money. Ask what you are accepting: weak battery, repaired screen, network issue, or no after-sale support." />
    </div>
  </Section>
)

const AndroidContent = ({ brand_name }: { brand_name: string }) => {
  const key = brandKey(brand_name)

  if (key === 'tecno' || key === 'infinix' || key === 'itel') {
    return <TranssionContent brand_name={brand_name} />
  }

  if (key === 'xiaomi' || key === 'redmi' || key === 'poco') {
    return <XiaomiContent />
  }

  if (key === 'google' || key === 'pixel') {
    return <PixelContent />
  }

  if (key === 'oneplus') {
    return <OnePlusContent />
  }

  if (key === 'oppo' || key === 'vivo' || key === 'realme') {
    return <BbkContent brand_name={brand_name} />
  }

  return (
    <div className="space-y-4">
      <AndroidCoreChecks />
      <Section title="Android buying reality">
        <CheckItem text="Prioritize clean condition, parts availability, warranty path, and a seller you can reach after payment." />
        <CheckItem text="If a newer model from a better-supported brand is close in price, compare that before choosing the cheaper used unit." />
      </Section>
    </div>
  )
}

export const MustCheckToggle = ({
  os_type,
  brand_name,
  phone_name,
}: MustCheckToggleProps) => {
  const [open, setOpen] = useState(false)

  const key = brandKey(brand_name)
  const isApple = os_type === 'ios' || key === 'apple'
  const isSamsung = key === 'samsung'

  return (
    <div className="overflow-hidden rounded-xl border border-accent-200 bg-accent-50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">
            !
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-accent-800">
            Must Check Before You Buy
          </span>
        </span>
        <span
          className={[
            'text-accent-500 transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-accent-200 px-4 pb-4 pt-3">
          {isApple ? <IphoneContent phone_name={phone_name} /> : null}
          {isSamsung ? <SamsungContent phone_name={phone_name} /> : null}
          {!isApple && !isSamsung ? <AndroidContent brand_name={brand_name} /> : null}
        </div>
      ) : null}
    </div>
  )
}

export default MustCheckToggle
