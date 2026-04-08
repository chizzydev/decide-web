// decide-web/src/components/phone/PhoneSpecSheet.tsx
// Full spec sheet for a phone — used on the detail page and compare page.
// The `compact` prop reduces padding/spacing for the two-column compare layout.

import React from 'react'
import type { PhoneDetail } from '@/types'

interface PhoneSpecSheetProps {
  phone:     PhoneDetail
  compact?:  boolean
}

interface SpecRowProps {
  label: string
  value: string | number | boolean | null | undefined
  compact?: boolean
}

const Row = ({ label, value, compact }: SpecRowProps) => {
  if (value === null || value === undefined || value === '') return null

  const display =
    typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)

  return (
    <div
      className={[
        'flex justify-between gap-4 border-b border-border last:border-0',
        compact ? 'py-2' : 'py-2.5',
      ].join(' ')}
    >
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <span className="text-xs font-semibold text-text-primary text-right">{display}</span>
    </div>
  )
}

interface SpecSectionProps {
  title:    string
  children: React.ReactNode
  compact?: boolean
}

const Section = ({ title, children, compact }: SpecSectionProps) => (
  <div className={compact ? 'space-y-0' : 'space-y-0'}>
    <p className={[
      'text-xs font-bold text-text-muted uppercase tracking-wider',
      compact ? 'mb-1.5 mt-4' : 'mb-2 mt-6',
    ].join(' ')}>
      {title}
    </p>
    {children}
  </div>
)

export const PhoneSpecSheet = ({ phone, compact = false }: PhoneSpecSheetProps) => (
  <div className="text-sm">

    <Section title="Display" compact={compact}>
      <Row label="Size"         value={phone.display_size_inches ? `${phone.display_size_inches}"` : null} compact={compact} />
      <Row label="Type"         value={phone.display_type}        compact={compact} />
      <Row label="Resolution"   value={phone.display_resolution}  compact={compact} />
      <Row label="Refresh Rate" value={phone.refresh_rate_hz ? `${phone.refresh_rate_hz}Hz` : null} compact={compact} />
    </Section>

    <Section title="Performance" compact={compact}>
      <Row label="Chipset"      value={phone.chipset}             compact={compact} />
      <Row label="CPU"          value={phone.cpu_description}     compact={compact} />
      <Row label="GPU"          value={phone.gpu}                 compact={compact} />
      <Row label="RAM"          value={phone.ram_gb ? `${phone.ram_gb}GB` : null} compact={compact} />
      <Row label="Storage"      value={phone.storage_gb ? `${phone.storage_gb}GB` : null} compact={compact} />
      <Row label="Expandable"   value={phone.has_expandable_storage} compact={compact} />
    </Section>

    <Section title="Camera" compact={compact}>
      <Row label="Setup"        value={phone.camera_setup}        compact={compact} />
      <Row label="Main"         value={phone.main_camera_mp ? `${phone.main_camera_mp}MP` : null} compact={compact} />
      <Row label="Selfie"       value={phone.selfie_camera_mp ? `${phone.selfie_camera_mp}MP` : null} compact={compact} />
      <Row label="4K Video"     value={phone.has_4k_video}        compact={compact} />
    </Section>

    <Section title="Battery" compact={compact}>
      <Row label="Capacity"     value={phone.battery_mah ? `${phone.battery_mah}mAh` : null} compact={compact} />
      <Row label="Charging"     value={phone.charging_speed_w ? `${phone.charging_speed_w}W` : null} compact={compact} />
      <Row label="Wireless"     value={phone.has_wireless_charging} compact={compact} />
    </Section>

    <Section title="Build" compact={compact}>
      <Row label="Material"     value={phone.build_material}      compact={compact} />
      <Row label="Weight"       value={phone.weight_grams ? `${phone.weight_grams}g` : null} compact={compact} />
      <Row label="IP Rating"    value={phone.ip_rating}           compact={compact} />
      <Row label="Dual SIM"     value={phone.has_dual_sim}        compact={compact} />
    </Section>

    <Section title="Connectivity" compact={compact}>
      <Row label="5G"           value={phone.has_5g}              compact={compact} />
      <Row label="NFC"          value={phone.has_nfc}             compact={compact} />
    </Section>

    <Section title="Software" compact={compact}>
      <Row label="OS"           value={phone.os_version}          compact={compact} />
      <Row label="Android Updates" value={phone.android_updates_years ? `${phone.android_updates_years} years` : null} compact={compact} />
      <Row label="Security Updates" value={phone.security_updates_years ? `${phone.security_updates_years} years` : null} compact={compact} />
    </Section>

    {phone.gray_market_note && (
      <Section title="Nigerian Market" compact={compact}>
        <Row label="Gray Market Risk" value={phone.gray_market_risk}  compact={compact} />
        <Row label="Note"             value={phone.gray_market_note}  compact={compact} />
        <Row label="Local Support"    value={phone.local_support_quality} compact={compact} />
        {phone.local_support_note && (
          <Row label="Support Note"   value={phone.local_support_note} compact={compact} />
        )}
      </Section>
    )}

  </div>
)