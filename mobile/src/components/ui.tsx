import { SafeAreaView } from 'react-native-safe-area-context'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import type { PropsWithChildren, ReactNode } from 'react'

export const colors = {
  background: '#080B12',
  surface: '#121722',
  border: '#252B37',
  text: '#F6F7F9',
  muted: '#9299A8',
  accent: '#0A84FF',
  safe: '#34C759',
  warning: '#FFB340',
  danger: '#FF453A',
}

export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.screen}>{children}</SafeAreaView>
}

export function ActionButton({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  secondary?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
    </Pressable>
  )
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string
  description: string
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#414653', true: '#1677D2' }}
        thumbColor={value ? '#FFFFFF' : '#E5E7EB'}
      />
    </View>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderCopy}>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.pageSubtitle}>{subtitle}</Text>
      </View>
      {action}
    </View>
  )
}

export function VerdictBadge({ verdict }: { verdict: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' }) {
  const tone = verdict === 'SAFE' ? colors.safe : verdict === 'SUSPICIOUS' ? colors.warning : colors.danger
  return (
    <View style={[styles.badge, { borderColor: `${tone}55`, backgroundColor: `${tone}18` }]}>
      <Text style={[styles.badgeText, { color: tone }]}>{verdict}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  button: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressedButton: {
    opacity: 0.78,
  },
  sectionTitle: {
    marginBottom: 9,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  toggleRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toggleCopy: {
    flex: 1,
    gap: 3,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleDescription: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 22,
  },
  pageHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
})
