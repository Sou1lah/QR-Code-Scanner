import { createContext, useContext, useRef, type ComponentRef, type ReactNode, type RefObject } from 'react'
import { Image, Platform, StyleSheet, View, type ViewProps } from 'react-native'
import { BlurView, BlurTargetView } from 'expo-blur'
import { images } from './assets'
import { colors, radius, toneColor, withAlpha, type Tone } from './theme'
import { useAppState } from '@/context/AppContext'

type BlurTarget = ComponentRef<typeof View>

const TargetContext = createContext<RefObject<BlurTarget | null> | null>(null)

export function GlassRoot({ children, isDark = true }: { children: ReactNode; isDark?: boolean }) {
  const targetRef = useRef<BlurTarget | null>(null)

  return (
    <TargetContext.Provider value={targetRef}>
      <View style={[styles.root, !isDark && styles.rootLight]}>
        <BlurTargetView ref={targetRef} style={StyleSheet.absoluteFill}>
          <Image
            source={images.background}
            style={[StyleSheet.absoluteFill, !isDark && { opacity: 0.35 }]}
            resizeMode="cover"
          />
          {!isDark && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(240, 244, 255, 0.72)' }]}
            />
          )}
        </BlurTargetView>
        {children}
      </View>
    </TargetContext.Provider>
  )
}

type GlassCardProps = ViewProps & {
  intensity?: number
  tone?: Tone
  rounded?: keyof typeof radius
}

export function GlassCard({ intensity = 45, tone, rounded = 'lg', style, children, ...rest }: GlassCardProps) {
  const target = useContext(TargetContext)
  const { isDark } = useAppState()
  const tint = tone ? toneColor[tone] : null
  const surface = [
    styles.card,
    { borderRadius: radius[rounded] },
    !isDark && styles.cardLight,
    tint && { borderColor: withAlpha(tint, 0.45), backgroundColor: withAlpha(tint, isDark ? 0.1 : 0.16) },
    style,
  ]

  if (Platform.OS === 'android' && !target) {
    return (
      <View
        {...rest}
        style={[
          surface,
          { backgroundColor: isDark ? colors.glassFallback : 'rgba(255, 255, 255, 0.88)' },
        ]}
      >
        {children}
      </View>
    )
  }

  return (
    <BlurView
      {...rest}
      blurTarget={target ?? undefined}
      blurMethod="dimezisBlurViewSdk31Plus"
      tint={isDark ? 'dark' : 'light'}
      intensity={intensity}
      style={surface}
    >
      {children}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#02030F',
  },
  rootLight: {
    backgroundColor: '#F0F4FC',
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardLight: {
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
})
