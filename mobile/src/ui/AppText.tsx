import { StyleSheet, Text, type TextProps } from 'react-native'
import { colors, font } from './theme'
import { useAppState } from '@/context/AppContext'

type TextVariant = keyof typeof font
type Props = TextProps & { variant?: TextVariant; color?: string }

export function AppText({ variant = 'body', color, style, ...props }: Props) {
  let isDark = true
  try {
    const state = useAppState()
    isDark = state.isDark
  } catch {
    // Fallback if rendered outside provider
  }

  let resolvedColor = color
  if (!resolvedColor || resolvedColor === colors.text) {
    resolvedColor = isDark ? '#F2F5FF' : '#0F172A'
  } else if (resolvedColor === colors.textMuted || resolvedColor === colors.muted) {
    resolvedColor = isDark ? 'rgba(235, 240, 255, 0.65)' : 'rgba(71, 85, 105, 0.88)'
  }

  return <Text {...props} style={[styles[variant], { color: resolvedColor }, style]} />
}

const styles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: '800' },
  heading: { fontSize: font.heading, fontWeight: '700' },
  body: { fontSize: font.body, lineHeight: 22 },
  caption: { fontSize: font.caption, lineHeight: 18 },
  label: { fontSize: font.label, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
})
