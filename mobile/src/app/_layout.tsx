import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AppProvider, useAppState } from '@/context/AppContext'
import { GlassRoot } from '@/ui'

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
  const theme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: 'transparent' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } }

  return (
    <ThemeProvider value={theme}>
      <GlassRoot isDark={isDark}>
        <AppNavigation />
      </GlassRoot>
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
