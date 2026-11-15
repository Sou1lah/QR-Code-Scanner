import { createContext, memo, useContext, useMemo, useRef, type ComponentRef, type ReactNode, type RefObject } from 'react'
import { Image, Platform, StyleSheet, View, type ViewProps } from 'react-native'
import { BlurView, BlurTargetView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { images } from './assets'
import { glassSheen, radius, resolveGlassQuality, toneColor, withAlpha, type Tone } from './theme'
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

export type GlassCardProps = ViewProps & {
  intensity?: number
  tone?: Tone
  rounded?: keyof typeof radius
}

function GlassCardBase({ intensity = 45, tone, rounded = 'lg', style, children, ...rest }: GlassCardProps) {
  const target = useContext(TargetContext)
  const { isDark } = useAppState()
  const quality = useMemo(() => resolveGlassQuality(), [])
  const tint = tone ? toneColor[tone] : null

  const surface = [
    styles.card,
    { borderRadius: radius[rounded] },
    !isDark && styles.cardLight,
    tint && { borderColor: withAlpha(tint, 0.45), backgroundColor: withAlpha(tint, isDark ? 0.1 : 0.16) },
    style,
  ]

  const specularHighlight = (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* 1px top refraction rim highlight */}
      <LinearGradient
        colors={isDark ? glassSheen.dark.highlight : glassSheen.light.highlight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.specularTopRim}
      />
      {/* Faint diagonal sheen */}
      <LinearGradient
        colors={isDark ? glassSheen.dark.sheen : glassSheen.light.sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  )

  // Reduced quality mode (Android < 31 or missing blur target on Android)
  if (quality === 'reduced' || (Platform.OS === 'android' && !target)) {
    return (
      <View
        {...rest}
        style={[
          surface,
          { backgroundColor: isDark ? glassSheen.dark.fallback : glassSheen.light.fallback },
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']
              : ['rgba(255, 255, 255, 0.92)', 'rgba(255, 255, 255, 0.78)']
          }
          style={StyleSheet.absoluteFill}
        />
        {specularHighlight}
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
      {specularHighlight}
      {children}
    </BlurView>
  )
}

export const GlassCard = memo(GlassCardBase)

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
    borderColor: glassSheen.dark.border,
    backgroundColor: glassSheen.dark.fill,
    position: 'relative',
  },
  cardLight: {
    borderColor: glassSheen.light.border,
    backgroundColor: glassSheen.light.fill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  specularTopRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
})
