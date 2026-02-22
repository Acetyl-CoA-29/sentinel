// SENTINEL Design System — Apple-inspired dark theme
// Single source of truth for all colors, typography, spacing, and motion.
// Import { theme, alpha } in every component. No hardcoded colors.

export const theme = {
  // Colors — almost monochrome with one accent
  colors: {
    bg: '#000000',
    surface: '#1C1C1E',
    surfaceHover: '#2C2C2E',
    surfaceActive: '#3A3A3C',
    text: '#F5F5F7',
    textSecondary: '#86868B',
    textTertiary: '#6E6E73',
    accent: '#0A84FF',
    accentGreen: '#30D158',
    accentRed: '#FF453A',
    accentOrange: '#FF9F0A',
    border: 'rgba(255,255,255,0.08)',
  },

  // Agent pipeline colors
  agents: {
    intake:        { color: '#0A84FF', label: 'INTAKE' },
    analyst:       { color: '#FF9F0A', label: 'ANALYST' },
    research:      { color: '#BF5AF2', label: 'RESEARCH' },
    response:      { color: '#30D158', label: 'RESPONSE' },
    accessibility: { color: '#64D2FF', label: 'ACCESS' },
  },

  // Severity / threat level colors (pre-computed bg/text/border triplets)
  severity: {
    critical: { bg: 'rgba(255,69,58,0.15)', text: '#FF453A', border: 'rgba(255,69,58,0.3)' },
    alert:    { bg: 'rgba(255,69,58,0.12)', text: '#FF453A', border: 'rgba(255,69,58,0.25)' },
    warning:  { bg: 'rgba(255,159,10,0.15)', text: '#FF9F0A', border: 'rgba(255,159,10,0.3)' },
    moderate: { bg: 'rgba(255,159,10,0.10)', text: '#FF9F0A', border: 'rgba(255,159,10,0.25)' },
    low:      { bg: 'rgba(48,209,88,0.10)', text: '#30D158', border: 'rgba(48,209,88,0.3)' },
    clear:    { bg: 'rgba(48,209,88,0.10)', text: '#30D158', border: 'rgba(48,209,88,0.3)' },
  },

  // Map marker colors (Leaflet requires raw hex strings)
  markers: {
    gi: '#FF453A',
    respiratory: '#0A84FF',
    other: '#6E6E73',
    clusterCritical: '#FF453A',
    clusterWarning: '#FF9F0A',
  },

  // Typography — system font stack, Apple sizing
  font: {
    family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    hero:    { size: '56px', weight: 700, letterSpacing: '-0.03em', lineHeight: 1.07 },
    h1:      { size: '40px', weight: 700, letterSpacing: '-0.025em', lineHeight: 1.1 },
    h2:      { size: '28px', weight: 600, letterSpacing: '-0.02em', lineHeight: 1.14 },
    h3:      { size: '21px', weight: 600, letterSpacing: '-0.01em', lineHeight: 1.19 },
    body:    { size: '17px', weight: 400, letterSpacing: '-0.01em', lineHeight: 1.47 },
    caption: { size: '14px', weight: 400, letterSpacing: '0', lineHeight: 1.43 },
    mono:    { size: '13px', weight: 500, family: '"SF Mono", "Fira Code", monospace' },
  },

  // Spacing — generous, lots of air
  space: {
    xs: '8px',
    sm: '12px',
    md: '20px',
    lg: '32px',
    xl: '48px',
    xxl: '80px',
  },

  // Radii — medium-large
  radius: {
    sm: '10px',
    md: '14px',
    lg: '20px',
    xl: '28px',
  },

  // Shadows — subtle, layered
  shadow: {
    card: '0 2px 12px rgba(0,0,0,0.4)',
    cardHover: '0 8px 24px rgba(0,0,0,0.6)',
    elevated: '0 8px 30px rgba(0,0,0,0.5)',
    glow: (color) => `0 0 20px ${color}33, 0 0 60px ${color}11`,
  },

  // Frosted glass effect (header, overlays)
  glass: {
    background: 'rgba(0,0,0,0.72)',
    backdropFilter: 'saturate(180%) blur(20px)',
    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  },

  // Animations — medium-slow, ease-out curves
  motion: {
    fast: '150ms ease-out',
    medium: '300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    slow: '500ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
}

// Utility: create rgba from any hex color + opacity (0-1)
export function alpha(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${opacity})`
}
