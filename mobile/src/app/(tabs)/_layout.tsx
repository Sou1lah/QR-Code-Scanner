import { Tabs } from 'expo-router'
import { Text } from 'react-native'

const icons = { index: '▦', history: '◷', settings: '⚙' } as const

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0A84FF',
        tabBarInactiveTintColor: '#7D8492',
        tabBarStyle: {
          backgroundColor: '#10141D',
          borderTopColor: '#252B37',
          height: 66,
          paddingTop: 7,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size, fontWeight: '600' }}>{icons[route.name as keyof typeof icons]}</Text>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Scanner' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
