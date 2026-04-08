// decide-web/tailwind.config.ts
// Extends Tailwind's default theme with our design tokens.
// Every custom utility class used in components derives from here.
// No hardcoded values in className strings anywhere in the codebase.

import type { Config } from 'tailwindcss'
import { tokens } from './src/styles/tokens'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/hooks/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {

      // ── KEYFRAMES & ANIMATION ────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 120ms ease forwards',
        'slide-up': 'slide-up 180ms ease forwards',
      },

      // ── COLORS ───────────────────────────────────────────
      colors: {
        // ── Surfaces ──────────────────────────────────────
        bg:          tokens.color.bg,
        surface:     tokens.color.surface,
        surfaceHigh: tokens.color.surfaceHigh,
        tealTint:    tokens.color.tealTint,

        // ── Borders ───────────────────────────────────────
        border:      tokens.color.border,
        borderHigh:  tokens.color.borderHigh,

        // ── Text ──────────────────────────────────────────
        text: {
          primary:   tokens.color.textPrimary,
          secondary: tokens.color.textSecondary,
          muted:     tokens.color.textMuted,
        },

        // ── Teal scale ────────────────────────────────────
        // Use these for interactive elements only.
        teal: {
          300: tokens.color.teal300,
          400: tokens.color.teal400,
          500: tokens.color.teal500,
          600: tokens.color.teal600,
        },

        // ── Semantic accent aliases ────────────────────────
        // Components should use these, not raw teal values.
        // accent         → primary CTA, active states
        // accent-hover   → hover state
        // accent-subtle  → muted bg (tealTint)
        // accent-brand   → brand identity (wordmark, icons, rings)
        accent: {
          DEFAULT: tokens.color.accent,
          hover:   tokens.color.accentHover,
          subtle:  tokens.color.accentSubtle,
          brand:   tokens.color.accentBrand,
        },

        // ── Navy foundation ───────────────────────────────
        navy: {
          900: tokens.color.navy900,
          800: tokens.color.navy800,
          700: tokens.color.navy700,
        },

        // ── Neutral slate ─────────────────────────────────
        slate: {
          700: tokens.color.slate700,
          500: tokens.color.slate500,
          400: tokens.color.slate400,
        },

        // ── Semantic status ───────────────────────────────
        success: {
          DEFAULT: tokens.color.success,
          subtle:  tokens.color.successSubtle,
        },
        warning: {
          DEFAULT: tokens.color.warning,
          subtle:  tokens.color.warningSubtle,
        },
        error: {
          DEFAULT: tokens.color.error,
          subtle:  tokens.color.errorSubtle,
        },
      },

      // ── TYPOGRAPHY ───────────────────────────────────────
      fontFamily: {
        ui:      [tokens.font.ui,      'sans-serif'],
        display: [tokens.font.display, 'serif'],
      },

      fontSize: {
        xs:    [tokens.fontSize.xs,    { lineHeight: tokens.lineHeight.normal }],
        sm:    [tokens.fontSize.sm,    { lineHeight: tokens.lineHeight.normal }],
        base:  [tokens.fontSize.base,  { lineHeight: tokens.lineHeight.normal }],
        lg:    [tokens.fontSize.lg,    { lineHeight: tokens.lineHeight.snug }],
        xl:    [tokens.fontSize.xl,    { lineHeight: tokens.lineHeight.snug }],
        '2xl': [tokens.fontSize['2xl'],{ lineHeight: tokens.lineHeight.snug }],
        '3xl': [tokens.fontSize['3xl'],{ lineHeight: tokens.lineHeight.tight }],
        '4xl': [tokens.fontSize['4xl'],{ lineHeight: tokens.lineHeight.tight }],
        '5xl': [tokens.fontSize['5xl'],{ lineHeight: tokens.lineHeight.tight }],
        '6xl': [tokens.fontSize['6xl'],{ lineHeight: tokens.lineHeight.tight }],
      },

      fontWeight: {
        light:    tokens.fontWeight.light,
        regular:  tokens.fontWeight.regular,
        medium:   tokens.fontWeight.medium,
        semibold: tokens.fontWeight.semibold,
        bold:     tokens.fontWeight.bold,
        black:    tokens.fontWeight.black,
      },

      letterSpacing: {
        tight:  tokens.letterSpacing.tight,
        normal: tokens.letterSpacing.normal,
        wide:   tokens.letterSpacing.wide,
        wider:  tokens.letterSpacing.wider,
      },

      // ── SPACING ──────────────────────────────────────────
      spacing: {
        1:  tokens.space[1],
        2:  tokens.space[2],
        3:  tokens.space[3],
        4:  tokens.space[4],
        5:  tokens.space[5],
        6:  tokens.space[6],
        8:  tokens.space[8],
        10: tokens.space[10],
        12: tokens.space[12],
        16: tokens.space[16],
        20: tokens.space[20],
        24: tokens.space[24],
        32: tokens.space[32],
      },

      // ── BORDER RADIUS ────────────────────────────────────
      borderRadius: {
        none: tokens.radius.none,
        sm:   tokens.radius.sm,
        md:   tokens.radius.md,
        lg:   tokens.radius.lg,
        xl:   tokens.radius.xl,
        full: tokens.radius.full,
      },

      // ── SHADOWS ──────────────────────────────────────────
      boxShadow: {
        sm:     tokens.shadow.sm,
        md:     tokens.shadow.md,
        lg:     tokens.shadow.lg,
        accent: tokens.shadow.accent,
        card:   tokens.shadow.card,
      },

      // ── TRANSITION DURATION ──────────────────────────────
      transitionDuration: {
        fast:   '150',
        normal: '200',
        slow:   '350',
      },

      // ── BREAKPOINTS ──────────────────────────────────────
      screens: {
        sm: tokens.breakpoint.sm,
        md: tokens.breakpoint.md,
        lg: tokens.breakpoint.lg,
        xl: tokens.breakpoint.xl,
      },

      // ── Z-INDEX ──────────────────────────────────────────
      zIndex: {
        base:     String(tokens.zIndex.base),
        raised:   String(tokens.zIndex.raised),
        dropdown: String(tokens.zIndex.dropdown),
        sticky:   String(tokens.zIndex.sticky),
        modal:    String(tokens.zIndex.modal),
        toast:    String(tokens.zIndex.toast),
        tooltip:  '150',
      },
    },
  },

  plugins: [],
}

export default config