export const colors = {
  bg: '#02030F',
  background: '#02030F',
  text: '#F2F5FF',
  textMuted: 'rgba(235,240,255,0.62)',
  muted: 'rgba(235,240,255,0.62)',
  accent: '#0A84FF',
  success: '#30D158',
  safe: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  neutral: '#9AA4BF',
  surface: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.18)',
  glassFill: 'rgba(255,255,255,0.06)',
  glassFallback: 'rgba(12,18,44,0.78)',
  glassBorder: 'rgba(255,255,255,0.18)',
} as const

export function getThemeColors(isDark: boolean) {
  return {
    ...colors,
    bg: isDark ? '#02030F' : '#F0F4FC',
    background: isDark ? '#02030F' : '#F0F4FC',
    text: isDark ? '#F2F5FF' : '#0F172A',
    textMuted: isDark ? 'rgba(235,240,255,0.62)' : 'rgba(71,85,105,0.85)',
    muted: isDark ? 'rgba(235,240,255,0.62)' : 'rgba(71,85,105,0.85)',
    surface: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.82)',
    border: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
    glassFill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
    glassFallback: isDark ? 'rgba(12,18,44,0.78)' : 'rgba(255,255,255,0.92)',
    glassBorder: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
  }
}

export const radius = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 } as const
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const
export const font = { title: 24, heading: 18, body: 15, caption: 12, label: 11 } as const

export type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

export const toneColor: Record<Tone, string> = {
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  neutral: colors.neutral,
}

export function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`
}
