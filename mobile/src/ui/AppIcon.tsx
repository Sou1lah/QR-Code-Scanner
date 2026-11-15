import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { colors } from './theme'

type IoniconName = ComponentProps<typeof Ionicons>['name']

const ICONS = {
  home: 'home',
  homeOutline: 'home-outline',
  scanner: 'scan-outline',
  scannerFilled: 'scan',
  history: 'time-outline',
  historyFilled: 'time',
  settings: 'settings-outline',
  settingsFilled: 'settings',
  flash: 'flash-outline',
  flashOn: 'flash',
  image: 'image-outline',
  camera: 'camera-outline',
  link: 'link-outline',
  wifi: 'wifi-outline',
  copy: 'copy-outline',
  open: 'open-outline',
  back: 'chevron-back',
  safe: 'shield-checkmark',
  warning: 'warning',
  danger: 'close-circle',
  shield: 'shield-checkmark-outline',
  shieldFilled: 'shield',
  lock: 'lock-closed-outline',
  globe: 'globe-outline',
  alert: 'alert-circle-outline',
  checkmark: 'checkmark-circle',
  close: 'close-circle-outline',
  trash: 'trash-outline',
  share: 'share-social-outline',
  info: 'information-circle-outline',
  document: 'document-text-outline',
  pulse: 'pulse-outline',
  sunny: 'sunny',
  sunnyOutline: 'sunny-outline',
  moon: 'moon',
  moonOutline: 'moon-outline',
} as const satisfies Record<string, IoniconName>

export type IconName = keyof typeof ICONS

type Props = { name: IconName; size?: number; color?: string }

export function AppIcon({ name, size = 22, color = colors.text }: Props) {
  return <Ionicons name={ICONS[name]} size={size} color={color} />
}
