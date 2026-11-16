import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppProvider, useAppState } from '@/context/AppContext'
import { BootOverlay, GlassRoot } from '@/ui'

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.warn('Unable to keep the native splash screen visible.', error)
})

function AppNavigation() {
  const { isDark } = useAppState()

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}

function ThemedRoot() {
  const { isDark } = useAppState()
  const renderStart = useRef(Date.now())
  const theme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: 'transparent' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } }

  return (
    <ThemeProvider value={theme}>
      <View style={styles.appContainer}>
        <GlassRoot isDark={isDark}>
          <AppNavigation />
        </GlassRoot>
        <BootOverlay renderStartMs={renderStart.current} />
      </View>
    </ThemeProvider>
  )
}

export default function RootLayout() {
  return (
    <AppProvider>
      <ThemedRoot />
    </AppProvider>
  )
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    position: 'relative',
  },
})
