import { SafeAreaView } from 'react-native-safe-area-context'
import type { PropsWithChildren } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

type Props = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>

export function Screen({ children, style }: Props) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  )
}

const styles = {
  screen: { flex: 1, backgroundColor: 'transparent' } as const,
}
