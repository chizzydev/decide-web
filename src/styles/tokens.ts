// decide-web/src/styles/tokens.ts
// Single source of truth for all design decisions.
// Every component imports from here — no hardcoded values anywhere else.
// tailwind.config.ts extends the Tailwind theme using these tokens.
//
// PALETTE SYSTEM — White + Navy + Teal
// ─────────────────────────────────────
// White / off-white / teal-tint → surfaces
// Navy (3 levels)               → text, dark surfaces, deep sections
// Teal (4-step scale)           → interaction only (buttons, focus, active, score)
// Slate (3 levels)              → neutral text, labels, borders
// No yellow. No amber. No purple.

export const tokens = {

  // ── COLOR ──────────────────────────────────────────────────

  color: {
    // ── Surfaces ──────────────────────────────────────────
    bg:           '#f8fafc',   // Off-white page background
    surface:      '#ffffff',   // Cards, panels, modals
    surfaceHigh:  '#f1f5f9',   // Elevated elements, hover tints, input bg
    tealTint:     '#f0fdfa',   // Hero, recommendation blocks, filter panels

    // ── Borders (dual strength) ───────────────────────────
    border:       '#e2e8f0',   // Default — soft
    borderHigh:   '#cbd5e1',   // Hover, interactive cards, strong dividers

    // ── Text ──────────────────────────────────────────────
    textPrimary:   '#0f172a',  // Navy-800 — headlines, primary body
    textSecondary: '#334155',  // Slate-700 — subtext, labels
    textMuted:     '#64748b',  // Slate-500 - placeholders, disabled, fine labels

    // ── Teal accent scale ─────────────────────────────────
    // Teal appears ONLY on interactive elements:
    // primary buttons, focus rings, active nav, selection states,
    // score indicators, featured card accents.
    // Never on decorative tags, generic text, or backgrounds
    // (except the dedicated tealTint surface above).
    teal300:       '#5eead4',  // Glow, highlight on dark surfaces
    teal400:       '#0d9488',  // Hover states
    teal500:       '#0f766e',  // Primary action buttons
    teal600:       '#0f766e',  // Brand - icons, rings, borders, wordmark

    // Semantic accent aliases
    accent:        '#0f766e',  // teal500 - primary CTA and small accent text
    accentHover:   '#0d9488',  // teal400 - hover
    accentSubtle:  '#f0fdfa',  // → tealTint — muted accent bg
    accentBrand:   '#0d9488',  // → teal600 — brand identity

    // ── Navy foundation (3 levels) ────────────────────────
    navy900:       '#020617',  // Deepest — CTA banners, modals on dark
    navy800:       '#0f172a',  // Main text, primary dark surfaces
    navy700:       '#1e293b',  // Secondary panels, footer

    // ── Neutral slate (3 levels) ──────────────────────────
    slate700:      '#334155',  // Secondary text
    slate500:      '#475569',  // Muted labels, secondary nav
    slate400:      '#64748b',  // Fine labels on light surfaces

    // ── Semantic — status communication only ──────────────
    success:        '#16a34a',
    successSubtle:  '#f0fdf4',
    warning:        '#d97706',
    warningSubtle:  '#fffbeb',
    error:          '#dc2626',
    errorSubtle:    '#fef2f2',

    // ── Absolute ──────────────────────────────────────────
    white: '#ffffff',
    black: '#000000',
  },

  // ── TYPOGRAPHY ─────────────────────────────────────────────

  font: {
    ui:      'var(--font-geist)',
    display: 'var(--font-freight-display)',
  },

  fontSize: {
    xs:    '0.75rem',
    sm:    '0.875rem',
    base:  '1rem',
    lg:    '1.125rem',
    xl:    '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },

  fontWeight: {
    light:    '300',
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    black:    '900',
  },

  lineHeight: {
    tight:   '1.1',
    snug:    '1.3',
    normal:  '1.5',
    relaxed: '1.7',
  },

  letterSpacing: {
    tight:  '-0.03em',
    normal: '0em',
    wide:   '0.06em',
    wider:  '0.12em',
  },

  // ── SPACING ────────────────────────────────────────────────

  space: {
    1:  '0.25rem',
    2:  '0.5rem',
    3:  '0.75rem',
    4:  '1rem',
    5:  '1.25rem',
    6:  '1.5rem',
    8:  '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },

  // ── BORDER RADIUS ──────────────────────────────────────────

  radius: {
    none: '0px',
    sm:   '4px',
    md:   '8px',
    lg:   '12px',
    xl:   '16px',
    full: '9999px',
  },

  // ── SHADOWS ────────────────────────────────────────────────

  shadow: {
    sm:     '0 1px 4px rgba(15,23,42,0.06)',
    md:     '0 4px 16px rgba(15,23,42,0.08)',
    lg:     '0 12px 40px rgba(15,23,42,0.12)',
    accent: '0 4px 14px rgba(20,184,166,0.25)', // Teal button glow
    card:   '0 2px 8px rgba(15,23,42,0.06)',
  },

  // ── MOTION ─────────────────────────────────────────────────

  transition: {
    fast:   '150ms ease',
    normal: '200ms ease',
    slow:   '350ms ease',
  },

  // ── BREAKPOINTS ────────────────────────────────────────────

  breakpoint: {
    sm:  '640px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
  },

  // ── Z-INDEX ────────────────────────────────────────────────

  zIndex: {
    base:     0,
    raised:   10,
    dropdown: 100,
    sticky:   200,
    modal:    300,
    toast:    400,
  },

} as const

export type Tokens = typeof tokens
