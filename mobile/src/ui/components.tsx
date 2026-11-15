import type { PropsWithChildren, ReactNode } from 'react'
import { Pressable, StyleSheet, Switch, View, type StyleProp, type ViewStyle } from 'react-native'
import { useAppState } from '@/context/AppContext'
import { AppIcon, type IconName } from './AppIcon'
import { AppText } from './AppText'
import { GlassCard } from './Glass'
import { colors, radius, space, toneColor, withAlpha, type Tone } from './theme'

export function Chip({
  label,
  icon,
  tone = 'neutral',
  onPress,
  style,
}: {
  label: string
  icon?: IconName
  tone?: Tone
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const color = toneColor[tone]
  const content = (
    <View style={styles.chipContent}>
      {icon && <AppIcon name={icon} size={14} color={color} />}
      <AppText variant="label" color={color} style={styles.chipLabel}>
        {label}
      </AppText>
    </View>
  )
  const chipStyle = [
    styles.chip,
    { borderColor: withAlpha(color, 0.42), backgroundColor: withAlpha(color, 0.12) },
    style,
  ]

  if (!onPress) return <View style={chipStyle}>{content}</View>

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={chipStyle}>
      {content}
    </Pressable>
  )
}

export function GlassButton({
  label,
  icon,
  onPress,
  disabled = false,
  variant = 'glass',
  style,
}: {
  label: string
  icon?: IconName
  onPress?: () => void
  disabled?: boolean
  variant?: 'glass' | 'primary' | 'secondary'
  style?: StyleProp<ViewStyle>
}) {
  const { isDark } = useAppState()
  const isPrimary = variant === 'primary'
  const textColor = isPrimary ? '#FFFFFF' : isDark ? '#F2F5FF' : '#0F172A'
  const iconColor = isPrimary ? '#FFFFFF' : isDark ? colors.accent : '#0A84FF'

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        !isDark && styles.buttonLight,
        isPrimary && styles.primaryButton,
        variant === 'secondary' && (isDark ? styles.secondaryButton : styles.secondaryButtonLight),
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
        style,
      ]}
    >
      {icon && <AppIcon name={icon} size={18} color={iconColor} />}
      <AppText variant="label" color={textColor}>
        {label}
      </AppText>
    </Pressable>
  )
}

export function PermissionCard({
  title,
  message,
  actionLabel = 'Grant Camera Access',
  onAction,
  onOpenSettings,
}: {
  title: string
  message: string
  actionLabel?: string
  onAction: () => void
  onOpenSettings?: () => void
}) {
  const { isDark } = useAppState()

  return (
    <GlassCard rounded="xl" intensity={65} style={styles.permissionCard}>
      <View style={[styles.permissionIconCircle, !isDark && { backgroundColor: withAlpha(colors.accent, 0.1) }]}>
        <AppIcon name="camera" size={34} color={colors.accent} />
      </View>
      <View style={styles.permissionTextWrap}>
        <AppText variant="heading" style={[styles.permissionTitle, !isDark && { color: '#0F172A' }]}>
          {title}
        </AppText>
        <AppText
          variant="body"
          color={isDark ? colors.textMuted : 'rgba(30, 41, 59, 0.7)'}
          style={styles.permissionMessage}
        >
          {message}
        </AppText>
      </View>
      <View style={styles.permissionActions}>
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.permissionPrimaryBtn, pressed && styles.pressedButton]}
        >
          <AppIcon name="camera" size={18} color="#FFFFFF" />
          <AppText variant="label" color="#FFFFFF" style={styles.permissionBtnText}>
            {actionLabel}
          </AppText>
        </Pressable>
        {onOpenSettings && (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenSettings}
            style={({ pressed }) => [
              styles.permissionSecondaryBtn,
              !isDark && { backgroundColor: 'rgba(0,0,0,0.06)', borderColor: 'rgba(0,0,0,0.12)' },
              pressed && styles.pressedButton,
            ]}
          >
            <AppIcon name="settings" size={16} color={colors.accent} />
            <AppText variant="label" color={colors.accent} style={styles.permissionBtnText}>
              Open Phone Settings
            </AppText>
          </Pressable>
        )}
      </View>
    </GlassCard>
  )
}

