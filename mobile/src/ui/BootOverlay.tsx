import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated'
import Svg, { Rect } from 'react-native-svg'
import * as SplashScreen from 'expo-splash-screen'
import { useReducedMotion } from './useReducedMotion'
import { colors } from './theme'
import { useAppState } from '@/context/AppContext'

interface Props {
  renderStartMs?: number
}

const MIN_VISIBLE_MS = 950
const HARD_CAP_MS = 1400
const FADE_OUT_MS = 260

export function BootOverlay({ renderStartMs }: Props) {
  const { isDark, ready } = useAppState()
  const reducedMotion = useReducedMotion()
  const accent = colors.accent

  const [mounted, setMounted] = useState(true)
  const [statusText, setStatusText] = useState('Starting camera…')
  const splashHidden = useRef(false)
  const fadeOutTriggered = useRef(false)
  const mountTimeRef = useRef(Date.now())

  // Finder squares spring scale (0.4 to 1)
  const finderScale1 = useSharedValue(reducedMotion ? 1 : 0.4)
  const finderScale2 = useSharedValue(reducedMotion ? 1 : 0.4)
  const finderScale3 = useSharedValue(reducedMotion ? 1 : 0.4)

  // Four small data dots (staggered from 240 to 390 ms, 50 ms apart)
  const dot1Opacity = useSharedValue(reducedMotion ? 1 : 0)
  const dot2Opacity = useSharedValue(reducedMotion ? 1 : 0)
  const dot3Opacity = useSharedValue(reducedMotion ? 1 : 0)
  const dot4Opacity = useSharedValue(reducedMotion ? 1 : 0)

  // Scan beam (3 px line + glow sweeping top to bottom of card, 480 ms starting at 360 ms)
  const beamY = useSharedValue(-10)
  const beamOpacity = useSharedValue(0)

  // Overlay fade out
  const overlayOpacity = useSharedValue(1)
  const overlayScale = useSharedValue(1)

  const springConfig = { damping: 13, stiffness: 240 }

  const finderStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: finderScale1.value }],
  }))
  const finderStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: finderScale2.value }],
  }))
  const finderStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: finderScale3.value }],
  }))

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }))
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }))
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }))
  const dot4Style = useAnimatedStyle(() => ({ opacity: dot4Opacity.value }))

  const beamStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: beamY.value }],
    opacity: beamOpacity.value,
  }))

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }))

  const triggerFadeOut = () => {
    if (fadeOutTriggered.current) return
    fadeOutTriggered.current = true
    overlayOpacity.value = withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
      if (finished) runOnJS(setMounted)(false)
    })
    overlayScale.value = withTiming(1.04, { duration: FADE_OUT_MS })
  }

  // 1. Hide native splash screen once boot overlay mounts
  useEffect(() => {
    if (!splashHidden.current) {
      splashHidden.current = true
      void SplashScreen.hideAsync().catch((error: unknown) => {
        console.warn('Unable to hide native splash screen.', error)
      })
    }
  }, [])

  // 2. Drive animations
  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(() => {
        triggerFadeOut()
      }, 300)
      return () => clearTimeout(timer)
    }

    // Status line sequence ("Starting camera…" -> "Preparing scanner…" at 350 ms)
    const statusTimer = setTimeout(() => {
      setStatusText('Preparing scanner…')
    }, 350)

    // Three finder squares pop in staggered at 30, 90, 160 ms
    finderScale1.value = withDelay(30, withSpring(1, springConfig))
    finderScale2.value = withDelay(90, withSpring(1, springConfig))
    finderScale3.value = withDelay(160, withSpring(1, springConfig))

    // Four small data dots staggered at 240, 290, 340, 390 ms (50 ms apart)
    dot1Opacity.value = withDelay(240, withTiming(1, { duration: 80 }))
    dot2Opacity.value = withDelay(290, withTiming(1, { duration: 80 }))
    dot3Opacity.value = withDelay(340, withTiming(1, { duration: 80 }))
    dot4Opacity.value = withDelay(390, withTiming(1, { duration: 80 }))

    // One scan beam sweeping top to bottom once (480 ms, starting at 360 ms)
    const beamTimer = setTimeout(() => {
      beamOpacity.value = withTiming(1, { duration: 60 })
      beamY.value = withTiming(142, { duration: 480, easing: Easing.inOut(Easing.quad) }, () => {
        beamOpacity.value = withTiming(0, { duration: 80 })
      })
    }, 360)

    // Hard cap at 1.4 s
    const capTimer = setTimeout(() => {
      triggerFadeOut()
    }, HARD_CAP_MS)

    return () => {
      clearTimeout(statusTimer)
      clearTimeout(beamTimer)
      clearTimeout(capTimer)
      cancelAnimation(finderScale1)
      cancelAnimation(finderScale2)
      cancelAnimation(finderScale3)
      cancelAnimation(dot1Opacity)
      cancelAnimation(dot2Opacity)
      cancelAnimation(dot3Opacity)
      cancelAnimation(dot4Opacity)
      cancelAnimation(beamY)
      cancelAnimation(beamOpacity)
      cancelAnimation(overlayOpacity)
      cancelAnimation(overlayScale)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  // 3. React to loading completion (AppContext ready)
  useEffect(() => {
    if (reducedMotion) return
    if (!ready) return

    const elapsed = Date.now() - mountTimeRef.current
    if (elapsed >= MIN_VISIBLE_MS) {
      triggerFadeOut()
    } else {
      const remaining = MIN_VISIBLE_MS - elapsed
      const timer = setTimeout(() => {
        triggerFadeOut()
      }, remaining)
      return () => clearTimeout(timer)
    }
  }, [ready, reducedMotion])

  if (!mounted) return null

  const bgColor = isDark ? '#070b14' : '#f3f6fc'
  const cardBg = isDark ? '#0e182a' : '#ffffff'
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
  const mutedColor = isDark ? 'rgba(235, 240, 255, 0.55)' : 'rgba(71, 85, 105, 0.75)'

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { backgroundColor: bgColor }, overlayStyle]}
    >
      {/* 132 px rounded square QR card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.canvas}>
          {/* Top-left finder square */}
          <Animated.View style={[styles.finderBase, { top: 8, left: 8 }, finderStyle1]}>
            <Svg width={28} height={28} viewBox="0 0 28 28">
              <Rect x={0} y={0} width={28} height={28} rx={6} fill="none" stroke={accent} strokeWidth={3} />
              <Rect x={6} y={6} width={16} height={16} rx={3} fill={accent} />
            </Svg>
          </Animated.View>

          {/* Top-right finder square */}
          <Animated.View style={[styles.finderBase, { top: 8, left: 60 }, finderStyle2]}>
            <Svg width={28} height={28} viewBox="0 0 28 28">
              <Rect x={0} y={0} width={28} height={28} rx={6} fill="none" stroke={accent} strokeWidth={3} />
              <Rect x={6} y={6} width={16} height={16} rx={3} fill={accent} />
            </Svg>
          </Animated.View>

          {/* Bottom-left finder square */}
          <Animated.View style={[styles.finderBase, { top: 60, left: 8 }, finderStyle3]}>
            <Svg width={28} height={28} viewBox="0 0 28 28">
              <Rect x={0} y={0} width={28} height={28} rx={6} fill="none" stroke={accent} strokeWidth={3} />
              <Rect x={6} y={6} width={16} height={16} rx={3} fill={accent} />
            </Svg>
          </Animated.View>

          {/* Four small data dots (bottom-right cluster) */}
          <Animated.View style={[styles.dataDot, { top: 60, left: 60 }, dot1Style]}>
            <Svg width={9} height={9} viewBox="0 0 9 9">
              <Rect x={0} y={0} width={9} height={9} rx={2} fill={accent} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.dataDot, { top: 60, left: 73 }, dot2Style]}>
            <Svg width={9} height={9} viewBox="0 0 9 9">
              <Rect x={0} y={0} width={9} height={9} rx={2} fill={accent} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.dataDot, { top: 73, left: 60 }, dot3Style]}>
            <Svg width={9} height={9} viewBox="0 0 9 9">
              <Rect x={0} y={0} width={9} height={9} rx={2} fill={accent} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.dataDot, { top: 73, left: 73 }, dot4Style]}>
            <Svg width={9} height={9} viewBox="0 0 9 9">
              <Rect x={0} y={0} width={9} height={9} rx={2} fill={accent} />
            </Svg>
          </Animated.View>
        </View>

        {/* Scan beam sweeping top to bottom over the card */}
        {!reducedMotion && (
          <Animated.View pointerEvents="none" style={[styles.beamWrap, beamStyle]}>
            <View style={[styles.beamGlow, { backgroundColor: accent }]} />
            <View style={[styles.beam, { backgroundColor: accent }]} />
          </Animated.View>
        )}
      </View>

      {/* App name and status */}
      <Text style={[styles.appName, { color: accent }]}>AMANE DZ</Text>
      <Text style={[styles.statusText, { color: mutedColor }]}>{statusText}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 132,
    height: 132,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  canvas: {
    width: 96,
    height: 96,
    position: 'relative',
  },
  finderBase: {
    position: 'absolute',
    width: 28,
    height: 28,
  },
  dataDot: {
    position: 'absolute',
    width: 9,
    height: 9,
  },
  beamWrap: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 14,
    justifyContent: 'center',
  },
  beam: {
    width: '100%',
    height: 3,
    borderRadius: 2,
  },
  beamGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    borderRadius: 6,
    opacity: 0.35,
  },
  appName: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  statusText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
})
