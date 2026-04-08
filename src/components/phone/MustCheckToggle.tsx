// decide-web/src/components/phone/MustCheckToggle.tsx
//
// "Must Check Before You Buy" — collapsed by default.
// Renders iPhone-specific or Android-specific buyer intelligence based on
// the phone's os_type and brand.
//
// Used on:
//   - Every recommendation result card (ResultsPanel)
//   - Every phone detail page (phones/[slug]/page.tsx)
//
// No API calls — all content is static, written directly here.
// Content is the distilled, honest truth about the Nigerian used phone market.

'use client'

import React, { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface MustCheckToggleProps {
  os_type:    'ios' | 'android'
  brand_name: string  // e.g. "Apple", "Samsung", "Tecno"
  // Phone-specific context — only used to conditionally show model-specific warnings
  phone_name?: string // e.g. "iPhone 14 Pro Max"
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">
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
  <div className={`flex items-start gap-2 text-xs ${warning ? 'text-amber-700' : 'text-text-secondary'}`}>
    <span className={`flex-shrink-0 font-bold mt-0.5 ${warning ? 'text-amber-500' : 'text-text-muted'}`}>
      {step ? `${step}.` : '•'}
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
  safe: 'safe' | 'caution' | 'danger'
}) => {
  const colour = {
    safe:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    caution: 'bg-amber-50  text-amber-700  border-amber-200',
    danger:  'bg-red-50    text-red-700    border-red-200',
  }[safe]

  const dot = {
    safe:    'bg-emerald-500',
    caution: 'bg-amber-500',
    danger:  'bg-red-500',
  }[safe]

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-surface last:border-0">
      <div className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${dot}`} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-text-primary">{term}</span>
        <span className="text-xs text-text-muted"> — </span>
        <span className={`inline-block text-xs px-1.5 py-0.5 rounded border font-medium ${colour}`}>
          {verdict}
        </span>
      </div>
    </div>
  )
}

// ── iPhone content ─────────────────────────────────────────────────────────────

const IphoneContent = ({ phone_name }: { phone_name?: string }) => {
  // Detect iPhone 12+ for MagSafe check and iPhone 14+ for physical SIM warning
  const modelNumber = phone_name ? parseInt(phone_name.replace(/\D+/g, '').slice(0, 2)) : 0
  const isMagSafeEra  = modelNumber >= 12
  const isEsimEra     = modelNumber >= 14
  const isBrandNewEra = modelNumber >= 16

  return (
    <div className="space-y-4">

      {/* Terms decoder */}
      <Section title="What sellers say — what it means">
        <div className="rounded-lg border border-surface overflow-hidden">
          <TermRow term="Brand new non-active"          verdict="Safe — best option"                                        safe="safe"    />
          <TermRow term="Brand new active"              verdict="Safe — slightly lower resale value"                        safe="safe"    />
          <TermRow term="UK used"                       verdict="Risky — verify thoroughly"                                 safe="caution" />
          <TermRow term="US used"                       verdict="Risky — check eSIM situation first"                       safe="caution" />
          <TermRow term="LLA / LL/A (US variant)"       verdict={isEsimEra ? "eSIM only — physical SIM = converted, walk away" : "Check eSIM situation"}  safe={isEsimEra ? "danger" : "caution"} />
          <TermRow term="HK/A (Hong Kong)"              verdict="Dual physical SIM — generally safe"                       safe="safe"    />
          <TermRow term="CH/A (China)"                  verdict="Dual SIM, no eSIM, cheaper but lower resale"              safe="caution" />
          <TermRow term="ZA/A (South Africa)"           verdict="Dual SIM, designed for Africa — good for Nigeria"         safe="safe"    />
          <TermRow term="TRA/A (Middle East)"           verdict="Check carrier lock before buying"                         safe="caution" />
          <TermRow term="Refurbished"                   verdict="Not necessarily bad — must be disclosed honestly"         safe="caution" />
          <TermRow term="Converted"                     verdict="Walk away"                                                 safe="danger"  />
          <TermRow term="Locked"                        verdict="Walk away unless carrier is confirmed"                    safe="danger"  />
        </div>
      </Section>

      {/* Model-specific red flags */}
      {(isEsimEra || isMagSafeEra || isBrandNewEra) && (
        <Section title="Red flags for this model">
          {isEsimEra && (
            <CheckItem
              warning
              text={`iPhone 14 and newer have no physical SIM tray in the US model. If you see a SIM tray on a LL/A variant — it has been physically converted. Walk away.`}
            />
          )}
          {isMagSafeEra && (
            <CheckItem
              warning
              text="Test MagSafe before paying. Hold a magnet near the back — if it doesn't stick cleanly, the battery or back glass has been tampered with."
            />
          )}
          {isBrandNewEra && (
            <CheckItem
              warning
              text="iPhone 16 and 17 are the only models where genuine brand new stock exists in Nigeria. Any seller claiming 'brand new' for older models is lying."
            />
          )}
        </Section>
      )}

      {/* 5 steps */}
      <Section title="5 steps before paying">
        <div className="space-y-2">
          <CheckItem step={1} text="Dial *#06# — write down the IMEI. Match it to the box and the sticker inside the SIM tray." />
          <CheckItem step={2} text="Go to checkcoverage.apple.com — enter the serial number from Settings → General → About. Check activation date and warranty status." />
          <CheckItem step={3} text="Settings → General → About — check model number. LL/A ending + physical SIM slot = converted. Walk away." />
          {isMagSafeEra && (
            <CheckItem step={4} text="Test MagSafe — hold a small magnet near the back. No stick = tampered battery or back glass. Walk away." />
          )}
          <CheckItem step={isMagSafeEra ? 5 : 4} text="Ask seller to factory reset in front of you and get to the 'Hello' activation screen. If it asks for an Apple ID — the phone is still linked. Do not buy." />
        </div>
      </Section>

      {/* Power tools */}
      <Section title="Power tools (if you're serious)">
        <CheckItem text="imeipro.info — paste the IMEI to check stolen status and full history." />
        <CheckItem text="3uTools (Windows app) — connects via USB, shows full hardware report including replaced screen, battery, and back glass. Almost unknown in Nigeria but extremely powerful. Free." />
        <CheckItem text="checkcoverage.apple.com — Apple's own tool. The most reliable source of warranty and activation status." />
      </Section>

    </div>
  )
}

// ── Samsung content ────────────────────────────────────────────────────────────

const SamsungContent = ({ phone_name }: { phone_name?: string }) => {
  // Detect old S-series that's out of production
  const nameUpper = phone_name?.toUpperCase() ?? ''
  const isOldS = /S(10|20|21|22)\b/.test(nameUpper)

  return (
    <div className="space-y-4">

      <Section title="Samsung-specific checks">
        <div className="space-y-2">
          <CheckItem
            step={1}
            text="Dial *#0#* — the Samsung diagnostic screen opens immediately. Nothing happens = fake phone."
          />
          <CheckItem
            step={2}
            text="Settings → About Phone → Software Information → Knox Warranty Void. If it says '1' — the bootloader has been tampered with. Walk away."
          />
          <CheckItem
            step={3}
            text="Open Samsung Members app — it auto-detects if the device is genuine Samsung hardware. If it doesn't recognise the device, it isn't real."
          />
          <CheckItem
            step={4}
            text="Check IMEI — dial *#06#, match IMEI1 to the box, then verify on imei.info for stolen status and country of purchase."
          />
          <CheckItem
            step={5}
            warning
            text="Knox Guard warning — if the IMEI check shows Knox Guard active, the device can be remotely locked by the original buyer (usually a corporate buyer or carrier). Do not buy."
          />
        </div>
      </Section>

      {isOldS && (
        <Section title="Red flag for this model">
          <CheckItem
            warning
            text={`The ${phone_name ?? 'S-series model'} is no longer in production. Any seller calling it 'brand new' is lying. Only buy used with proper verification.`}
          />
        </Section>
      )}

      <Section title="Gray market reality for Samsung in Nigeria">
        <CheckItem text="Most Samsung A-series sold in Nigeria are South African or Asian stock. This is generally fine — the hardware is identical. The gray market risk mainly affects warranty claims." />
        <CheckItem text="Samsung Nigeria has service centres in Lagos (Victoria Island and Ikeja) and Abuja. For any Samsung, confirm you're within reach of a service centre before buying." />
      </Section>

    </div>
  )
}

// ── Generic Android content (all other brands) ────────────────────────────────

const AndroidContent = ({ brand_name }: { brand_name: string }) => (
  <div className="space-y-4">

    <Section title="Before you pay">
      <div className="space-y-2">
        <CheckItem step={1} text="Dial *#06# — write down the IMEI, match it to the box." />
        <CheckItem step={2} text="Check IMEI on imei.info — verify it's not reported stolen and check the country of purchase." />
        <CheckItem step={3} text="Ask the seller to boot the phone from completely powered off in front of you. Reluctance = red flag." />
        <CheckItem step={4} text="Test every port and button — charging port, volume buttons, power button, headphone jack if present." />
        <CheckItem step={5} warning text="If the price is too good to be true, it almost certainly is. In the Nigerian market, a ₦10k discount is normal. A ₦30k+ discount on an identical listing elsewhere means something is wrong." />
      </div>
    </Section>

    {/* Brand-specific notes for brands with known issues */}
    {brand_name.toLowerCase() === 'tecno' && (
      <Section title="Tecno-specific">
        <CheckItem text="Tecno has official service centres across Nigeria (Lagos, Abuja, PH, Kano). Parts are widely available. Good after-sales for budget phones." />
        <CheckItem text="Phantom series has gray market stock. Camon and Spark are mostly officially distributed — lower risk." />
      </Section>
    )}

    {brand_name.toLowerCase() === 'infinix' && (
      <Section title="Infinix-specific">
        <CheckItem text="Infinix and Tecno are both Transsion brands — same service centre network. Parts readily available across Nigeria." />
        <CheckItem text="Zero and GT series are more likely to be gray market than Smart and Hot series." />
      </Section>
    )}

    {brand_name.toLowerCase() === 'xiaomi' || brand_name.toLowerCase() === 'redmi' ? (
      <Section title="Xiaomi / Redmi-specific">
        <CheckItem warning text="Xiaomi has no official presence in Nigeria. All stock is gray market. Parts availability is fair in Lagos, poor outside major cities." />
        <CheckItem text="Global ROM vs China ROM matters — China ROM has less Google integration. Ask the seller which ROM is installed, or check Settings → About Phone → MIUI version." />
        <CheckItem text="Mi Flash Unlock — if the bootloader is unlocked (check in Settings → About → MIUI), custom ROM may be installed. Verify with the seller." />
      </Section>
    ) : null}

    {(brand_name.toLowerCase() === 'oneplus') && (
      <Section title="OnePlus-specific">
        <CheckItem warning text="OnePlus has no official service centres in Nigeria. Gray market only. Repairs require sending to Lagos specialists or third-party shops." />
        <CheckItem text="OxygenOS global version is fine. Avoid ColorOS variants (typically India-specific builds). Check Settings → About → Android Version." />
      </Section>
    )}

    {(brand_name.toLowerCase() === 'google' || brand_name.toLowerCase() === 'pixel') && (
      <Section title="Google Pixel-specific">
        <CheckItem warning text="Google Pixel has no official presence or service in Nigeria. All units are gray market. Factor this into your decision — if anything goes wrong, you're on your own." />
        <CheckItem text="US Pixel 8+ models are eSIM-only in the US (similar to iPhone 14+ situation). Verify the model variant before buying." />
        <CheckItem text="Pixels receive guaranteed Android updates direct from Google. Despite the service gap, this is one of the most software-secure Android phones you can buy." />
      </Section>
    )}

  </div>
)

// ── Main component ─────────────────────────────────────────────────────────────

export const MustCheckToggle = ({ os_type, brand_name, phone_name }: MustCheckToggleProps) => {
  const [open, setOpen] = useState(false)

  const isApple   = os_type === 'ios' || brand_name.toLowerCase() === 'apple'
  const isSamsung = brand_name.toLowerCase() === 'samsung'

  return (
    <div className="rounded-xl border border-accent-200 bg-accent-50 overflow-hidden">

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 hover:bg-accent-100 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">⚠️</span>
          <span className="text-xs font-bold text-accent-800 tracking-wide uppercase">
            Must Check Before You Buy
          </span>
        </span>
        <span
          className={`text-accent-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Expandable content */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-accent-200">
          {isApple   && <IphoneContent  phone_name={phone_name} />}
          {isSamsung && <SamsungContent phone_name={phone_name} />}
          {!isApple && !isSamsung && (
            <AndroidContent brand_name={brand_name} />
          )}
        </div>
      )}

    </div>
  )
}

export default MustCheckToggle