export function ScreenHeader({
  title,
  subtitle,
  leading,
  action,
}: {
  title: string
  subtitle?: string
  leading?: ReactNode
  action?: ReactNode
}) {
  const { isDark } = useAppState()
  return (
    <View style={styles.header}>
      {leading}
      <View style={styles.headerCopy}>
        <AppText variant="title" style={!isDark ? { color: '#0F172A' } : undefined}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" color={isDark ? colors.textMuted : 'rgba(30, 41, 59, 0.7)'}>
            {subtitle}
          </AppText>
        )}
      </View>
      {action}
    </View>
  )
}

export function VerdictBadge({ verdict, size = 'default' }: { verdict: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS'; size?: 'default' | 'large' }) {
  const tone: Tone = verdict === 'SAFE' ? 'success' : verdict === 'SUSPICIOUS' ? 'warning' : 'danger'
  const icon: IconName = verdict === 'SAFE' ? 'safe' : verdict === 'SUSPICIOUS' ? 'warning' : 'danger'
  const color = toneColor[tone]
  return (
    <View
      style={[
        styles.verdictBadge,
        size === 'large' && styles.verdictBadgeLarge,
        { borderColor: withAlpha(color, 0.45), backgroundColor: withAlpha(color, 0.15) },
      ]}
    >
      <AppIcon name={icon} size={size === 'large' ? 18 : 14} color={color} />
      <AppText variant="label" color={color} style={styles.verdictText}>
        {verdict}
      </AppText>
    </View>
  )
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <GlassCard style={style}>{children}</GlassCard>
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <ScreenHeader title={title} subtitle={subtitle} action={action} />
}

export function SectionTitle({ children }: PropsWithChildren) {
  const { isDark } = useAppState()
  return (
    <AppText
      variant="label"
      color={isDark ? colors.accent : colors.accent}
      style={styles.sectionTitle}
    >
      {children}
    </AppText>
  )
}

export function ActionButton({
  title,
  icon,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string
  icon?: IconName
  onPress: () => void
  disabled?: boolean
  secondary?: boolean
}) {
  return (
    <GlassButton label={title} icon={icon} onPress={onPress} disabled={disabled} variant={secondary ? 'secondary' : 'primary'} />
  )
}

export function ToggleRow({
  label,
  description,
  icon,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string
  description: string
  icon?: IconName
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}) {
  const { isDark } = useAppState()
  return (
    <View style={[styles.toggleRow, !isDark && { borderBottomColor: 'rgba(0,0,0,0.08)' }]}>
      {icon && (
        <View style={styles.toggleIconWrap}>
          <AppIcon name={icon} size={20} color={colors.accent} />
        </View>
      )}
      <View style={styles.toggleCopy}>
        <AppText variant="body" style={[styles.toggleLabel, !isDark && { color: '#0F172A' }]}>
          {label}
        </AppText>
        <AppText variant="caption" color={isDark ? colors.textMuted : 'rgba(30, 41, 59, 0.65)'}>
          {description}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: isDark ? '#414653' : '#CBD5E1', true: '#1677D2' }}
        thumbColor={value ? '#FFFFFF' : isDark ? '#E5E7EB' : '#FFFFFF'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipLabel: { textAlign: 'center' },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  verdictBadgeLarge: {
    paddingHorizontal: space.lg,
    paddingVertical: 8,
    gap: 8,
  },
  verdictText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
  },
  buttonLight: {
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButton: { borderColor: colors.accent, backgroundColor: colors.accent },
  secondaryButton: { backgroundColor: colors.glassFallback },
  secondaryButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  disabledButton: { opacity: 0.45 },
  pressedButton: { opacity: 0.78 },
  permissionCard: {
    width: '100%',
    gap: space.md,
    padding: space.xl,
    alignItems: 'center',
    borderRadius: 28,
  },
  permissionIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.accent, 0.16),
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.35),
    marginBottom: 4,
  },
  permissionTextWrap: {
    alignItems: 'center',
    gap: 6,
  },
  permissionTitle: {
    textAlign: 'center',
    fontWeight: '700',
  },
  permissionMessage: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  permissionActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  permissionPrimaryBtn: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  permissionSecondaryBtn: {
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  permissionBtnText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.sm,
  },
  headerCopy: { flex: 1, gap: space.xs },
  sectionTitle: { marginBottom: space.sm },
  toggleRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toggleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.accent, 0.12),
  },
  toggleCopy: { flex: 1, gap: 3 },
  toggleLabel: { fontWeight: '600' },
})
