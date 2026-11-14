import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { AppProvider, useAppState } from '@/context/AppContext'

function AppNavigation() {
  const { ready } = useAppState()
  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#0A84FF" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AppNavigation />
    </AppProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080B12',
  },
})
