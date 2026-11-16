import * as Haptics from 'expo-haptics'
import type { Verdict } from '@/types/api'

export async function triggerTabPressHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch (error) {
    console.warn('Tab press haptic feedback failed.', error)
  }
}

export async function triggerScanResultHaptic(verdict: Verdict): Promise<void> {
  try {
    switch (verdict) {
      case 'SAFE':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        return
      case 'SUSPICIOUS':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        return
      case 'DANGEROUS':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    }
  } catch (error) {
    console.warn('Scan result haptic feedback failed.', error)
  }
}
