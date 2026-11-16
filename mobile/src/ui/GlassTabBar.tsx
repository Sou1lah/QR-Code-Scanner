import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from 'expo-router/tabs'
import { AppIcon, type IconName } from './AppIcon'
import { AppText } from './AppText'
import { GlassCard } from './Glass'
import { colors, radius, space } from './theme'
import { useAppState } from '@/context/AppContext'
import { useReducedMotion } from './useReducedMotion'
import { triggerTabPressHaptic } from '@/utils/haptics'

export const TAB_BAR_HEIGHT = 68

export function useTabBarSpace(): number {
  const { bottom } = useSafeAreaInsets()
  return TAB_BAR_HEIGHT + Math.max(bottom, space.sm) + space.lg * 2
}

type TabIconConfig = {
  active: IconName
  inactive: IconName
}

type Props = BottomTabBarProps & {
  icons?: Record<string, TabIconConfig | IconName>
}

const DEFAULT_TAB_ICONS: Record<string, TabIconConfig> = {
  index: { active: 'home', inactive: 'homeOutline' },
  homepage: { active: 'home', inactive: 'homeOutline' },
  scanner: { active: 'scannerFilled', inactive: 'scanner' },
  history: { active: 'historyFilled', inactive: 'history' },
  settings: { active: 'settingsFilled', inactive: 'settings' },
}

const TAB_SPRING = {
  damping: 28,
  stiffness: 280,
  mass: 1,
  useNativeDriver: true,
}

export function GlassTabBar({ state, descriptors, emitter, navigateToTab, icons = DEFAULT_TAB_ICONS }: Props) {
  const { bottom } = useSafeAreaInsets()
  const { isDark } = useAppState()
  const reducedMotion = useReducedMotion()

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(bottom, space.sm) + space.xs }]}>
      <GlassCard
        rounded="xl"
        intensity={65}
        style={[
          styles.bar,
          isDark
            ? { backgroundColor: 'rgba(7, 12, 28, 0.84)', borderColor: 'rgba(255, 255, 255, 0.16)' }
            : { backgroundColor: 'rgba(255, 255, 255, 0.88)', borderColor: 'rgba(0, 0, 0, 0.08)' },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const focused = state.index === index
          const rawLabel = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name)
          const normalized = rawLabel.toLowerCase()
          const label = normalized === 'index' || normalized === 'homepage' ? 'Home' : rawLabel

          const iconCfg = icons[route.name] ?? DEFAULT_TAB_ICONS[route.name] ?? { active: 'home', inactive: 'homeOutline' }
          const iconName: IconName = typeof iconCfg === 'string'
            ? iconCfg
            : focused
              ? iconCfg.active
              : iconCfg.inactive

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!event.defaultPrevented) {
              void triggerTabPressHaptic()
              if (!focused) navigateToTab(route.key)
            }
          }

          const onLongPress = () => {
            emitter.emit({ type: 'tabLongPress', target: route.key })
          }

          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={label}
              iconName={iconName}
              isDark={isDark}
              reducedMotion={reducedMotion}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          )
        })}
      </GlassCard>
    </View>
  )
}

function TabItem({
  focused,
  label,
  iconName,
  isDark,
  reducedMotion,
  onPress,
  onLongPress,
}: {
  focused: boolean
  label: string
  iconName: IconName
  isDark: boolean
  reducedMotion: boolean
  onPress: () => void
  onLongPress: () => void
}) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current

  useEffect(() => {
    if (reducedMotion) {
      anim.stopAnimation()
      anim.setValue(focused ? 1 : 0)
      return
    }

    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      ...TAB_SPRING,
    }).start()
  }, [focused, anim, reducedMotion])

  const iconScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  })

  const activeOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  })

  const indicatorOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  const inactiveColor = isDark ? 'rgba(235, 240, 255, 0.45)' : 'rgba(30, 41, 59, 0.55)'
  const activeColor = colors.accent

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={6}
      style={styles.item}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activeIndicator,
          {
            opacity: indicatorOpacity,
            transform: [{ scaleX: anim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.iconWrap,
          {
            opacity: activeOpacity,
            transform: [{ scale: iconScale }],
          },
        ]}
      >
        <AppIcon
          name={iconName}
          size={23}
          color={focused ? activeColor : inactiveColor}
        />
      </Animated.View>
      <AppText
        variant="label"
        color={focused ? (isDark ? '#FFFFFF' : '#0A84FF') : inactiveColor}
        style={[styles.label, focused && styles.labelActive]}
      >
        {label}
      </AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
  },
  bar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: space.xs,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: radius.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activeIndicator: {
    width: 26,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accent,
    marginBottom: 4,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.3,
    fontWeight: '500',
    marginTop: 2,
  },
  labelActive: {
    fontWeight: '700',
  },
})
