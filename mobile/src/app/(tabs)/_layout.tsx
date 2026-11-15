import { Tabs } from 'expo-router'
import { Easing } from 'react-native'
import { GlassTabBar } from '@/ui'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <GlassTabBar
          {...props}
          icons={{
            index: { active: 'home', inactive: 'homeOutline' },
            history: { active: 'historyFilled', inactive: 'history' },
            settings: { active: 'settingsFilled', inactive: 'settings' },
          }}
        />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0 },
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          },
        },
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            opacity: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-90, 0, 90],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Homepage' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
