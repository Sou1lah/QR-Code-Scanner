import { Tabs } from 'expo-router'
import { GlassTabBar } from '@/ui'

export default function TabsLayout() {
  return (
    <Tabs
      detachInactiveScreens={false}
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
        lazy: true,
        freezeOnBlur: true,
        animation: 'fade',
        transitionSpec: {
          animation: 'timing',
          config: { duration: 200 },
        },
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            opacity: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                translateY: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [10, 0, -10],
                }),
              },
            ],
          },
        }),
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
